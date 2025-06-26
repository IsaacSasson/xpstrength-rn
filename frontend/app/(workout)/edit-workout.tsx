import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  LayoutChangeEvent,
  useWindowDimensions,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import Header from "@/components/Header";

/* -------------------------------------------------------------------------- */
/*                               Data & Types                                */
/* -------------------------------------------------------------------------- */

// Types for our workout structure
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

interface Workout {
  name: string;
  days: string[]; // supports multiple days
  exercises: Exercise[];
}

// Type definitions for exercise templates
interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
}

// Sample exercise templates – replace with DB call if you like
const exerciseTemplates: ExerciseTemplate[] = [
  { id: "1", name: "Bench Press", category: "Chest" },
  { id: "2", name: "Squats", category: "Legs" },
  { id: "3", name: "Deadlifts", category: "Back" },
  { id: "4", name: "Pull-ups", category: "Back" },
  { id: "5", name: "Push-ups", category: "Chest" },
  { id: "6", name: "Shoulder Press", category: "Shoulders" },
  { id: "7", name: "Lunges", category: "Legs" },
  { id: "8", name: "Bicep Curls", category: "Arms" },
  { id: "9", name: "Tricep Extensions", category: "Arms" },
  { id: "10", name: "Leg Press", category: "Legs" },
  { id: "11", name: "Lateral Raises", category: "Shoulders" },
  { id: "12", name: "Planks", category: "Core" },
  { id: "13", name: "Crunches", category: "Core" },
  { id: "14", name: "Rows", category: "Back" },
  { id: "15", name: "Calf Raises", category: "Legs" },
];

// Record type mapping one day → one workout (demo data only)
interface WorkoutRecord {
  [key: string]: Workout;
}

const workoutsByDay: WorkoutRecord = {
  Monday: {
    name: "Push Day",
    days: ["Monday"],
    exercises: [
      {
        id: "101",
        name: "Bench Press",
        sets: 4,
        reps: "8-10",
        weight: "185 lbs",
      },
      {
        id: "102",
        name: "Shoulder Press",
        sets: 3,
        reps: "10-12",
        weight: "135 lbs",
      },
      {
        id: "103",
        name: "Incline DB Press",
        sets: 3,
        reps: "10-12",
        weight: "65 lbs",
      },
      {
        id: "104",
        name: "Tricep Extensions",
        sets: 3,
        reps: "12-15",
        weight: "50 lbs",
      },
    ],
  },
  Tuesday: {
    name: "Pull Day",
    days: ["Tuesday"],
    exercises: [
      { id: "201", name: "Deadlifts", sets: 4, reps: "6-8", weight: "225 lbs" },
      {
        id: "202",
        name: "Pull-ups",
        sets: 3,
        reps: "8-10",
        weight: "Body weight",
      },
      {
        id: "203",
        name: "Barbell Rows",
        sets: 3,
        reps: "8-10",
        weight: "135 lbs",
      },
      {
        id: "204",
        name: "Bicep Curls",
        sets: 3,
        reps: "12-15",
        weight: "30 lbs",
      },
    ],
  },
};

