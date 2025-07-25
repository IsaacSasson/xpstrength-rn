// Path: /components/home/WorkoutEditor.tsx
import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { getTempExercises } from "@/utils/exerciseBuffer";
import Header from "@/components/Header";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import ExerciseCard, { Exercise } from "@/components/home/ExerciseCard";

/* -------------------------------------------------------------------------- */
/*                               Data & Types                                */
/* -------------------------------------------------------------------------- */

interface Workout {
  name: string;
  days: string[];
  exercises: Exercise[];
}

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
        sets: [
          { reps: "8", weight: "185 lbs" },
          { reps: "8", weight: "185 lbs" },
          { reps: "10", weight: "175 lbs" },
          { reps: "10", weight: "175 lbs" }
        ],
        notes: "Focus on controlled movement",
        originalExerciseId: "bench-press" // Add original IDs for existing exercises
      },
      { 
        id: "102", 
        name: "Shoulder Press", 
        sets: [
          { reps: "10", weight: "135 lbs" },
          { reps: "12", weight: "125 lbs" },
          { reps: "12", weight: "125 lbs" }
        ],
        notes: "",
        originalExerciseId: "shoulder-press"
      },
      { 
        id: "103", 
        name: "Incline DB Press", 
        sets: [
          { reps: "10", weight: "65 lbs" },
          { reps: "12", weight: "60 lbs" },
          { reps: "12", weight: "60 lbs" }
        ],
        notes: "",
        originalExerciseId: "incline-dumbbell-press"
      },
    ],
  },
  Tuesday: {
    name: "Pull Day",
    days: ["Tuesday"],
    exercises: [
      { 
        id: "201", 
        name: "Deadlifts", 
        sets: [
          { reps: "6", weight: "225 lbs" },
          { reps: "6", weight: "225 lbs" },
          { reps: "8", weight: "205 lbs" },
          { reps: "8", weight: "205 lbs" }
        ],
        notes: "Keep back straight, engage core",
        originalExerciseId: "deadlift"
      },
      { 
        id: "202", 
        name: "Pull-ups", 
        sets: [
          { reps: "8", weight: "Bodyweight" },
          { reps: "10", weight: "Bodyweight" },
          { reps: "8", weight: "Bodyweight" }
        ],
        notes: "",
        originalExerciseId: "pullups"
      },
    ],
  },
};

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
/*                           WORKOUT EDITOR PROPS                            */
/* -------------------------------------------------------------------------- */
interface WorkoutEditorProps {
  mode: "create" | "edit";
  dayParam?: string;
}

/* -------------------------------------------------------------------------- */
/*                        SHARED WORKOUT EDITOR COMPONENT                    */
/* -------------------------------------------------------------------------- */
const WorkoutEditor: React.FC<WorkoutEditorProps> = ({ mode, dayParam }) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const params = useLocalSearchParams();

  const [workout, setWorkout] = useState<Workout>({
    name: "",
    days: dayParam ? [dayParam] : [daysOfWeek[0]],
    exercises: [],
  });
  const [showDayPicker, setShowDayPicker] = useState(false);

  /* --------------------------- Load existing workout -------------------------- */
  useEffect(() => {
    if (dayParam && workoutsByDay[dayParam] && mode === "edit") {
      setWorkout({ ...workoutsByDay[dayParam] });
    }
  }, [dayParam, mode]);

  /* --------------------------- Check for buffered exercises when component comes into focus -------------------------- */
  useFocusEffect(
    useCallback(() => {
      const bufferedExercises = getTempExercises();
      if (bufferedExercises && bufferedExercises.length > 0) {
        addExercisesFromList(bufferedExercises);
      }
    }, [])
  );

  // Track exercise IDs
  useEffect(() => {
    console.log("Current exercise IDs:", workout.exercises.map(ex => ex.id));
  }, [workout.exercises]);

  /* --------------------------- Helper functions --------------------------- */
  const generateId = () => `ex_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const addExercisesFromList = (exerciseData: any[]) => {
    const newExercises: Exercise[] = exerciseData.map((ex) => ({
      id: generateId(),
      name: ex.name,
      sets: [
        { reps: "10", weight: "0 lbs" },
        { reps: "10", weight: "0 lbs" },
        { reps: "10", weight: "0 lbs" }
      ],
      notes: "",
      originalExerciseId: ex.id, // Store the original exercise ID for navigation
    }));

    // Add to existing exercises (the component instance already has them in state)
    setWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, ...newExercises]
    }));
  };

  const removeExercise = (id: string) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.filter((e) => e.id !== id),
    });
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

  const handleSave = () => {
    if (!workout.name.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return;
    }
    if (!workout.exercises.length) {
      Alert.alert("Error", "Add at least one exercise");
      return;
    }
    
    // TODO: persist to backend
    const action = mode === "create" ? "created" : "updated";
    Alert.alert("Success", `Workout ${action} successfully!`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const navigateToExerciseList = () => {
    router.push({
      pathname: "/home/exercise-list",
      params: {
        returnTo: mode === "create" ? "create-workout" : "edit-workout",
        ...(dayParam && { day: dayParam })
      }
    });
  };

  /* ------------------------------- UI ------------------------------- */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#0F0E1A" }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <Header 
              MText={mode === "create" ? "Create Workout" : "Edit Workout"}
              SText={mode === "create" ? "Create a new workout routine" : "Customize your workout plan"}
            />

            <TouchableOpacity
              onPress={handleSave}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Body */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="flex-1 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Workout Name */}
        <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: tertiaryColor }}>
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
        <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: tertiaryColor }}>
          <Text className="text-white font-pmedium mb-2">Workout Days</Text>
          <TouchableOpacity
            className="bg-black-200 flex-row justify-between items-center p-3 rounded-lg"
            onPress={() => setShowDayPicker(true)}
          >
            <Text className="text-white font-pmedium">{displayDays()}</Text>
            <FontAwesome5 name="chevron-down" size={16} color="#CDCDE0" />
          </TouchableOpacity>
        </View>

        {/* Exercises Section */}
        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-psemibold">
              Exercises {workout.exercises.length > 0 && `(${workout.exercises.length})`}
            </Text>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{ backgroundColor: primaryColor }}
              onPress={navigateToExerciseList}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="plus" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {workout.exercises.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: tertiaryColor }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: primaryColor + "20",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <MaterialCommunityIcons name="dumbbell" size={40} color={primaryColor} />
              </View>
              <Text className="text-white font-pmedium text-lg text-center mb-2">
                No exercises added yet
              </Text>
              <Text className="text-gray-100 text-center leading-6">
                Tap the "Add Exercise" button to start building your workout routine
              </Text>
            </View>
          ) : (
            <View>
              {workout.exercises.map((ex, idx) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  index={idx}
                  onUpdate={updateExercise}
                  onRemove={removeExercise}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Days Picker Bottom Sheet */}
      <DraggableBottomSheet
        visible={showDayPicker}
        onClose={() => setShowDayPicker(false)}
        primaryColor={primaryColor}
        heightRatio={0.5}
        scrollable
        keyboardOffsetRatio={0}
      >
        <Text className="text-white text-xl font-psemibold text-center mb-4">
          Select Days
        </Text>

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

export default WorkoutEditor;