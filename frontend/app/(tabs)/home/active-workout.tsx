import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
  Vibration,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import { useUser } from "@/context/UserProvider";
import { userApi } from "@/services/userApi";
import ActiveWorkoutHeader from "@/components/home/ActiveWorkout/Header";
import ActiveWorkoutFooter from "@/components/home/ActiveWorkout/Footer";
import ActiveWorkoutCard from "@/components/home/ActiveWorkout/CarouselCard";
import ActiveWorkoutAddCard from "@/components/home/ActiveWorkout/AddExerciseCard";
import ReorderModal from "@/components/home/ReorderModal";
import PauseModal from "@/components/home/ActiveWorkout/PauseModal";
import ConfirmCancelModal from "@/components/home/ActiveWorkout/ConfirmCancelModal";
import { getLaunchPreset, getPrewarmedWorkout, clearWorkoutData } from "@/utils/workoutLaunch";
import { makeCacheKey, readCachedSession } from "@/utils/activeWorkoutCache";
import { log } from "@/utils/devLog";
import { getTempExercises } from "@/utils/exerciseBuffer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PREVIEW_SCALE = 0.9;
const CARD_SPACING = 14;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const COL_WIDTH = 80;
const CARD_HEIGHT = 540;
const CHECK_COL_WIDTH = 32;

// Notes sizing constants
const NOTES_MIN_HEIGHT = 120;   // starting box height
const NOTES_MAX_HEIGHT = 240;   // cap before making it scrollable

interface Set { id: number; lbs: number; reps: number; checked?: boolean; }
interface Exercise {
  /** Canonical exercise id (server/library id or local temp) */
  id: string | number;
  /** Stable, per-card unique id used for React keys */
  uid: string;
  name: string;
  images?: string[];
  instructions?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  sets: Set[];
  notes?: string;
}

const ActiveWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const {
    activeSession,
    clearActiveSession,
    unitSystem,
    parseWeight,
    convertWeight,
    getExerciseMeta,
  } = useWorkouts();
  // ⬇️ pull in exercise history + cache updater
  const { exerciseHistory, setExerciseNotes } = useUser();

  /* ---------------------------- workout timer ---------------------------- */
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const id = !paused ? setInterval(() => setElapsed((s) => s + 1), 1000) : undefined;
    return () => { if (id) clearInterval(id as ReturnType<typeof setInterval>); };
  }, [paused]);

  /* ----------------------------- rest timer ------------------------------ */
  const [durMin, setDurMin] = useState(1);
  const [durSec, setDurSec] = useState(0);
  const [restLeft, setRestLeft] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  const [restSheetVisible, setRestSheetVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const hasBuzzedRef = useRef(false);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const buzzRestComplete = async () => {
    try {
      if (Platform.OS === "android") {
        Vibration.vibrate([0, 70, 70, 70, 160, 140, 120, 110], false);
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sleep(80);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sleep(150);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await sleep(130);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const startRest = () => {
    if (restRunning) return;
    const total = durMin * 60 + durSec;
    setRestLeft(total);
    setRestRunning(true);
    setRestSheetVisible(true);
    hasBuzzedRef.current = false;

    restRef.current = setInterval(() => {
      setRestLeft((t) => {
        if (t <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          setRestRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const closeRestSheet = () => {
    if (restRef.current) clearInterval(restRef.current);
    setRestRunning(false);
    setRestLeft(durMin * 60 + durSec);
    setRestSheetVisible(false);
  };

  const resetRest = () => {
    if (restRef.current) clearInterval(restRef.current);
    setRestRunning(false);
    setRestLeft(durMin * 60 + durSec);
    setRestSheetVisible(false);
  };

  useEffect(() => {
    if (restLeft === 0 && !hasBuzzedRef.current) {
      hasBuzzedRef.current = true;
      buzzRestComplete();
    }
  }, [restLeft]);

  const applyPicker = () => {
    setPickerVisible(false);
    const total = durMin * 60 + durSec;
    setRestLeft(total);
    resetRest();
  };

  /* ------------------------------ data init ------------------------------ */
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState<string>("Workout");
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // uid sequence to ensure stable, unique keys for the lifetime of this screen
  const uidSeq = useRef(0);
  const newUid = useCallback((seed: string | number) => {
    const n = uidSeq.current++;
    return `${String(seed)}__${n}`;
  }, []);

  // *** title character limit ***
  const MAX_TITLE_LENGTH = 12;
  const truncateTitle = (title: string): string =>
    title.length <= MAX_TITLE_LENGTH ? title : title.substring(0, MAX_TITLE_LENGTH).trim() + "...";

  const fade = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
  }, [isLoading, fade]);

  // load existing notes from history
  const loadExistingNotes = useCallback((exerciseId: string | number): string => {
    if (!exerciseHistory) return "";
    const historyEntry = exerciseHistory[String(exerciseId)];
    return historyEntry?.notes || "";
  }, [exerciseHistory]);

  // add uid to any exercise object that doesn't have one yet
  const withUid = useCallback((ex: any): Exercise => {
    return {
      ...ex,
      uid: ex.uid ?? newUid(ex.id ?? "x"),
    };
  }, [newUid]);

  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        const prewarmedData = getPrewarmedWorkout();
        if (prewarmedData?.exercises?.length) {
          log("[Workout] Using prewarmed data");
          setWorkoutTitle(prewarmedData.title || "Workout");

          const exercisesWithNotes = prewarmedData.exercises.map((ex: any) =>
            withUid({
              ...ex,
              notes: loadExistingNotes(ex.id) || ex.notes || ""
            })
          );

          setExercises(exercisesWithNotes as Exercise[]);
          setSelectedExerciseIdx(0);
          setIsLoading(false);
          setInitError(null);
          return;
        }

        const preset = getLaunchPreset();

        if (!preset) {
          if (activeSession?.exercises?.length) {
            setWorkoutTitle(activeSession.title || "Workout");
            const exercisesWithNotes = activeSession.exercises.map((ex: any) =>
              withUid({
                ...ex,
                notes: loadExistingNotes(ex.id) || ex.notes || ""
              })
            );
            setExercises(exercisesWithNotes as Exercise[]);
            setSelectedExerciseIdx(0);
            setIsLoading(false);
            setInitError(null);
            return;
          }
          throw new Error("No workout data found");
        }

        const exerciseIds = preset.exercises.map((ex) => ex.id);
        const cacheKey = makeCacheKey(preset.workoutId, unitSystem, exerciseIds);
        const cached = await readCachedSession(cacheKey);

        if (cached?.exercises?.length) {
          log("[Workout] Using cached data");
          setWorkoutTitle(cached.title || "Workout");
          const exercisesWithNotes = cached.exercises.map((ex: any) =>
            withUid({
              ...ex,
              notes: loadExistingNotes(ex.id) || ex.notes || ""
            })
          );
          setExercises(exercisesWithNotes as Exercise[]);
          setSelectedExerciseIdx(0);
          setIsLoading(false);
          setInitError(null);
          return;
        }

        log("[Workout] Building from scratch");
        setWorkoutTitle(preset.name || "Workout");

        const processedExercises = preset.exercises.map((ex) => {
          const meta = getExerciseMeta(ex.id);
          const name = meta?.name || `Exercise ${ex.id}`;

          let sets: Array<{ id: number; reps: number; lbs: number; checked: boolean }>;

          if (Array.isArray(ex.sets) && ex.sets.length > 0) {
            sets = ex.sets.map((s, j) => {
              const reps = Number(s?.reps) || 0;
              let lbs = 0;
              if (s?.weight != null) {
                const parsed = parseWeight(String(s.weight));
                lbs = convertWeight(parsed.value, parsed.unit, unitSystem);
              }
              return { id: j + 1, reps, lbs, checked: false };
            });
          } else {
            const count = ex.setsCount || 3;
            const defaultReps = ex.reps || 10;
            sets = Array.from({ length: count }, (_, j) => ({
              id: j + 1,
              reps: defaultReps,
              lbs: 0,
              checked: false,
            }));
          }

          return withUid({
            id: ex.id,
            name,
            images: meta?.images || [],
            primaryMuscles: meta?.primaryMuscles || [],
            secondaryMuscles: meta?.secondaryMuscles || [],
            sets,
            notes: loadExistingNotes(ex.id) || "",
          });
        });

        setExercises(processedExercises as Exercise[]);
        setSelectedExerciseIdx(0);
        setIsLoading(false);
        setInitError(null);
      } catch (error) {
        console.error("Failed to initialize workout:", error);
        setInitError("Failed to load workout. Please try again.");
        setIsLoading(false);
      }
    };

    initializeWorkout();
  }, [activeSession, unitSystem, getExerciseMeta, parseWeight, convertWeight, loadExistingNotes, withUid]);

  /* -------------------------- sets / notes helpers ----------------------- */
  const addSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx && ex.sets.length
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  id: ex.sets.length + 1,
                  reps: Math.min(ex.sets[ex.sets.length - 1].reps, 9999),
                  lbs: Math.min(ex.sets[ex.sets.length - 1].lbs, 9999),
                  checked: false,
                },
              ],
            }
          : ex
      )
    );

  const removeSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx && ex.sets.length > 1 ? { ...ex, sets: ex.sets.slice(0, -1) } : ex))
    );

  const updateSetField = (exIdx: number, setIdx: number, field: "reps" | "lbs", value: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) }
          : ex
      )
    );

  const firstIncompleteIndex = (sets: Set[]) => sets.findIndex((s) => !s.checked);
  const lastCheckedIndex = (sets: Set[]) => {
    let idx = -1;
    for (let i = 0; i < sets.length; i++) if (sets[i].checked) idx = i;
    return idx;
  };

  const toggleSetChecked = (exIdx: number, setIdx: number) => {
    const ex = exercises[exIdx];
    if (!ex || !ex.sets?.[setIdx]) return;

    const sets = ex.sets;
    const isChecked = !!sets[setIdx].checked;
    const firstOpen = firstIncompleteIndex(sets) === -1 ? sets.length : firstIncompleteIndex(sets);
    const lastDone = lastCheckedIndex(sets);

    if (!isChecked) {
      if (setIdx !== firstOpen) return;

      setExercises((prev) =>
        prev.map((e, i) =>
          i === exIdx ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, checked: true } : s)) } : e
        )
      );
      startRest();
      return;
    }

    if (setIdx !== lastDone) return;

    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, checked: false } : s)) } : e
      )
    );
    resetRest();
  };

  const updateExerciseNotes = (exIdx: number, notes: string) => {
    setExercises((prev) => prev.map((ex, i) => (i === exIdx ? { ...ex, notes } : ex)));
  };

  /* ------------------------- options & modals state ---------------------- */
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [pendingReplaceIdx, setPendingReplaceIdx] = useState<number | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const notesInputRef = useRef<any>(null);

  // dynamic height for notes editor
  const [notesHeight, setNotesHeight] = useState(NOTES_MIN_HEIGHT);

  /* ------------------------- options handlers ---------------------------- */
  const handleNotesPress = () => {
    if (selectedExerciseIdx === null) return;
    const initial = exercises[selectedExerciseIdx]?.notes || "";
    setCurrentNotes(initial);
    setNotesHeight(NOTES_MIN_HEIGHT);
    setIsEditingNotes(false); // tap to edit
    setNotesModalVisible(true);
    setShowOptionsSheet(false);
  };

  // helper: normalize id to number or null
  const toServerExerciseId = (id: unknown): number | null => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  };

  const handleNotesSave = async (notes: string) => {
    if (selectedExerciseIdx === null) return;
    const exercise = exercises[selectedExerciseIdx];
    if (!exercise) return;

    try {
      setNotesSaving(true);
      // Optimistic local update
      updateExerciseNotes(selectedExerciseIdx, notes);

      const serverId = toServerExerciseId((exercise as any).id);
      if (serverId == null) {
        // Cannot persist for exercises without canonical id
        console.warn("[Notes] Skipped save: non-canonical exercise id:", (exercise as any).id);
        setCurrentNotes(notes);
        Alert.alert(
          "Note saved locally",
          "This exercise isn’t linked to a library id yet, so the note can’t be saved to history.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await userApi.saveExerciseNotes(serverId, notes);

      if (!result?.success) {
        // Revert local state if API call failed
        updateExerciseNotes(selectedExerciseIdx, currentNotes);
        Alert.alert(
          "Save Failed",
          result?.error || "Failed to save notes. Please try again.",
          [{ text: "OK" }]
        );
        return;
      }

      // success: reflect in current view + global cache so *new workouts* see it
      setCurrentNotes(notes);
      setExerciseNotes(serverId, notes);
    } catch (error) {
      // Revert local state on error
      updateExerciseNotes(selectedExerciseIdx, currentNotes);
      console.error("❌ Error saving notes:", error);
      Alert.alert(
        "Save Failed",
        "Failed to save notes. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setNotesSaving(false);
    }
  };

  const goToInstructions = () => {
    if (selectedExerciseIdx === null) return;
    const ex = exercises[selectedExerciseIdx];
    router.push({
      pathname: "/home/exercise-detail",
      params: { id: (ex as any).id, scrollTo: "bottom" },
    });
    setShowOptionsSheet(false);
  };

  const handleReplaceExercise = () => {
    if (selectedExerciseIdx === null) return;
    setPendingReplaceIdx(selectedExerciseIdx);
    setShowOptionsSheet(false);
    router.push({
      pathname: "/home/exercise-list",
      params: { action: "replace", returnTo: "active-workout" },
    });
  };

  const handleReorderExercises = () => {
    setShowOptionsSheet(false);
    setShowReorderModal(true);
  };

  const handleReorderComplete = (reorderedExercises: any[]) => {
    setExercises(reorderedExercises as Exercise[]);
    setShowReorderModal(false);
  };

  /* ----------------------- add/replace buffer intake --------------------- */
  const makeLocalExerciseFromList = (ex: any): Exercise => {
    const canonicalOrLocalId =
      ex?.id !== undefined && ex?.id !== null ? ex.id : `aw_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      id: canonicalOrLocalId,
      uid: newUid(canonicalOrLocalId),
      name: ex.name,
      images: ex.images || [],
      instructions: ex.instructions || "",
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      sets: [
        { id: 1, reps: 10, lbs: 0, checked: false },
        { id: 2, reps: 10, lbs: 0, checked: false },
      ],
      notes: "",
    };
  };

  useFocusEffect(
    useCallback(() => {
      const buffered = getTempExercises();
      if (!buffered || buffered.length === 0) return;

      if (pendingReplaceIdx !== null) {
        const src = buffered[0];
        setExercises((prev) => {
          const next = [...prev];
          if (!next[pendingReplaceIdx]) return prev;

          const existingSets = next[pendingReplaceIdx].sets;
          const keepUid = next[pendingReplaceIdx].uid; // preserve card identity
          const newInfo = makeLocalExerciseFromList(src);

          next[pendingReplaceIdx] = {
            ...newInfo,
            uid: keepUid,
            sets: existingSets.map((s, i) => ({
              id: i + 1,
              reps: s.reps,
              lbs: s.lbs,
              checked: false,
            })),
            notes: next[pendingReplaceIdx].notes || "",
          };
          return next;
        });
        setPendingReplaceIdx(null);
        return;
      }

      setExercises((prev) => [...prev, ...buffered.map((b: any) => makeLocalExerciseFromList(b))]);
    }, [pendingReplaceIdx])
  );

  /* -------------------------------- render ------------------------------- */
  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A", paddingHorizontal: 20, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <Text className="text-white font-pbold text-2xl" style={{ textAlign: "center" }}>
          {initError}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-6 py-3 rounded-lg"
            style={{ borderWidth: 1, borderColor: primaryColor }}
          >
            <Text className="text-white font-pmedium">Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace("/home")}
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-pmedium">Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A", justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <ActivityIndicator size="large" color={primaryColor} />
        <Text className="text-white font-pmedium mt-4 text-lg">Loading workout...</Text>
        <Text className="text-gray-100 mt-2 text-center px-8">Preparing your exercises</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ActiveWorkoutHeader
          title={truncateTitle(workoutTitle)}
          elapsedSeconds={elapsed}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          tertiaryColor={tertiaryColor}
          onCancel={() => {
            Alert.alert("Cancel workout?", "", [
              { text: "No" },
              {
                text: "Yes",
                style: "destructive",
                onPress: () => {
                  clearActiveSession();
                  clearWorkoutData();
                  router.replace("/home");
                },
              },
            ]);
          }}
          onPause={() => {
            setPaused(true);
            setPauseModalVisible(true);
          }}
          onFinish={() => {
            const summaries = exercises.map((ex) => ({
              id: (ex as any).id,
              name: (ex as any).name,
              sets: ex.sets.map((s) => ({ reps: s.reps, lbs: s.lbs })),
            }));

            const totalVolume = exercises.reduce(
              (sum, ex) => sum + ex.sets.reduce((acc, s) => acc + s.lbs * s.reps, 0),
              0
            );

            const xpGained = Math.floor(totalVolume / 100);

            clearActiveSession();
            clearWorkoutData();
            router.replace({
              pathname: "/home/finished-workout",
              params: {
                volume: String(totalVolume),
                elapsed: String(elapsed),
                xpGained: String(xpGained),
                level: "12",
                xp: "2863",
                xpNext: "5000",
                ach: "[]",
                ex: JSON.stringify(summaries),
              },
            });
          }}
        />

        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: true,
              listener: (event: any) => {
                const { contentOffset } = event.nativeEvent;
                const index = Math.round(contentOffset.x / (CARD_WIDTH + CARD_SPACING));
                setSelectedExerciseIdx(Math.min(index, Math.max(0, exercises.length - 1)));
              },
            }
          )}
        >
          {exercises.map((ex, exIdx) => {
            const inputRange = [
              (exIdx - 1) * (CARD_WIDTH + CARD_SPACING),
              exIdx * (CARD_WIDTH + CARD_SPACING),
              (exIdx + 1) * (CARD_WIDTH + CARD_SPACING),
            ];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [CARD_PREVIEW_SCALE, 1, CARD_PREVIEW_SCALE],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={ex.uid}
                style={{
                  width: CARD_WIDTH,
                  marginRight: CARD_SPACING,
                  transform: [{ scale }],
                }}
              >
                <ActiveWorkoutCard
                  exercise={ex as any}
                  exIdx={exIdx}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  tertiaryColor={tertiaryColor}
                  CARD_HEIGHT={CARD_HEIGHT}
                  COL_WIDTH={COL_WIDTH}
                  CHECK_COL_WIDTH={CHECK_COL_WIDTH}
                  restLeft={restLeft}
                  restRunning={restRunning}
                  onOpenOptions={(idx) => {
                    setSelectedExerciseIdx(idx);
                    setShowOptionsSheet(true);
                  }}
                  onToggleSetChecked={toggleSetChecked}
                  onUpdateSetField={updateSetField}
                  onAddSet={addSet}
                  onRemoveSet={removeSet}
                  loadIndex={exIdx}
                />
              </Animated.View>
            );
          })}

          {(() => {
            const idx = exercises.length;
            const inputRange = [
              (idx - 1) * (CARD_WIDTH + CARD_SPACING),
              idx * (CARD_WIDTH + CARD_SPACING),
              (idx + 1) * (CARD_WIDTH + CARD_SPACING),
            ];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [CARD_PREVIEW_SCALE, 1, CARD_PREVIEW_SCALE],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key="add_exercise_card"
                style={{
                  width: CARD_WIDTH,
                  marginRight: CARD_SPACING,
                  transform: [{ scale }],
                }}
              >
                <ActiveWorkoutAddCard
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  tertiaryColor={tertiaryColor}
                  CARD_HEIGHT={CARD_HEIGHT}
                />
              </Animated.View>
            );
          })()}
        </Animated.ScrollView>

        <ActiveWorkoutFooter
          durMin={durMin}
          durSec={durSec}
          tertiaryColor={tertiaryColor}
          primaryColor={primaryColor}
          pickerVisible={pickerVisible}
          onOpenPicker={() => setPickerVisible(true)}
          onClosePicker={() => setPickerVisible(false)}
          onChangeMin={(v) => setDurMin(v)}
          onChangeSec={(v) => setDurSec(v)}
          onApplyPicker={applyPicker}
          onStartRest={startRest}
        />

        {/* Rest countdown */}
        <DraggableBottomSheet
          visible={restSheetVisible}
          onClose={closeRestSheet}
          primaryColor={primaryColor}
          heightRatio={0.35}
        >
          {restLeft > 0 ? (
            <View style={{ alignItems: "center", paddingTop: 8 }}>
              <Text className="text-white p-2 font-pbold text-6xl">
                {`${String(Math.floor(restLeft / 60)).padStart(2, "0")}:${String(restLeft % 60).padStart(2, "0")}`}
              </Text>
              <Text className="text-white font-pmedium mt-4">Rest timer running</Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={() => setRestLeft((prev) => Math.max(0, prev - 5))}
                  className="px-4 py-3 rounded-lg"
                  style={{ borderWidth: 1, borderColor: primaryColor }}
                >
                  <Text className="text-white font-pmedium">-5</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeRestSheet}
                  className="px-10 py-3 rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Text className="text-white font-pmedium">Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRestLeft((prev) => prev + 5)}
                  className="px-4 py-3 rounded-lg"
                  style={{ borderWidth: 1, borderColor: primaryColor }}
                >
                  <Text className="text-white font-pmedium">+5</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingTop: 8 }}>
              <Text className="text-white font-pbold text-3xl mt-2">Time is up!</Text>
              <TouchableOpacity
                onPress={closeRestSheet}
                className="mt-6 px-10 py-3 rounded-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Text className="text-white font-pmedium">Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </DraggableBottomSheet>

        <PauseModal
          visible={pauseModalVisible}
          primaryColor={primaryColor}
          onResume={() => {
            setPaused(false);
            setPauseModalVisible(false);
          }}
        />

        {/* Options bottom sheet */}
        <DraggableBottomSheet
          visible={showOptionsSheet}
          onClose={() => setShowOptionsSheet(false)}
          primaryColor={primaryColor}
          heightRatio={0.45}
          scrollable
        >
          {[
            {
              label: "View Exercise Instructions",
              icon: "information-outline",
              onPress: goToInstructions,
            },
            {
              label: notesSaving ? "Saving Notes..." : "Notes",
              icon: "note-text-outline",
              onPress: handleNotesPress,
              disabled: notesSaving,
            },
            {
              label: "Replace Exercise",
              icon: "swap-horizontal",
              onPress: handleReplaceExercise,
            },
            {
              label: "Reorder Exercises",
              icon: "sort-variant",
              onPress: handleReorderExercises,
            },
            {
              label: "Delete",
              icon: "delete-outline",
              onPress: () => {
                if (selectedExerciseIdx !== null) {
                  setExercises((prev) => prev.filter((_, idx) => idx !== selectedExerciseIdx));
                  setSelectedExerciseIdx(null);
                }
                setShowOptionsSheet(false);
              },
              danger: true,
            },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.label}
              className="flex-row items-center p-4 border-b border-black-200"
              onPress={opt.onPress}
              disabled={opt.disabled}
              style={{ opacity: (opt as any).disabled ? 0.5 : 1 }}
            >
              <MaterialCommunityIcons
                name={opt.icon as any}
                size={24}
                color={(opt as any).danger ? "#FF4D4D" : primaryColor}
              />
              <Text
                className="text-lg font-pmedium ml-3"
                style={{ color: (opt as any).danger ? "#FF4D4D" : "white" }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </DraggableBottomSheet>

        {/* Notes Bottom Sheet — tap to edit, auto-grow lines, tap outside to save */}
        <DraggableBottomSheet
          visible={notesModalVisible}
          onClose={() => {
            setNotesModalVisible(false);
            setIsEditingNotes(false);
          }}
          primaryColor={primaryColor}
          heightRatio={0.5}
          scrollable={!isEditingNotes}
          keyboardOffsetRatio={0.7}
        >
          {/* Outside tap: dismiss keyboard -> onBlur saves */}
          <TouchableWithoutFeedback
            onPress={() => {
              if (isEditingNotes) Keyboard.dismiss();
            }}
          >
            <View style={{ padding: 20 }}>
              {/* Exercise Name */}
              {selectedExerciseIdx !== null && (
                <Text className="text-gray-300 font-pmedium text-lg mb-4">
                  {exercises[selectedExerciseIdx]?.name}
                </Text>
              )}

              {/* Notes box */}
              {isEditingNotes ? (
                <View
                  style={{
                    backgroundColor: "#1A1A1A",
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  <TextInput
                    ref={notesInputRef}
                    value={currentNotes}
                    onChangeText={setCurrentNotes}
                    placeholder="Add your notes here..."
                    placeholderTextColor="#666"
                    multiline
                    textAlignVertical="top"
                    style={{
                      height: notesHeight,
                      maxHeight: NOTES_MAX_HEIGHT,
                      color: "white",
                      fontSize: 16,
                      fontFamily: "Poppins-Regular",
                    }}
                    autoFocus
                    onContentSizeChange={(e) => {
                      const h = e.nativeEvent.contentSize.height;
                      const clamped = Math.min(Math.max(h, NOTES_MIN_HEIGHT), NOTES_MAX_HEIGHT);
                      if (clamped !== notesHeight) setNotesHeight(clamped);
                    }}
                    scrollEnabled={notesHeight >= NOTES_MAX_HEIGHT}
                    onBlur={async () => {
                      await handleNotesSave(currentNotes);
                      setIsEditingNotes(false);
                    }}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setIsEditingNotes(true);
                    setTimeout(() => notesInputRef.current?.focus?.(), 0);
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#1A1A1A",
                      padding: 16,
                      borderRadius: 8,
                      minHeight: NOTES_MIN_HEIGHT,
                      maxHeight: NOTES_MAX_HEIGHT,
                    }}
                  >
                    {currentNotes.trim() ? (
                      <ScrollView
                        style={{ maxHeight: NOTES_MAX_HEIGHT - 2 }}
                        keyboardShouldPersistTaps="handled"
                      >
                        <Text className="text-white font-pregular text-base leading-6">
                          {currentNotes}
                        </Text>
                      </ScrollView>
                    ) : (
                      <Text className="text-gray-500 font-pregular text-base italic">
                        Tap here to add notes
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
            </View>
          </TouchableWithoutFeedback>
        </DraggableBottomSheet>

        <ReorderModal
          visible={showReorderModal}
          onClose={() => setShowReorderModal(false)}
          exercises={exercises}
          onReorderComplete={handleReorderComplete}
          primaryColor={primaryColor}
          tertiaryColor={tertiaryColor}
        />

        <ConfirmCancelModal
          visible={false}
          primaryColor={primaryColor}
          tertiaryColor={tertiaryColor}
          onNo={() => {}}
          onYes={() => {}}
        />
      </Animated.View>
    </View>
  );
};

export default ActiveWorkout;