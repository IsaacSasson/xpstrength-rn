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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import { getTempExercises } from "@/utils/exerciseBuffer";
import { transformExerciseFromAPI } from "@/services/workoutApi";
import { validateWorkoutForSave, getDetailedValidationMessage } from "@/utils/workoutValidation";
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

const daysOfWeek = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Map day names to indices for the workout plan array
const dayToIndex: { [key: string]: number } = {
  "Sunday": 0,
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4,
  "Friday": 5,
  "Saturday": 6,
};

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
  const { 
    workoutPlan, 
    getWorkoutById, 
    getWorkoutForDay, 
    exerciseDatabase,
    createWorkout, 
    updateWorkout,
    isLoading: contextLoading 
  } = useWorkouts();

  const [workout, setWorkout] = useState<Workout>({
    name: "",
    days: dayParam ? [dayParam] : [daysOfWeek[0]],
    exercises: [],
  });
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingWorkoutId, setExistingWorkoutId] = useState<number | null>(null);

  /* --------------------------- Load existing workout data -------------------------- */
  useEffect(() => {
    if (mode === "edit" && !contextLoading) {
      setIsLoading(true);
      try {
        // Check if we're editing by workout ID (from workout plans page)
        const workoutIdParam = params.workoutId as string;
        
        if (workoutIdParam) {
          // Edit by workout ID
          const existingWorkout = getWorkoutById(parseInt(workoutIdParam));
          if (existingWorkout) {
            setExistingWorkoutId(existingWorkout.id);
            
            // Transform API exercises to component format
            const transformedExercises = existingWorkout.exercises.map(ex => 
              transformExerciseFromAPI(ex, exerciseDatabase)
            );
            
            setWorkout({
              name: existingWorkout.name,
              days: [], // Don't set any days when editing by ID
              exercises: transformedExercises,
            });
          } else {
            Alert.alert('Error', 'Workout not found');
            router.back();
          }
        } else if (dayParam) {
          // Edit by day (existing logic)
          const dayIndex = dayToIndex[dayParam];
          const existingWorkout = getWorkoutForDay(dayIndex);
          
          if (existingWorkout) {
            setExistingWorkoutId(existingWorkout.id);
            
            // Transform API exercises to component format
            const transformedExercises = existingWorkout.exercises.map(ex => 
              transformExerciseFromAPI(ex, exerciseDatabase)
            );
            
            setWorkout({
              name: existingWorkout.name,
              days: [dayParam], // Start with the current day, user can modify
              exercises: transformedExercises,
            });
          } else {
            // No workout for this day - switch to create mode essentially
            setWorkout(prev => ({ ...prev, days: [dayParam] }));
          }
        }
      } catch (error) {
        console.error('Error loading workout data:', error);
        Alert.alert('Error', 'Failed to load workout data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [mode, dayParam, params.workoutId, contextLoading, getWorkoutById, getWorkoutForDay, exerciseDatabase]);

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

    // Add to existing exercises
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

  const handleSave = async () => {
    // Validate workout data
    const validation = validateWorkoutForSave(workout);
    
    if (!validation.isValid) {
      Alert.alert("Validation Error", getDetailedValidationMessage(validation));
      return;
    }

    setIsSaving(true);
    try {
      let result;

      if (mode === "create") {
        // Create new workout using context
        result = await createWorkout(workout.name, workout.exercises, workout.days);
      } else {
        // Update existing workout using context
        if (!existingWorkoutId) {
          throw new Error('No existing workout ID found for editing');
        }
        
        // Only pass days if we're editing by day (not by workout ID directly)
        const workoutIdParam = params.workoutId as string;
        const daysToUpdate = workoutIdParam ? undefined : workout.days;
        
        result = await updateWorkout(existingWorkoutId, workout.name, workout.exercises, daysToUpdate);
      }

      if (result.success) {
        const action = mode === "create" ? "created" : "updated";
        Alert.alert("Success", `Workout ${action} successfully!`, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        throw new Error(result.error || 'Failed to save workout');
      }

    } catch (error) {
      console.error('Save workout error:', error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save workout");
    } finally {
      setIsSaving(false);
    }
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

  /* ------------------------------- Loading State ------------------------------- */
  if (isLoading || contextLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ color: "white", marginTop: 16, fontSize: 16 }}>Loading workout...</Text>
      </View>
    );
  }

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
              className="px-4 py-2 rounded-lg flex-row items-center"
              style={{ 
                backgroundColor: isSaving ? primaryColor + "50" : primaryColor,
                opacity: isSaving ? 0.7 : 1 
              }}
              disabled={isSaving}
            >
              {isSaving && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
              <Text className="text-white font-pmedium">
                {isSaving ? "Saving..." : "Save"}
              </Text>
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

        {/* Days Picker - Only show if not editing by workout ID */}
        {!params.workoutId && (
          <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: tertiaryColor }}>
            <Text className="text-white font-pmedium mb-2">Workout Days</Text>
            <TouchableOpacity
              className="bg-black-200 flex-row justify-between items-center p-3 rounded-lg"
              onPress={() => setShowDayPicker(true)}
            >
              <Text className="text-white font-pmedium">{displayDays()}</Text>
              <FontAwesome5 name="chevron-down" size={16} color="#CDCDE0" />
            </TouchableOpacity>
            <Text className="text-gray-100 text-xs mt-2">
              Select which days this workout will be scheduled in your weekly plan
            </Text>
          </View>
        )}

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

      {/* Days Picker Bottom Sheet - Only show if not editing by workout ID */}
      {!params.workoutId && (
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
      )}
    </KeyboardAvoidingView>
  );
};

export default WorkoutEditor;