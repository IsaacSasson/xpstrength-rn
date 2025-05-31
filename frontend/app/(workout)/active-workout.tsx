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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Picker } from "@react-native-picker/picker";
import { useThemeContext } from "@/context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COL_WIDTH = 70; // consistent column width

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

  /* elapsed stopwatch (header) */
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

  /* rest-timer state */
  const [durMin, setDurMin] = useState(1);
  const [durSec, setDurSec] = useState(0);
  const [restLeft, setRestLeft] = useState(60);
  const [restRunning, setRestRunning] = useState(false);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  /* rest-timer modal + fade animation */
  const [restModalVisible, setRestModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current; // fades “Time is up!”

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

  /* picker modal (choose duration) */
  const [pickerOpen, setPickerOpen] = useState(false);
  const applyPicker = () => {
    setPickerOpen(false);
    const total = durMin * 60 + durSec;
    setRestLeft(total);
    resetRest();
  };

  /* exercises */
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const addSet = (idx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === idx
          ? {
              ...ex,
              sets: [...ex.sets, { id: ex.sets.length + 1, lbs: 0, reps: 10 }],
            }
          : ex
      )
    );
  const removeSet = (idx: number) =>
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === idx && ex.sets.length
          ? { ...ex, sets: ex.sets.slice(0, -1) }
          : ex
      )
    );

  /* navigation */
  const handleCancel = () => router.back();
  const handleFinish = () => router.replace("/");

  /* pause modal (for main stopwatch) */
  const [pauseModalVisible, setPauseModalVisible] = useState(false);
  const handlePause = () => {
    setPaused(true);
    setPauseModalVisible(true);
  };
  const handleResume = () => {
    setPaused(false);
    setPauseModalVisible(false);
  };

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
              onPress={handleCancel}
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
        {exercises.map((ex, idx) => (
          <View
            key={ex.id}
            style={{ width: SCREEN_WIDTH, paddingHorizontal: 16 }}
          >
            <View
              className="rounded-2xl p-4 mt-10"
              style={{ backgroundColor: tertiaryColor }}
            >
              <View className="flex-row items-center mb-5">
                <View className="flex-1 items-center">
                  <Text
                    className="text-2xl font-pbold text-center"
                    style={{ color: secondaryColor }}
                  >
                    {ex.name}
                  </Text>
                </View>
                <TouchableOpacity>
                  <MaterialCommunityIcons
                    name="dots-vertical"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {/* table header */}
              <View
                className="flex-row py-1 mb-2 rounded-lg"
                style={{ backgroundColor: "#1B1B2E" }}
              >
                <Text
                  style={{ width: COL_WIDTH, marginLeft: 8 }}
                  className="text-white font-pmedium"
                >
                  SET
                </Text>
                <Text
                  style={{ flex: 1, textAlign: "center" }}
                  className="text-white font-pmedium"
                >
                  REPS
                </Text>
                <Text
                  style={{ width: COL_WIDTH, textAlign: "right", marginRight: 8 }}
                  className="text-white font-pmedium"
                >
                  WEIGHT
                </Text>
              </View>

              {/* table rows */}
              {ex.sets.map((s) => (
                <View
                  key={s.id}
                  className="flex-row mb-2"
                  style={{ minHeight: 28 }}
                >
                  <Text style={{ width: COL_WIDTH, marginLeft: -15, textAlign: "center" }} className="text-gray-100">
                    {s.id}
                  </Text>
                  <Text
                    style={{ flex: 1, textAlign: "center", marginLeft: 10 }}
                    className="text-gray-100"
                  >
                    {s.reps}
                  </Text>
                  <Text
                    style={{ width: COL_WIDTH, textAlign: "center" }}
                    className="text-gray-100"
                  >
                    {s.lbs}
                  </Text>
                </View>
              ))}

              <View className="flex-row justify-between mt-3">
                <TouchableOpacity
                  onPress={() => removeSet(idx)}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: "#FF4C4C" }}
                >
                  <Text className="text-white font-pmedium">Remove Set</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => addSet(idx)}
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

      {/* ───────── Bottom bar ───────── */}
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

          {/* Start & Reset (right) */}
          <View
            style={{
              position: "absolute",
              right: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
           
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
            {/* close icon inside card */}
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
                style={{ alignItems: "center", opacity: fadeAnim, marginTop: 8 }}
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
        <View className="flex-1 justify-end bg-black/50">
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
    </View>
  );
};

export default ActiveWorkout;
