// Path: /app/(tabs)/ActiveWorkout.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { loadExercises, ExerciseData } from "@/utils/loadExercises";
import ActiveWorkoutHeader from "@/components/home/ActiveWorkout/Header";
import ActiveWorkoutFooter from "@/components/home/ActiveWorkout/Footer";
import ActiveWorkoutCard from "@/components/home/ActiveWorkout/CarouselCard";
import ActiveWorkoutAddCard from "@/components/home/ActiveWorkout/AddExerciseCard";
import ReorderModal from "@/components/home/ReorderModal";

// NEW: use exerciseDatabase so we can resolve names by id (same as Home does)
import { useWorkouts } from "@/context/WorkoutContext";

// Modals still used
import PauseModal from "@/components/home/ActiveWorkout/PauseModal";
import ConfirmCancelModal from "@/components/home/ActiveWorkout/ConfirmCancelModal";
import InstructionsModal from "@/components/home/ActiveWorkout/InstructionsModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PREVIEW_SCALE = 0.9;
const CARD_SPACING = 14;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const COL_WIDTH = 80;
const CARD_HEIGHT = 540;
const CHECK_COL_WIDTH = 32;

interface Set {
  id: number;
  lbs: number;
  reps: number;
  checked?: boolean;
}
interface Exercise extends ExerciseData {
  sets: Set[];
  notes?: string; // Add notes field
}

type PresetParam = {
  name: string;
  exercises: { id: number; reps: number; sets: number }[];
};

const ActiveWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const { exerciseDatabase } = useWorkouts();
  const { preset } = useLocalSearchParams<{ preset?: string }>();

  /* ───────── Stopwatch ───────── */
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const id = !paused
      ? setInterval(() => setElapsed((s) => s + 1), 1000)
      : undefined;
    return () => id && clearInterval(id as ReturnType<typeof setInterval>);
  }, [paused]);

  /* ───────── Rest timer ───────── */
  const [durMin, setDurMin] = useState(1);
  const [durSec, setDurSec] = useState(0);
  const [restLeft, setRestLeft] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  // Bottom sheet visibility for countdown
  const [restSheetVisible, setRestSheetVisible] = useState(false);

  const startRest = () => {
    if (restRunning) return;
    const total = durMin * 60 + durSec;
    setRestLeft(total);
    setRestRunning(true);
    setRestSheetVisible(true);

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

  /* ───────── Picker sheet state ───────── */
  const [pickerOpen, setPickerOpen] = useState(false);
  const applyPicker = () => {
    setPickerOpen(false);
    const total = durMin * 60 + durSec;
    setRestLeft(total);
    resetRest();
  };

  /* ───────── Exercises ───────── */
  const [workoutTitle, setWorkoutTitle] = useState<string>("Workout");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(null);

  // Notes state
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");

  // Reorder state
  const [showReorderModal, setShowReorderModal] = useState(false);

  // UPDATED: hydrate from preset if present; otherwise fall back to demo data
  useEffect(() => {
    const parsePreset = (): PresetParam | null => {
      if (!preset) return null;
      try {
        const raw = Array.isArray(preset) ? preset[0] : preset;
        return JSON.parse(raw) as PresetParam;
      } catch (e) {
        console.warn("Failed to parse preset param:", e);
        return null;
      }
    };

    const p = parsePreset();
    if (p && Array.isArray(p.exercises) && p.exercises.length > 0) {
      setWorkoutTitle(p.name || "Workout");

      const built: Exercise[] = p.exercises.map((ex, idx) => {
        // Try to resolve the name from exerciseDatabase (ids are strings there in Home)
        const dbEntry = exerciseDatabase?.find((d: any) => d.id === String(ex.id));
        const baseName = dbEntry?.name || `Exercise ${ex.id}`;

        // We'll build a minimal ExerciseData-compatible object.
        const baseExercise: ExerciseData = {
          id: ex.id,
          name: baseName,
          images: dbEntry?.images || [],
          instructions: dbEntry?.instructions || "",
        } as any;

        const repsNum = Number.isFinite(ex.reps) ? ex.reps : parseInt(String(ex.reps), 10) || 0;
        const setsCount = Number.isFinite(ex.sets) ? ex.sets : parseInt(String(ex.sets), 10) || 0;

        const setsArray: Set[] = Array.from({ length: Math.max(setsCount, 0) }, (_, i) => ({
          id: i + 1,
          reps: repsNum,
          lbs: 0,
          checked: false,
        }));

        return {
          ...(baseExercise as any),
          sets: setsArray,
          notes: "",
        };
      });

      setExercises(built);
      setSelectedExerciseIdx(0);
      return;
    }

    // Fallback to sample data if no preset provided
    const demo = loadExercises()
      .slice(0, 3)
      .map<Exercise>((ex) => ({
        ...ex,
        sets: [
          { id: 1, reps: 10, lbs: 0, checked: false },
          { id: 2, reps: 10, lbs: 0, checked: false },
        ],
        notes: "",
      }));
    setWorkoutTitle("Push Day Workout");
    setExercises(demo);
    setSelectedExerciseIdx(0);
  }, [preset, exerciseDatabase]);

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
      prev.map((ex, i) =>
        i === exIdx && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.slice(0, -1) }
          : ex
      )
    );

  const updateSetField = (
    exIdx: number,
    setIdx: number,
    field: "reps" | "lbs",
    value: number
  ) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );

  // toggle a set's checkmark and control the rest timer + sheet
  const toggleSetChecked = (exIdx: number, setIdx: number) => {
    const willCheck = !exercises[exIdx]?.sets[setIdx]?.checked;
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIdx ? { ...s, checked: willCheck } : s
              ),
            }
          : ex
      )
    );
    // Start rest timer when checking off a set
    if (willCheck) startRest();
    else resetRest();
  };

  // Update exercise notes
  const updateExerciseNotes = (exIdx: number, notes: string) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, notes } : ex))
    );
  };

  /* ───────── Modal states ───────── */
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const handlePause = () => {
    setPaused(true);
    setPauseModalVisible(true);
  };
  const handleResume = () => {
    setPaused(false);
    setPauseModalVisible(false);
  };

  // Bottom sheet for options
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);
  const showConfirmCancel = () => setConfirmCancelVisible(true);
  const hideConfirmCancel = () => setConfirmCancelVisible(false);
  const doCancelWorkout = () => router.replace("/home");

  // Notes functionality
  const handleNotesPress = () => {
    if (selectedExerciseIdx !== null) {
      setCurrentNotes(exercises[selectedExerciseIdx]?.notes || "");
      setNotesModalVisible(true);
    }
  };

  const handleNotesSave = (notes: string) => {
    if (selectedExerciseIdx !== null) {
      updateExerciseNotes(selectedExerciseIdx, notes);
    }
    setNotesModalVisible(false);
  };

  // Replace workout functionality
  const handleReplaceWorkout = () => {
    Alert.alert(
      "Replace Workout",
      "Go to workout selection to choose a different workout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go to Workouts",
          onPress: () => {
            router.replace("/home");
          },
        },
      ]
    );
  };

  // Reorder exercises functionality
  const handleReorderExercises = () => {
    setShowOptionsSheet(false);
    setShowReorderModal(true);
  };

  const handleReorderComplete = (reorderedExercises: any[]) => {
    setExercises(reorderedExercises);
    setShowReorderModal(false);
  };

  /* ───────── Instructions navigation ───────── */
  const goToInstructions = () => {
    if (selectedExerciseIdx === null) {
      Alert.alert("No Instructions", "Select an exercise to view instructions.");
      return;
    }
    const ex = exercises[selectedExerciseIdx];
    router.push({
      pathname: "/home/exercise-detail",
      params: { id: (ex as any).id, scrollTo: "bottom" },
    });
    setShowOptionsSheet(false);
  };

  /* ───────── Animated scroll logic ───────── */
  const scrollX = useRef(new Animated.Value(0)).current;

  // Track selected exercise based on scroll position
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event: any) => {
        const { contentOffset } = event.nativeEvent;
        const index = Math.round(contentOffset.x / (CARD_WIDTH + CARD_SPACING));
        setSelectedExerciseIdx(Math.min(index, exercises.length - 1));
      },
    }
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header with pause button */}
      <ActiveWorkoutHeader
        title={workoutTitle}
        elapsedSeconds={elapsed}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        tertiaryColor={tertiaryColor}
        onCancel={showConfirmCancel}
        onPause={handlePause} // Add pause handler
        onFinish={() => {
          const summaries = exercises.map((ex) => ({
            id: (ex as any).id,
            name: (ex as any).name,
            sets: ex.sets.map((s) => ({ reps: s.reps, lbs: s.lbs })),
          }));
          const totalVolume = exercises.reduce(
            (sum, ex) =>
              sum + ex.sets.reduce((acc, s) => acc + s.lbs * s.reps, 0),
            0
          );
          const xpGained = Math.floor(totalVolume / 100);

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

      {/* Exercise carousel */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
        onScroll={handleScroll}
      >
        {exercises.map((ex, exIdx) => {
          const inputRange = [
            (exIdx - 1) * (CARD_WIDTH + CARD_SPACING),
            exIdx * (CARD_WIDTH + CARD_SPACING),
            (exIdx + 1) * (CARD_WIDTH + CARD_SPACING),
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: "clamp",
          });

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
                exercise={ex}
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
              />
            </Animated.View>
          );
        })}

        {/* Trailing Add Exercise card */}
        {(() => {
          const idx = exercises.length;
          const inputRange = [
            (idx - 1) * (CARD_WIDTH + CARD_SPACING),
            idx * (CARD_WIDTH + CARD_SPACING),
            (idx + 1) * (CARD_WIDTH + CARD_SPACING),
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
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

      {/* Footer now only controls picker, no rest timer display */}
      <ActiveWorkoutFooter
        durMin={durMin}
        durSec={durSec}
        tertiaryColor={tertiaryColor}
        primaryColor={primaryColor}
        pickerVisible={pickerOpen}
        onOpenPicker={() => setPickerOpen(true)}
        onClosePicker={() => setPickerOpen(false)}
        onChangeMin={(v) => setDurMin(v)}
        onChangeSec={(v) => setDurSec(v)}
        onApplyPicker={applyPicker}
        onStartRest={startRest}
      />

      {/* Rest countdown bottom sheet */}
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
            <Text className="text-white font-pmedium mt-4">
              Rest timer running
            </Text>

            {/* Controls row: -5 | Close | +5 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginTop: 24,
              }}
            >
              <TouchableOpacity
                onPress={() => setRestLeft((prev) => Math.max(0, prev - 5))}
                className="px-4 py-3 rounded-lg"
                style={{
                  borderWidth: 1,
                  borderColor: primaryColor,
                }}
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
                style={{
                  borderWidth: 1,
                  borderColor: primaryColor,
                }}
              >
                <Text className="text-white font-pmedium">+5</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <Text className="text-white font-pbold text-3xl mt-2">
              Time is up!
            </Text>
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

      {/* Remaining modals */}
      <PauseModal
        visible={pauseModalVisible}
        primaryColor={primaryColor}
        onResume={handleResume}
      />

      <ConfirmCancelModal
        visible={confirmCancelVisible}
        primaryColor={primaryColor}
        tertiaryColor={tertiaryColor}
        onNo={hideConfirmCancel}
        onYes={doCancelWorkout}
      />

      {/* Notes Modal */}
      <InstructionsModal
        visible={notesModalVisible}
        text={currentNotes}
        onDismiss={() => setNotesModalVisible(false)}
        onSave={handleNotesSave}
        isEditable={true}
        title="Exercise Notes"
      />

      {/* Reorder Modal */}
      <ReorderModal
        visible={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        exercises={exercises}
        onReorderComplete={handleReorderComplete}
        primaryColor={primaryColor}
        tertiaryColor={tertiaryColor}
      />

      {/* Options bottom-sheet */}
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
            label: "Notes",
            icon: "note-text-outline",
            onPress: handleNotesPress,
          },
          {
            label: "Replace Workout",
            icon: "swap-horizontal",
            onPress: handleReplaceWorkout,
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
                setExercises((prev) =>
                  prev.filter((_, idx) => idx !== selectedExerciseIdx)
                );
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
              color={opt.danger ? "#FF4D4D" : primaryColor}
            />
            <Text
              className="text-lg font-pmedium ml-3"
              style={{ color: opt.danger ? "#FF4D4D" : "white" }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </DraggableBottomSheet>
    </View>
  );
};

export default ActiveWorkout;