// Days of week (order preserved)
const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* -------------------------------------------------------------------------- */
/*                       Generic Expandable Section (height)                  */
/* -------------------------------------------------------------------------- */
const ExpandableSection: React.FC<{
  isExpanded: boolean;
  children: React.ReactNode;
}> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) setContentHeight(height);
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 300,
      useNativeDriver: false, // height anim uses layout
    }).start();
  }, [isExpanded, contentHeight]);

  return (
    <View>
      <Animated.View style={{ height: animation, overflow: "hidden" }}>
        <View onLayout={onMeasure}>{children}</View>
      </Animated.View>
      {/* hidden clone for measurement */}
      <View style={{ position: "absolute", top: 5000, opacity: 0 }}>
        {children}
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                         Exercise Card With Accordion                       */
/* -------------------------------------------------------------------------- */
interface ExpandableExerciseCardProps {
  exercise: Exercise;
  index: number;
  updateExercise: (id: string, field: keyof Exercise, value: any) => void;
  removeExercise: (id: string) => void;
}

const ExpandableExerciseCard: React.FC<ExpandableExerciseCardProps> = ({
  exercise,
  index,
  updateExercise,
  removeExercise,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View className="bg-black-100 rounded-xl mb-4 overflow-hidden">
      {/* Header */}
      <View className="p-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={{ flex: 1 }}
        >
          <View className="flex-row items-center">
            <View className="bg-secondary h-8 w-8 rounded-full items-center justify-center mr-3">
              <Text className="text-white font-pbold">{index + 1}</Text>
            </View>
            <Text className="text-white text-lg font-pmedium">
              {exercise.name}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => removeExercise(exercise.id)}
          className="mr-3"
        >
          <FontAwesome5 name="trash" size={16} color="#FF4D4D" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <FontAwesome5
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#CDCDE0"
          />
        </TouchableOpacity>
      </View>

      <ExpandableSection isExpanded={isExpanded}>
        <View className="p-4 border-t border-black-200">
          {/* Sets */}
          <View className="mb-3">
            <Text className="text-gray-100 font-pmedium mb-1">Sets</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="3"
              placeholderTextColor="#7b7b8b"
              keyboardType="number-pad"
              value={exercise.sets.toString()}
              onChangeText={(t) =>
                updateExercise(exercise.id, "sets", parseInt(t) || 0)
              }
            />
          </View>
          {/* Reps */}
          <View className="mb-3">
            <Text className="text-gray-100 font-pmedium mb-1">Reps</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="10"
              placeholderTextColor="#7b7b8b"
              value={exercise.reps}
              onChangeText={(t) => updateExercise(exercise.id, "reps", t)}
            />
          </View>
          {/* Weight */}
          <View className="mb-3">
            <Text className="text-gray-100 font-pmedium mb-1">Weight</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="Optional"
              placeholderTextColor="#7b7b8b"
              value={exercise.weight}
              onChangeText={(t) => updateExercise(exercise.id, "weight", t)}
            />
          </View>
          {/* Notes */}
          <View>
            <Text className="text-gray-100 font-pmedium mb-1">Notes</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="Optional notes"
              placeholderTextColor="#7b7b8b"
              multiline
              numberOfLines={2}
              value={exercise.notes}
              onChangeText={(t) => updateExercise(exercise.id, "notes", t)}
            />
          </View>
        </View>
      </ExpandableSection>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/*                   DRAGGABLE BOTTOM-SHEET (HEADER ONLY)                     */
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
  const sheetHeight = height * 0.5; // 50 % for demo
  const translateY = useRef(new Animated.Value(sheetHeight)).current;

  /* --------------------------- show / hide anim -------------------------- */
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

  /* ------------------------------ Pan logic ----------------------------- */
  const panResponder = useRef(
    PanResponder.create({
      /* allow drag to start immediately on touch */
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
        }).start(() => {
          if (shouldClose) onClose();
        });
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
      {/* Invisible overlay – not touchable */}
      <View style={{ flex: 1 }} pointerEvents="none" />
      {/* Sheet */}
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
        {/* ---------- Drag handle & title (DRAGGABLE AREA) ---------- */}
        <View
          {...panResponder.panHandlers}
          className="items-center px-4 pt-3 pb-4"
        >
          <View className="w-16 h-1 bg-gray-100 rounded-full mb-4" />
          <Text className="text-white text-xl font-psemibold">Select Days</Text>
        </View>

        {/* ---------- Scrollable content ---------- */}
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
/*                        MAIN EDIT-WORKOUT COMPONENT                         */
/* -------------------------------------------------------------------------- */
const EditWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const params = useLocalSearchParams();
  const dayParam = params.day as string | undefined;

  /* ------------------------------ state ------------------------------ */
  const [workout, setWorkout] = useState<Workout>({
    name: "",
    days: dayParam ? [dayParam] : [daysOfWeek[0]],
    exercises: [],
  });
  const [showDayPicker, setShowDayPicker] = useState(false);

  /* --------------------------- load existing -------------------------- */
  useEffect(() => {
    if (dayParam && workoutsByDay[dayParam]) {
      setWorkout({ ...workoutsByDay[dayParam] });
    }
  }, [dayParam]);

  /* --------------------------- helpers --------------------------- */
  const goBack = () => router.back();
  const generateId = () =>
    `ex_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const addExercise = (template: ExerciseTemplate) => {
    const newExercise: Exercise = {
      id: generateId(),
      name: template.name,
      sets: 3,
      reps: "10",
      weight: "",
      notes: "",
    };
    setWorkout({ ...workout, exercises: [...workout.exercises, newExercise] });
  };

  const removeExercise = (id: string) => {
    Alert.alert("Remove Exercise", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          setWorkout({
            ...workout,
            exercises: workout.exercises.filter((e) => e.id !== id),
          }),
      },
    ]);
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) =>
    setWorkout({
      ...workout,
      exercises: workout.exercises.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      ),
    });

  const toggleDay = (d: string) =>
    setWorkout({
      ...workout,
      days: workout.days.includes(d)
        ? workout.days.filter((x) => x !== d)
        : [...workout.days, d],
    });

  const displayDays = () => {
    const sel = daysOfWeek.filter((d) => workout.days.includes(d));
    if (sel.length === 7) return "Everyday";
    if (
      sel.length === 5 &&
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].every((d) =>
        sel.includes(d)
      )
    )
      return "Weekdays";
    if (sel.length === 2 && sel.includes("Saturday") && sel.includes("Sunday"))
      return "Weekends";
    return sel.join(", ");
  };

  /* ------------------------------- UI ------------------------------- */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#0F0E1A" }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* --------------------------- Header --------------------------- */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <Header MText="Edit Workout" SText="Customize your workout plan" />

            <TouchableOpacity
              onPress={() => {
                if (!workout.name.trim()) {
                  Alert.alert("Error", "Please enter a workout name");
                  return;
                }
                if (!workout.exercises.length) {
                  Alert.alert("Error", "Add at least one exercise");
                  return;
                }
                // TODO: persist to backend
                Alert.alert("Success", "Workout saved!", [
                  { text: "OK", onPress: () => router.back() },
                ]);
              }}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* --------------------------- Body --------------------------- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4 pt-2 pb-20"
      >
        {/* Workout Name */}
        <View
          className="rounded-xl p-4 mb-5"
          style={{ backgroundColor: tertiaryColor }}
        >
          <Text className="text-white font-pmedium mb-2">Workout Name</Text>
          <TextInput
            className="bg-black-200 text-white font-pmedium p-3 rounded-lg"
            placeholder="Enter workout name"
            placeholderTextColor="#7b7b8b"
            value={workout.name}
            onChangeText={(t) => setWorkout({ ...workout, name: t })}
          />
        </View>

        {/* Days Picker */}
        <View
          className="rounded-xl p-4 mb-5"
          style={{ backgroundColor: tertiaryColor }}
        >
          <Text className="text-white font-pmedium mb-2">Workout Days</Text>
          <TouchableOpacity
            className="bg-black-200 flex-row justify-between items-center p-3 rounded-lg"
            onPress={() => setShowDayPicker(true)}
          >
            <Text className="text-white font-pmedium">{displayDays()}</Text>
            <FontAwesome5 name="chevron-down" size={16} color="#CDCDE0" />
          </TouchableOpacity>
        </View>

        {/* Exercises */}
        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-xl font-psemibold">Exercises</Text>
            <TouchableOpacity
              className="flex-row items-center px-3 py-2 rounded-lg"
              style={{ backgroundColor: primaryColor }}
              onPress={() => router.push("/(workout)/exercise-list")}
            >
              <FontAwesome5 name="plus" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {workout.exercises.length === 0 ? (
            <View
              className="rounded-xl p-6 items-center"
              style={{ backgroundColor: tertiaryColor }}
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={50}
                color={primaryColor}
              />
              <Text className="text-white font-pmedium text-center mt-4">
                No exercises added yet
              </Text>
              <Text className="text-gray-100 text-center mt-2 mb-4">
                Tap the "Add Exercise" button to start building your workout
              </Text>
            </View>
          ) : (
            workout.exercises.map((ex, idx) => (
              <ExpandableExerciseCard
                key={ex.id}
                exercise={ex}
                index={idx}
                updateExercise={updateExercise}
                removeExercise={removeExercise}
              />
            ))
          )}
        </View>
      </ScrollView>
      <DraggableBottomSheet
        visible={showDayPicker}
        onClose={() => setShowDayPicker(false)}
        primaryColor={primaryColor}
      >
        {/* children = list + done button */}
        {daysOfWeek.map((day) => {
          const selected = workout.days.includes(day);
          return (
            <TouchableOpacity
              key={day}
              className={`p-4 border-b border-black-200 ${
                selected ? "bg-black-200" : ""
              }`}
              onPress={() => toggleDay(day)}
            >
              <Text
                className="text-lg font-pmedium"
                style={{ color: selected ? primaryColor : "white" }}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          className="bg-black-200 m-4 mt-6 p-4 rounded-xl"
          onPress={() => setShowDayPicker(false)}
        >
          <Text className="text-white font-pmedium text-center">Done</Text>
        </TouchableOpacity>
      </DraggableBottomSheet>
    </KeyboardAvoidingView>
  );
};

export default EditWorkout;
