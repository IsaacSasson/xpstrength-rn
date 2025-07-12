// Path: /app/(tabs)/ActiveWorkout.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  TextInput,
  Alert,
  useWindowDimensions,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { useThemeContext } from "@/context/ThemeContext";
import { loadExercises, ExerciseData } from "@/app/utils/loadExercises";

/* ───────── Layout constants ───────── */
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PREVIEW_SCALE = 0.9;
const CARD_SPACING = 14;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const COL_WIDTH = 80;
const MAX_FIELD_VALUE = 9999;
const CARD_HEIGHT = 550;

/* ---------- Local types ---------- */
interface Set {
  id: number;
  lbs: number;
  reps: number;
}
interface Exercise extends ExerciseData {
  sets: Set[];
}

/* -------------------------------------------------------------------------- */
/*                        DRAGGABLE BOTTOM-SHEET (generic)                    */
/* -------------------------------------------------------------------------- */
interface DraggableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  primaryColor: string;
}
const DraggableBottomSheet: React.FC<DraggableBottomSheetProps> = ({
  visible,
  onClose,
  children,
  primaryColor,
}) => {
  const { height } = useWindowDimensions();
  const sheetHeight = height * 0.45;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        translateY.extractOffset();
        translateY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        if (g.dy >= 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        translateY.flattenOffset();
        const shouldClose = g.dy > sheetHeight * 0.25 || g.vy > 0.8;
        Animated.timing(translateY, {
          toValue: shouldClose ? sheetHeight : 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => shouldClose && onClose());
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }} pointerEvents="none" />
      <Animated.View
        style={{
          transform: [{ translateY }],
          height: sheetHeight,
          backgroundColor: "#1C1B29",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 2,
          borderColor: primaryColor,
        }}
      >
        <View
          {...panResponder.panHandlers}
          className="items-center px-4 pt-3 pb-4"
        >
          <View className="w-16 h-1 bg-gray-100 rounded-full mb-4" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */
const ActiveWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  /* ───────── Stopwatch ───────── */
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const id = !paused
      ? setInterval(() => setElapsed((s) => s + 1), 1000)
      : undefined;
    return () => id && clearInterval(id);
  }, [paused]);
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  /* ───────── Rest timer state ───────── */
  const [durMin, setDurMin] = useState(1);
  const [durSec, setDurSec] = useState(0);
  const [restLeft, setRestLeft] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  /* ───────── Rest-timer modal ───────── */
  const [restModalVisible, setRestModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const closeRestModal = () => {
    clearInterval(restRef.current as NodeJS.Timeout);
    setRestRunning(false);
    setRestModalVisible(false);
    fadeAnim.setValue(0);
  };

  const startRest = () => {
    if (restRunning) return;
    const total = durMin * 60 + durSec;
    setRestLeft(total);
    setRestRunning(true);
    setRestModalVisible(true);
    fadeAnim.setValue(0);

    restRef.current = setInterval(() => {
      setRestLeft((t) => {
        if (t <= 1) {
          clearInterval(restRef.current as NodeJS.Timeout);
          setRestRunning(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const resetRest = () => {
    clearInterval(restRef.current as NodeJS.Timeout);
    setRestRunning(false);
    setRestLeft(durMin * 60 + durSec);
    setRestModalVisible(false);
    fadeAnim.setValue(0);
  };

  /* ───────── Picker modal ───────── */
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
          { id: 1, reps: 10, lbs: 0 },
          { id: 2, reps: 10, lbs: 0 },
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
                  reps: Math.min(
                    ex.sets[ex.sets.length - 1].reps,
                    MAX_FIELD_VALUE
                  ),
                  lbs: Math.min(
                    ex.sets[ex.sets.length - 1].lbs,
                    MAX_FIELD_VALUE
                  ),
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

  /* ───────── Inline editing ───────── */
  type EditingState = {
    exIdx: number;
    setIdx: number;
    field: "reps" | "lbs";
  } | null;
  const [editing, setEditing] = useState<EditingState>(null);
  const [editingValue, setEditingValue] = useState("");

  const startEdit = (
    exIdx: number,
    setIdx: number,
    field: "reps" | "lbs",
    current: number
  ) => {
    setEditing({ exIdx, setIdx, field });
    setEditingValue(String(current));
  };

  const finishEdit = () => {
    if (!editing) return;
    let num = parseInt(editingValue, 10);
    if (isNaN(num)) {
      setEditing(null);
      setEditingValue("");
      return;
    }
    num = Math.max(0, Math.min(num, MAX_FIELD_VALUE));
    setExercises((prev) =>
      prev.map((ex, exIdx) =>
        exIdx === editing.exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, sIdx) =>
                sIdx === editing.setIdx ? { ...s, [editing.field]: num } : s
              ),
            }
          : ex
      )
    );
    setEditing(null);
    setEditingValue("");
  };

  /* ───────── Pause controls ───────── */
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const handlePause = () => {
    setPaused(true);
    setPauseModalVisible(true);
  };
  const handleResume = () => {
    setPaused(false);
    setPauseModalVisible(false);
  };

  /* ───────── Cancel confirmation ───────── */
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);
  const showConfirmCancel = () => setConfirmCancelVisible(true);
  const hideConfirmCancel = () => setConfirmCancelVisible(false);
  const doCancelWorkout = () => router.replace("/home");

  /* ───────── FINISH WORKOUT ───────── */
  const handleFinish = () => {
    /* summaries for finished page */
    const summaries = exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      sets: ex.sets.map((s) => ({ reps: s.reps, lbs: s.lbs })),
    }));

    const totalVolume = exercises.reduce(
      (sum, ex) => sum + ex.sets.reduce((acc, s) => acc + s.lbs * s.reps, 0),
      0
    );
    const xpGained = Math.floor(totalVolume / 100);

    router.replace({
      pathname: "/home/finished-workout",
      params: {
        volume: String(totalVolume),
        elapsed: String(elapsed),
        xpGained: String(xpGained),
        level: "12",      // TODO: replace with real user level
        xp: "2863",       // TODO: replace with real current XP
        xpNext: "5000",   // TODO: replace with real threshold
        ach: "[]",
        ex: JSON.stringify(summaries),
      },
    });
  };

  /* ───────── Options bottom-sheet ───────── */
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const openOptionsSheet = (idx: number) => {
    setSelectedExerciseIdx(idx);
    setShowOptionsSheet(true);
  };
  const closeOptionsSheet = () => setShowOptionsSheet(false);

  /* instructions modal */
  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false);
  const [currentInstructions, setCurrentInstructions] = useState("");
  const handleInstructions = () => {
    if (selectedExerciseIdx !== null) {
      setCurrentInstructions(exercises[selectedExerciseIdx].instructions);
      setInstructionsModalVisible(true);
    }
  };

  /* option handlers */
  const handleNotes = () => Alert.alert("Notes", "Open notes editor…");
  const handleReplace = () =>
    Alert.alert("Replace Workout", "Replace workout action…");
  const handleDelete = () => {
    if (selectedExerciseIdx !== null) {
      setExercises((prev) => prev.filter((_, idx) => idx !== selectedExerciseIdx));
      setSelectedExerciseIdx(null);
    }
    closeOptionsSheet();
  };

  /* ───────── Animated scroll logic ───────── */
  const scrollX = useRef(new Animated.Value(0)).current;
  const editableBg = "rgba(255,255,255,0.08)";

  /* -------------------------------------------------------------------- */
  /* ---------------------------   UI  ---------------------------------- */
  /* -------------------------------------------------------------------- */

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* ───────── Header ───────── */}
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pt-4 flex-row items-center justify-between">
          <View>
            <Text
              className="text-lg font-psemibold"
              style={{ color: secondaryColor }}
            >
              Push Day Workout
            </Text>
            <Text
              className="font-psemibold mt-1"
              style={{ color: secondaryColor }}
            >
              {fmt(elapsed)}
            </Text>
          </View>

          <View className="flex-row">
            <TouchableOpacity
              onPress={showConfirmCancel}
              className="px-3 py-2 rounded-lg mr-2"
              style={{ backgroundColor: tertiaryColor }}
            >
              <Text className="text-white font-pmedium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFinish}
              className="px-3 py-2 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ───────── Exercise carousel ───────── */}
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
            outputRange: [CARD_PREVIEW_SCALE, 1, CARD_PREVIEW_SCALE],
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
              <View
                className="rounded-2xl p-4 mt-10"
                style={{ backgroundColor: tertiaryColor, height: CARD_HEIGHT }}
              >
                {/* Card header */}
                <View className="flex-row items-center mb-4">
                  <View className="flex-1 items-center">
                    <Text
                      className="text-2xl font-pbold text-center"
                      style={{ color: secondaryColor }}
                    >
                      {ex.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openOptionsSheet(exIdx)}>
                    <MaterialCommunityIcons
                      name="dots-vertical"
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Table header */}
                <View
                  className="flex-row py-1 mb-2 rounded-lg"
                  style={{ backgroundColor: "#1B1B2E" }}
                >
                  <Text
                    style={{ width: COL_WIDTH, marginLeft: 30 }}
                    className="text-white font-pmedium"
                  >
                    SET
                  </Text>
                  <Text
                    style={{ flex: 1, textAlign: "center", marginRight: 15 }}
                    className="text-white font-pmedium"
                  >
                    REPS
                  </Text>
                  <Text
                    style={{
                      width: COL_WIDTH,
                      textAlign: "right",
                      marginRight: 15,
                    }}
                    className="text-white font-pmedium"
                  >
                    WEIGHT
                  </Text>
                </View>

                {/* Sets list */}
                <ScrollView
                  style={{ flex: 1, marginBottom: 250 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {ex.sets.map((s, setIdx) => (
                    <View
                      key={s.id}
                      className="flex-row mb-2"
                      style={{ minHeight: 32, alignItems: "center" }}
                    >
                      {/* Set # */}
                      <View style={{ width: COL_WIDTH, alignItems: "center" }}>
                        <Text className="text-gray-100">{s.id}</Text>
                      </View>

                      {/* Reps */}
                      <View style={{ flex: 1, alignItems: "center" }}>
                        {editing &&
                        editing.exIdx === exIdx &&
                        editing.setIdx === setIdx &&
                        editing.field === "reps" ? (
                          <TextInput
                            value={editingValue}
                            onChangeText={setEditingValue}
                            onBlur={finishEdit}
                            onSubmitEditing={finishEdit}
                            keyboardType="numeric"
                            autoFocus
                            maxLength={4}
                            style={{
                              color: "#FFFFFF",
                              backgroundColor: editableBg,
                              paddingVertical: 2,
                              paddingHorizontal: 6,
                              borderRadius: 10,
                              minWidth: 60,
                              textAlign: "center",
                            }}
                          />
                        ) : (
                          <TouchableOpacity
                            onPress={() =>
                              startEdit(exIdx, setIdx, "reps", s.reps)
                            }
                            style={{
                              backgroundColor: editableBg,
                              paddingVertical: 2,
                              paddingHorizontal: 6,
                              borderRadius: 10,
                              minWidth: 60,
                            }}
                          >
                            <Text
                              className="text-gray-100"
                              style={{ textAlign: "center" }}
                            >
                              {s.reps}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Weight */}
                      <View style={{ width: COL_WIDTH, alignItems: "center" }}>
                        {editing &&
                        editing.exIdx === exIdx &&
                        editing.setIdx === setIdx &&
                        editing.field === "lbs" ? (
                          <TextInput
                            value={editingValue}
                            onChangeText={setEditingValue}
                            onBlur={finishEdit}
                            onSubmitEditing={finishEdit}
                            keyboardType="numeric"
                            autoFocus
                            maxLength={4}
                            style={{
                              color: "#FFFFFF",
                              backgroundColor: editableBg,
                              paddingVertical: 2,
                              paddingHorizontal: 6,
                              borderRadius: 10,
                              minWidth: 60,
                              textAlign: "center",
                            }}
                          />
                        ) : (
                          <TouchableOpacity
                            onPress={() =>
                              startEdit(exIdx, setIdx, "lbs", s.lbs)
                            }
                            style={{
                              backgroundColor: editableBg,
                              paddingVertical: 2,
                              paddingHorizontal: 6,
                              borderRadius: 10,
                              minWidth: 60,
                            }}
                          >
                            <Text
                              className="text-gray-100"
                              style={{ textAlign: "center" }}
                            >
                              {s.lbs} lbs
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Add / Remove buttons */}
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    onPress={() => removeSet(exIdx)}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: "#FF4C4C" }}
                  >
                    <Text className="text-white font-pmedium">Remove Set</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addSet(exIdx)}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Text className="text-white font-pmedium">Add Set</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* ───────── Bottom timer bar ───────── */}
      <View
        style={{
          position: "relative",
          marginBottom: 2,
          borderTopWidth: 1,
          borderTopColor: "#2E2E42",
          height: 44,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Center clock */}
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: tertiaryColor }}
        >
          <Text className="text-white font-pmedium">
            {durMin}:{String(durSec).padStart(2, "0")}
          </Text>
        </TouchableOpacity>

        {/* Pause */}
        <View style={{ position: "absolute", left: 16 }}>
          <TouchableOpacity
            onPress={handlePause}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: tertiaryColor }}
          >
            <Text className="text-white font-pmedium">Pause</Text>
          </TouchableOpacity>
        </View>

        {/* Start rest */}
        <View style={{ position: "absolute", right: 16 }}>
          <TouchableOpacity
            onPress={startRest}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-pmedium">Start</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ───────── Pause modal ───────── */}
      <Modal visible={pauseModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            className="items-center p-6 rounded-2xl"
            style={{ backgroundColor: "#161622" }}
          >
            <MaterialCommunityIcons
              name="pause-circle-outline"
              size={72}
              color={primaryColor}
            />
            <Text className="text-white font-pbold text-xl mt-4">
              Workout Paused
            </Text>
            <TouchableOpacity
              onPress={handleResume}
              className="mt-6 px-8 py-3 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ───────── Rest-timer modal ───────── */}
      <Modal visible={restModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            style={{
              width: SCREEN_WIDTH * 0.65,
              backgroundColor: "#161622",
              padding: 24,
              borderRadius: 20,
            }}
          >
            <TouchableOpacity
              onPress={closeRestModal}
              style={{ position: "absolute", top: 12, right: 12, padding: 4 }}
            >
              <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {restLeft > 0 ? (
              <View className="items-center mt-6">
                <Text className="text-white p-2 font-pbold text-6xl">
                  {fmt(restLeft)}
                </Text>
                <Text className="text-white font-pmedium mt-4">
                  Rest timer running
                </Text>
              </View>
            ) : (
              <Animated.View
                style={{
                  alignItems: "center",
                  opacity: fadeAnim,
                  marginTop: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="alarm"
                  size={72}
                  color={primaryColor}
                />
                <Text className="text-white font-pbold text-3xl mt-4">
                  Time is up!
                </Text>
                <TouchableOpacity
                  onPress={closeRestModal}
                  className="mt-6 px-10 py-3 rounded-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Text className="text-white font-pmedium">Close</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </Modal>

      {/* ───────── Picker modal ───────── */}
      <Modal visible={pickerOpen} transparent animationType="slide">
        <View className="flex-1 justify-end ">
          <View
            className="pt-4 pb-6 rounded-t-2xl"
            style={{ backgroundColor: "#161622", paddingHorizontal: 24 }}
          >
            <Text className="text-white text-center font-psemibold mb-2">
              Set Rest Timer
            </Text>
            <View className="flex-row justify-center">
              <Picker
                selectedValue={durMin}
                onValueChange={(v: number) => setDurMin(v)}
                style={{ width: 120, color: "#FFF" }}
                itemStyle={{ color: "#FFF" }}
              >
                {[0, 1, 2, 3, 4, 5].map((m) => (
                  <Picker.Item key={m} label={`${m} min`} value={m} />
                ))}
              </Picker>
              <Picker
                selectedValue={durSec}
                onValueChange={(v: number) => setDurSec(v)}
                style={{ width: 120, color: "#FFF" }}
                itemStyle={{ color: "#FFF" }}
              >
                {Array.from({ length: 60 }, (_, i) => i).map((s) => (
                  <Picker.Item key={s} label={`${s}s`} value={s} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              onPress={applyPicker}
              className="mt-4 mx-auto mb-5 px-6 py-2 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ───────── Confirm-cancel modal ───────── */}
      <Modal visible={confirmCancelVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <Animated.View
            style={{
              width: SCREEN_WIDTH * 0.75,
              backgroundColor: "#161622",
              padding: 24,
              borderRadius: 20,
            }}
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={64}
              color={primaryColor}
              style={{ alignSelf: "center" }}
            />
            <Text className="text-white font-pbold text-xl text-center mt-4">
              End workout?
            </Text>
            <Text className="text-gray-100 text-center mt-2">
              All unsaved progress will be lost.
            </Text>

            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={hideConfirmCancel}
                className="px-5 py-3 rounded-lg"
                style={{ backgroundColor: tertiaryColor }}
              >
                <Text className="text-white font-pmedium">No, Keep Going</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={doCancelWorkout}
                className="px-5 py-3 rounded-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Text className="text-white font-pmedium">Yes, Quit</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ───────── Instructions modal ───────── */}
      <Modal
        visible={instructionsModalVisible}
        transparent
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View
            style={{
              width: SCREEN_WIDTH * 0.9,
              height: SCREEN_WIDTH,
              backgroundColor: "#161622",
              padding: 20,
              borderRadius: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text className="text-white font-pbold text-xl">
                Instructions
              </Text>
              <TouchableOpacity
                onPress={() => setInstructionsModalVisible(false)}
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={26}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-gray-100 font-pmedium pr-2 text-base">
                {currentInstructions}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ───────── Options bottom-sheet ───────── */}
      <DraggableBottomSheet
        visible={showOptionsSheet}
        onClose={closeOptionsSheet}
        primaryColor={primaryColor}
      >
        {[
          {
            label: "Instructions",
            icon: "information-outline",
            onPress: handleInstructions,
          },
          { label: "Notes", icon: "note-text-outline", onPress: handleNotes },
          {
            label: "Replace Workout",
            icon: "swap-horizontal",
            onPress: handleReplace,
          },
          {
            label: "Delete",
            icon: "delete-outline",
            onPress: handleDelete,
            danger: true,
          },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.label}
            className="flex-row items-center p-4 border-b border-black-200"
            onPress={() => {
              opt.onPress();
              closeOptionsSheet();
            }}
          >
            <MaterialCommunityIcons
              name={opt.icon as any}
              size={24}
              color={opt.danger ? "#FF4D4D" : "#FFFFFF"}
            />
            <Text
              className="text-lg font-pmedium ml-3"
              style={{ color: opt.danger ? "#FF4D4D" : "white" }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          className="bg-black-200 m-4 mt-6 p-4 rounded-xl"
          onPress={closeOptionsSheet}
        >
          <Text className="text-white font-pmedium text-center">Cancel</Text>
        </TouchableOpacity>
      </DraggableBottomSheet>
    </View>
  );
};

export default ActiveWorkout;
