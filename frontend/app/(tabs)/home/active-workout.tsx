// app/(tabs)/home/active-workout.tsx
import React, { useEffect, useRef, useState } from "react";
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
import { router } from "expo-router";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import ActiveWorkoutHeader from "@/components/home/ActiveWorkout/Header";
import ActiveWorkoutFooter from "@/components/home/ActiveWorkout/Footer";
import ActiveWorkoutCard from "@/components/home/ActiveWorkout/CarouselCard";
import ActiveWorkoutAddCard from "@/components/home/ActiveWorkout/AddExerciseCard";
import ReorderModal from "@/components/home/ReorderModal";
import PauseModal from "@/components/home/ActiveWorkout/PauseModal";
import ConfirmCancelModal from "@/components/home/ActiveWorkout/ConfirmCancelModal";
import InstructionsModal from "@/components/home/ActiveWorkout/InstructionsModal";
import { getLaunchPreset, getPrewarmedWorkout, clearWorkoutData } from "@/utils/workoutLaunch";
import { makeCacheKey, readCachedSession } from "@/utils/activeWorkoutCache";
import { log } from "@/utils/devLog";

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

  /* ───────── Component State ───────── */
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState<string>("Workout");
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  // fade-in for content only (keep background solid to avoid white flash)
  const fade = useRef(new Animated.Value(0)).current;

  /* ───────── Stopwatch ───────── */
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);

  /* ───────── Rest timer ───────── */
  const [durMin, setDurMin] = useState(1);
  const [durSec, setDurSec] = useState(0);
  const [restLeft, setRestLeft] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  const [restSheetVisible, setRestSheetVisible] = useState(false);
  const hasBuzzedRef = useRef(false);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /* ───────── Scroll position (MOVED ABOVE RETURNS) ───────── */
  const scrollX = useRef(new Animated.Value(0)).current;

  /* ───────── Effects ───────── */
  useEffect(() => {
    if (!isLoading) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
  }, [isLoading, fade]);

  useEffect(() => {
    const id = !paused ? setInterval(() => setElapsed((s) => s + 1), 1000) : undefined;
    return () => id && clearInterval(id as ReturnType<typeof setInterval>);
  }, [paused]);

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

  /* ───────── Smart Data Loading ───────── */
  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        const prewarmedData = getPrewarmedWorkout();
        if (prewarmedData?.exercises?.length) {
          log("[Workout] Using prewarmed data");
          setWorkoutTitle(prewarmedData.title || "Workout");
          setExercises(prewarmedData.exercises as Exercise[]);
          setSelectedExerciseIdx(0);
          setIsLoading(false);
          setInitError(null);
          return;
        }

        const preset = getLaunchPreset();

        if (!preset) {
          if (activeSession?.exercises?.length) {
            setWorkoutTitle(activeSession.title || "Workout");
            setExercises(activeSession.exercises as Exercise[]);
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
          setExercises(cached.exercises as Exercise[]);
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

          return {
            id: ex.id,
            name,
            images: meta?.images || [],
            primaryMuscles: meta?.primaryMuscles || [],
            secondaryMuscles: meta?.secondaryMuscles || [],
            sets,
            notes: "",
          };
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
  }, [activeSession, unitSystem, getExerciseMeta, parseWeight, convertWeight]);

  /* ───────── Add/Remove/Toggle set logic ───────── */
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

  const startRestLocal = () => startRest();
  const resetRestLocal = () => resetRest();

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
      startRestLocal();
      return;
    }

    if (setIdx !== lastDone) return;

    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIdx ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, checked: false } : s)) } : e
      )
    );
    resetRestLocal();
  };

  const updateExerciseNotes = (exIdx: number, notes: string) => {
    setExercises((prev) => prev.map((ex, i) => (i === exIdx ? { ...ex, notes } : ex)));
  };

  /* ───────── Error State ───────── */
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

  /* ───────── Loading State ───────── */
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

  /* ───────── Main Workout Interface (fades in) ───────── */
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ActiveWorkoutHeader
          title={workoutTitle}
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
          removeClippedSubviews
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

            const isActive = selectedExerciseIdx === exIdx;

            return (
              <Animated.View
                key={(ex as any).id ?? exIdx}
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
                  deferHeavy={!isActive}
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
                key="__add_card__"
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
          pickerVisible={false}
          onOpenPicker={() => {}}
          onClosePicker={() => {}}
          onChangeMin={(v) => setDurMin(v)}
          onChangeSec={(v) => setDurSec(v)}
          onApplyPicker={() => {}}
          onStartRest={startRest}
        />

        <PauseModal
          visible={pauseModalVisible}
          primaryColor={primaryColor}
          onResume={() => {
            setPaused(false);
            setPauseModalVisible(false);
          }}
        />

        <ConfirmCancelModal
          visible={false}
          primaryColor={primaryColor}
          tertiaryColor={tertiaryColor}
          onNo={() => {}}
          onYes={() => {}}
        />

        <InstructionsModal
          visible={false}
          text={""}
          onDismiss={() => {}}
          onSave={() => {}}
          isEditable={true}
          title="Exercise Notes"
        />

        <ReorderModal
          visible={false}
          onClose={() => {}}
          exercises={exercises}
          onReorderComplete={() => {}}
          primaryColor={primaryColor}
          tertiaryColor={tertiaryColor}
        />
      </Animated.View>
    </View>
  );
};

export default ActiveWorkout;