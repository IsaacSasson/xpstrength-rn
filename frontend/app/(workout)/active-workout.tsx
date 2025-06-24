// Path: /app/(workout)/active-workout.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { useThemeContext } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COL_WIDTH = 80;              // room for “9999 lbs”
const MAX_FIELD_VALUE = 9999;
const CARD_HEIGHT = 550;           // tweak this to make cards taller / shorter

/* ---------- sample data ---------- */
interface Set {
  id: number;
  lbs: number;
  reps: number;
}
interface Exercise {
  id: string;
  name: string;
  sets: Set[];
}
const initialExercises: Exercise[] = [
  {
    id: "e1",
    name: "3/4 Sit-Up",
    sets: [
      { id: 1, lbs: 0, reps: 10 },
      { id: 2, lbs: 0, reps: 10 },
    ],
  },
  {
    id: "e2",
    name: "Bench Press",
    sets: [
      { id: 1, lbs: 185, reps: 8 },
      { id: 2, lbs: 195, reps: 6 },
    ],
  },
  {
    id: "e3",
    name: "Lat Pulldown",
    sets: [
      { id: 1, lbs: 120, reps: 10 },
      { id: 2, lbs: 130, reps: 8 },
    ],
  },
];

/* ---------- component ---------- */
const ActiveWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  /* ───────── Stopwatch ───────── */
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const id = !paused ? setInterval(() => setElapsed((s) => s + 1), 1000) : undefined;
    return () => id && clearInterval(id);
  }, [paused]);
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

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
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
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
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);

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
                  reps: Math.min(ex.sets[ex.sets.length - 1].reps, MAX_FIELD_VALUE),
                  lbs: Math.min(ex.sets[ex.sets.length - 1].lbs, MAX_FIELD_VALUE),
                },
              ],
            }
          : ex,
      ),
    );

  const removeSet = (exIdx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx && ex.sets.length > 1 ? { ...ex, sets: ex.sets.slice(0, -1) } : ex,
      ),
    );

  /* ───────── Inline editing ───────── */
  type EditingState = { exIdx: number; setIdx: number; field: "reps" | "lbs" } | null;
  const [editing, setEditing] = useState<EditingState>(null);
  const [editingValue, setEditingValue] = useState("");

  const startEdit = (exIdx: number, setIdx: number, field: "reps" | "lbs", current: number) => {
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
                sIdx === editing.setIdx ? { ...s, [editing.field]: num } : s,
              ),
            }
          : ex,
      ),
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

  /* ───────── NEW: cancel confirmation ───────── */
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);
  const showConfirmCancel = () => setConfirmCancelVisible(true);
  const hideConfirmCancel = () => setConfirmCancelVisible(false);
  const doCancelWorkout = () => router.replace("/home");

  const handleFinish = () => router.replace("/"); // existing finish action
  const editableBg = "rgba(255,255,255,0.08)";

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* ───────── Header ───────── */}
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-psemibold" style={{ color: secondaryColor }}>
              Push Day Workout
            </Text>
            <Text className="font-psemibold mt-1" style={{ color: secondaryColor }}>
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
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {exercises.map((ex, exIdx) => (
          <View key={ex.id} style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}>
            <View
              className="rounded-2xl p-4 mt-10"
              style={{ backgroundColor: tertiaryColor, height: CARD_HEIGHT }}
            >
              {/* Card header */}
              <View className="flex-row items-center mb-4">
                <View className="flex-1 items-center">
                  <Text className="text-2xl font-pbold text-center" style={{ color: secondaryColor }}>
                    {ex.name}
                  </Text>
                </View>
                <MaterialCommunityIcons name="dots-vertical" size={20} color="#FFFFFF" />
              </View>

              {/* Table header */}
              <View className="flex-row py-1 mb-2 rounded-lg" style={{ backgroundColor: "#1B1B2E" }}>
                <Text style={{ width: COL_WIDTH, marginLeft: 30 }} className="text-white font-pmedium">
                  SET
                </Text>
                <Text style={{ flex: 1, textAlign: "center", marginRight: 15 }} className="text-white font-pmedium">
                  REPS
                </Text>
                <Text
                  style={{ width: COL_WIDTH, textAlign: "right", marginRight: 15 }}
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
                          onPress={() => startEdit(exIdx, setIdx, "reps", s.reps)}
                          style={{
                            backgroundColor: editableBg,
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 10,
                            minWidth: 60,
                          }}
                        >
                          <Text className="text-gray-100" style={{ textAlign: "center" }}>
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
                          onPress={() => startEdit(exIdx, setIdx, "lbs", s.lbs)}
                          style={{
                            backgroundColor: editableBg,
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 10,
                            minWidth: 60,
                          }}
                        >
                          <Text className="text-gray-100" style={{ textAlign: "center" }}>
                            {s.lbs} lbs
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Add / Remove buttons pinned to bottom */}
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
          </View>
        ))}
      </ScrollView>

      {/* ───────── Bottom timer bar ───────── */}
      <SafeAreaView edges={["bottom"]}>
        <View
          style={{
            position: "relative",
            marginBottom: 10,
            borderTopWidth: 1,
            borderTopColor: "#2E2E42",
            height: 64,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Center clock (opens picker) */}
          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: tertiaryColor }}
          >
            <Text className="text-white font-pmedium">
              {durMin}:{String(durSec).padStart(2, "0")}
            </Text>
          </TouchableOpacity>

          {/* Pause (left) */}
          <View style={{ position: "absolute", left: 16 }}>
            <TouchableOpacity
              onPress={handlePause}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: tertiaryColor }}
            >
              <Text className="text-white font-pmedium">Pause</Text>
            </TouchableOpacity>
          </View>

          {/* Start rest (right) */}
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
      </SafeAreaView>

      {/* ───────── Pause modal ───────── */}
      <Modal visible={pauseModalVisible} transparent animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="items-center p-6 rounded-2xl" style={{ backgroundColor: "#161622" }}>
            <MaterialCommunityIcons name="pause-circle-outline" size={72} color={primaryColor} />
            <Text className="text-white font-pbold text-xl mt-4">Workout Paused</Text>
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
                <Text className="text-white p-2 font-pbold text-6xl">{fmt(restLeft)}</Text>
                <Text className="text-white font-pmedium mt-4">Rest timer running</Text>
              </View>
            ) : (
              <Animated.View style={{ alignItems: "center", opacity: fadeAnim, marginTop: 8 }}>
                <MaterialCommunityIcons name="alarm" size={72} color={primaryColor} />
                <Text className="text-white font-pbold text-3xl mt-4">Time is up!</Text>
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
            <Text className="text-white text-center font-psemibold mb-2">Set Rest Timer</Text>
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

      {/* ───────── Cancel confirmation modal ───────── */}
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
    </View>
  );
};

export default ActiveWorkout;
