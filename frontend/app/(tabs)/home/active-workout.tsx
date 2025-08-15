// Path: /app/(tabs)/ActiveWorkout.tsx
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
} from "react-native";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import { useUser } from "@/context/UserProvider";
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
import { workoutLoggingApi, convertExerciseToLogFormat } from "@/services/workoutLoggingApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PREVIEW_SCALE = 0.9;
const CARD_SPACING = 14;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const COL_WIDTH = 80;
const CARD_HEIGHT = 540;
const CHECK_COL_WIDTH = 32;

interface Set { id: number; lbs: number; reps: number; checked?: boolean; }
interface Exercise {
  id: string | number;
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
  const { exerciseHistory } = useUser();

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
  const [isFinishing, setIsFinishing] = useState(false);

  const uidSeq = useRef(0);
  const newUid = useCallback((seed: string | number) => {
    const n = uidSeq.current++;
    return `${String(seed)}__${n}`;
  }, []);

  // Avoid re-loading notes into exercises more than once per unique card
  const notesLoadedRef = useRef(new Set<string>());

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

  /* ---------- Make loadExistingNotes stable regardless of exerciseHistory changes ---------- */
  const exerciseHistoryRef = useRef(exerciseHistory);
  useEffect(() => {
    exerciseHistoryRef.current = exerciseHistory;
  }, [exerciseHistory]);

  const loadExistingNotes = useCallback((exerciseId: string | number): string => {
    const hist = exerciseHistoryRef.current as any;
    const entry = hist?.[String(exerciseId)];
    return entry?.notes || "";
  }, []);

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

          const exercisesWithNotes = prewarmedData.exercises.map((ex: any) => {
            const uid = ex.uid ?? newUid(ex.id ?? "x");
            const notesKey = `${uid}_notes_loaded`;

            if (!notesLoadedRef.current.has(notesKey)) {
              notesLoadedRef.current.add(notesKey);
              return withUid({
                ...ex,
                notes: loadExistingNotes(ex.id) || ex.notes || ""
              });
            }

            return withUid(ex);
          });

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
            const exercisesWithNotes = activeSession.exercises.map((ex: any) => {
              const uid = ex.uid ?? newUid(ex.id ?? "x");
              const notesKey = `${uid}_notes_loaded`;

              if (!notesLoadedRef.current.has(notesKey)) {
                notesLoadedRef.current.add(notesKey);
                return withUid({
                  ...ex,
                  notes: loadExistingNotes(ex.id) || ex.notes || ""
                });
              }

              return withUid(ex);
            });
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
          const exercisesWithNotes = cached.exercises.map((ex: any) => {
            const uid = ex.uid ?? newUid(ex.id ?? "x");
            const notesKey = `${uid}_notes_loaded`;

            if (!notesLoadedRef.current.has(notesKey)) {
              notesLoadedRef.current.add(notesKey);
              return withUid({
                ...ex,
                notes: loadExistingNotes(ex.id) || ex.notes || ""
              });
            }

            return withUid(ex);
          });
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
              let displayWeight = 0;
              if (s?.weight != null) {
                const parsed = parseWeight(String(s.weight));
                displayWeight = convertWeight(parsed.value, parsed.unit, unitSystem);
              }
              return { id: j + 1, reps, lbs: displayWeight, checked: false };
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

          const uid = newUid(ex.id);
          const notesKey = `${uid}_notes_loaded`;

          let notes = "";
          if (!notesLoadedRef.current.has(notesKey)) {
            notesLoadedRef.current.add(notesKey);
            notes = loadExistingNotes(ex.id);
          }

          return withUid({
            id: ex.id,
            name,
            images: meta?.images || [],
            primaryMuscles: meta?.primaryMuscles || [],
            secondaryMuscles: meta?.secondaryMuscles || [],
            sets,
            notes,
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
    // Dependencies intentionally exclude exerciseHistory so notes saves won't rebuild the workout.
    // loadExistingNotes is stable due to reading from a ref.
  }, [activeSession, unitSystem, getExerciseMeta, parseWeight, convertWeight, loadExistingNotes, withUid, newUid]);

  /* ---------- When exerciseHistory changes, update only the 'notes' field in-place ---------- */
  useEffect(() => {
    if (!exerciseHistory) return;
    setExercises((prev) =>
      prev.map((ex) => {
        const nextNotes = (exerciseHistory as any)?.[String(ex.id)]?.notes;
        if (typeof nextNotes === "string" && nextNotes !== ex.notes) {
          return { ...ex, notes: nextNotes };
        }
        return ex;
      })
    );
  }, [exerciseHistory]);

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
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [pendingReplaceIdx, setPendingReplaceIdx] = useState<number | null>(null);

  /* ------------------------- options handlers ---------------------------- */
  const goToDetails = () => {
    if (selectedExerciseIdx === null) return;
    const ex = exercises[selectedExerciseIdx];
    router.push({
      pathname: "/home/exercise-detail",
      params: { id: (ex as any).id },
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
          const keepUid = next[pendingReplaceIdx].uid;
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
    }, [pendingReplaceIdx, newUid])
  );

  /* ----------------------- Finish workout with real API ----------------------- */
  const handleFinishWorkout = async () => {
    try {
      setIsFinishing(true);

      const apiExercises = exercises
        .filter(ex => ex.sets.some(set => set.checked))
        .map(ex => convertExerciseToLogFormat(ex, convertWeight, unitSystem));

      if (apiExercises.length === 0) {
        Alert.alert("No completed exercises", "You need to complete at least one set to finish your workout.");
        return;
      }

      const totalVolumeLbs = exercises.reduce(
        (sum, ex) => sum + ex.sets
          .filter(s => s.checked)
          .reduce((acc, s) => {
            const wLbs = unitSystem === "metric" ? convertWeight(s.lbs, "metric", "imperial") : s.lbs;
            return acc + wLbs * s.reps;
          }, 0),
        0
      );

      const workoutPayload = {
        length: elapsed,
        exercises: apiExercises
      };

      const result = await workoutLoggingApi.logWorkout(workoutPayload);

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to save workout");
        return;
      }

      clearActiveSession();
      clearWorkoutData();

      router.replace({
        pathname: "/home/finished-workout",
        params: {
          volume: String(totalVolumeLbs),
          elapsed: String(elapsed),
          xpGained: String(result.userGainedXP || 0),
          events: JSON.stringify(result.events || []),
          muscleCategoryXP: JSON.stringify(result.muscleCategoryGainedXP || {}),
        },
      });
    } catch (error) {
      console.error("❌ Error finishing workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setIsFinishing(false);
    }
  };

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
          onFinish={handleFinishWorkout}
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
          heightRatio={0.4}
          scrollable
        >
          {[
            {
              label: "View Exercise Details",
              icon: "information-outline",
              onPress: goToDetails,
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

        <ReorderModal
          visible={showReorderModal}
          onClose={() => setShowReorderModal(false)}
          exercises={exercises}
          onReorderComplete={handleReorderComplete}
          primaryColor={primaryColor}
          tertiaryColor={tertiaryColor}
        />

        {isFinishing && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="text-white font-pmedium mt-4 text-lg">Saving workout...</Text>
          </View>
        )}

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