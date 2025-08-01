// Path: /app/(tabs)/ActiveWorkout.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StatusBar,
  Dimensions,
  Animated,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { useThemeContext } from "@/context/ThemeContext";
import { loadExercises, ExerciseData } from "@/utils/loadExercises";
import ActiveWorkoutHeader from "@/components/home//ActiveWorkout/Header";
import ActiveWorkoutFooter from "@/components/home/ActiveWorkout/Footer";
import ActiveWorkoutCard from "@/components/home/ActiveWorkout/CarouselCard";
import ActiveWorkoutAddCard from "@/components/home/ActiveWorkout/AddExerciseCard";

// Modals still used
import PauseModal from "@/components/home/ActiveWorkout/PauseModal";
// REMOVED: RestPickerModal (picker now handled by DraggableBottomSheet in Footer)
import ConfirmCancelModal from "@/components/home/ActiveWorkout/ConfirmCancelModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PREVIEW_SCALE = 0.9;
const CARD_SPACING = 14;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const COL_WIDTH = 80;
const CARD_HEIGHT = 550;
const CHECK_COL_WIDTH = 32;

interface Set {
  id: number;
  lbs: number;
  reps: number;
  checked?: boolean;
}
interface Exercise extends ExerciseData {
  sets: Set[];
}

const ActiveWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

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

  /* ───────── Picker sheet state (replaces RestPickerModal) ───────── */
  const [pickerOpen, setPickerOpen] = useState(false);
  const applyPicker = () => {
    setPickerOpen(false);
    const total = durMin * 60 + durSec;
    setRestLeft(total);
    resetRest();
  };

  /* ───────── Exercises ───────── */
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(
    null
  );

  useEffect(() => {
    const data = loadExercises()
      .slice(0, 3)
      .map<Exercise>((ex) => ({
        ...ex,
        sets: [
          { id: 1, reps: 10, lbs: 0, checked: false },
          { id: 2, reps: 10, lbs: 0, checked: false },
        ],
      }));
    setExercises(data);
  }, []);

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
    if (willCheck) startRest();
    else resetRest();
  };

  /* ───────── Separate modal states ───────── */
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

  /* ───────── Instructions navigation (same logic as ExerciseCard) ───────── */
  const goToInstructions = () => {
    if (selectedExerciseIdx === null) {
      Alert.alert("No Instructions", "Select an exercise to view instructions.");
      return;
    }
    const ex = exercises[selectedExerciseIdx];
    router.push({
      pathname: "/home/exercise-detail",
      params: { id: ex.id, scrollTo: "bottom" },
    });
    setShowOptionsSheet(false);
  };

  /* ───────── Animated scroll logic ───────── */
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <ActiveWorkoutHeader
        title="Push Day Workout"
        elapsedSeconds={elapsed}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        tertiaryColor={tertiaryColor}
        onCancel={showConfirmCancel}
        onFinish={() => {
          const summaries = exercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
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
            outputRange: [0.9, 1, 0.9],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={ex.id}
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

      {/* Footer now controls BOTH sheets (rest + picker) */}
      <ActiveWorkoutFooter
        durMin={durMin}
        durSec={durSec}
        tertiaryColor={tertiaryColor}
        primaryColor={primaryColor}
        restLeft={restLeft}
        restVisible={restSheetVisible}
        pickerVisible={pickerOpen}
        onPause={() => {
          setPaused(true);
          setPauseModalVisible(true);
        }}
        onOpenPicker={() => setPickerOpen(true)}
        onClosePicker={() => setPickerOpen(false)}
        onChangeMin={(v) => setDurMin(v)}
        onChangeSec={(v) => setDurSec(v)}
        onApplyPicker={applyPicker}
        onStartRest={startRest}
        onCloseRest={closeRestSheet}
        // adjust the running rest timer by ±seconds
        onAdjustRest={(delta) => {
          setRestLeft((prev) => Math.max(0, prev + delta));
        }}
      />

      {/* Remaining modals */}
      <PauseModal
        visible={pauseModalVisible}
        primaryColor={primaryColor}
        onResume={() => {
          setPaused(false);
          setPauseModalVisible(false);
        }}
      />

      <ConfirmCancelModal
        visible={confirmCancelVisible}
        primaryColor={primaryColor}
        tertiaryColor={tertiaryColor}
        onNo={hideConfirmCancel}
        onYes={doCancelWorkout}
      />

      {/* Options bottom-sheet (STYLING reverted to your original) */}
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
            onPress: () => {
              goToInstructions();
              setShowOptionsSheet(false);
            },
          },
          {
            label: "Notes",
            icon: "note-text-outline",
            onPress: () => Alert.alert("Notes", "Open notes editor…"),
          },
          {
            label: "Replace Workout",
            icon: "swap-horizontal",
            onPress: () =>
              Alert.alert("Replace Workout", "Replace workout action…"),
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
            <Animated.Text
              className="text-lg font-pmedium ml-3"
              style={{ color: opt.danger ? "#FF4D4D" : "white" }}
            >
              {opt.label}
            </Animated.Text>
          </TouchableOpacity>
        ))}
      </DraggableBottomSheet>
    </View>
  );
};

export default ActiveWorkout;
