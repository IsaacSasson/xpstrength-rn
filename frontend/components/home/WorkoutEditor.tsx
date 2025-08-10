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

// Map day names to indices for the workout plan array (API enum: Sunday..Saturday)
const dayToIndex: { [key: string]: number } = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

// Reverse map for deriving day names from plan indices (Sunday..Saturday)
const indexToDay = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* -------------------------------------------------------------------------- */
/*                        SHARED WORKOUT EDITOR COMPONENT                    */
/* -------------------------------------------------------------------------- */
interface WorkoutEditorProps {
  mode: "create" | "edit";
  dayParam?: string;
}

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
    isLoading: contextLoading,
    unitSystem,
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
  const [exerciseToReplace, setExerciseToReplace] = useState<string | null>(null);

  /* ------------------------- helpers: normalize days ------------------------- */
  const normalizeDays = (days: string[]) => {
    // dedupe and order Sunday..Saturday like indexToDay
    const set = new Set(days);
    return indexToDay.filter((d) => set.has(d));
  };

  /**
   * UPDATED: Derive day names this workout is assigned to.
   * - If wk.days exists, map numbers -> names, validate, and normalize.
   * - Otherwise, scan workoutPlan (array of numbers OR objects) and collect all matches.
   */
  const deriveDaysForWorkout = useCallback(
    (wk: any): string[] => {
      if (!wk) return [];

      // prefer explicit days on the workout object
      if (Array.isArray(wk.days) && wk.days.length > 0) {
        const mapped = wk.days.map((d: any) =>
          typeof d === "number" ? indexToDay[d] : d
        );
        const filtered = mapped.filter((d: string) => indexToDay.includes(d));
        return normalizeDays(filtered);
      }

      // infer from weekly plan
      if (Array.isArray(workoutPlan) && workoutPlan.length >= 7) {
        const inferred: string[] = [];
        for (let i = 0; i < 7; i++) {
          const slot = (workoutPlan as any[])[i];
          // handle numeric IDs (-1 = rest) and various object shapes
          const slotId =
            typeof slot === "number"
              ? slot
              : slot?.id ?? slot?.workoutId ?? slot?.workout?.id ?? null;

          if (slotId === wk.id) {
            inferred.push(indexToDay[i]);
          }
        }
        return normalizeDays(inferred);
      }

      return [];
    },
    [workoutPlan]
  );

  /* --------------------------- Load existing workout data -------------------------- */
  useEffect(() => {
    if (mode !== "edit" || contextLoading) return;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const workoutIdParam = params.workoutId as string | undefined;

        if (workoutIdParam) {
          // Edit by workout ID (from plans list)
          const existingWorkout = getWorkoutById(parseInt(workoutIdParam, 10));
          if (existingWorkout) {
            if (cancelled) return;

            setExistingWorkoutId(existingWorkout.id);

            // IMPORTANT: await the async mapping
            const transformedExercises: Exercise[] = await Promise.all(
              existingWorkout.exercises.map((ex: any) =>
                transformExerciseFromAPI(ex, exerciseDatabase)
              )
            );

            const derivedDays = deriveDaysForWorkout(existingWorkout);

            if (cancelled) return;
            setWorkout({
              name: existingWorkout.name,
              days: derivedDays.length > 0 ? derivedDays : [],
              exercises: transformedExercises,
            });
          } else {
            Alert.alert("Error", "Workout not found");
            router.back();
          }
        } else if (dayParam) {
          // Edit by day (from calendar)
          const dayIndex = dayToIndex[dayParam];
          const existingWorkout = getWorkoutForDay(dayIndex);

          if (existingWorkout) {
            if (cancelled) return;

            setExistingWorkoutId(existingWorkout.id);

            // IMPORTANT: await the async mapping
            const transformedExercises: Exercise[] = await Promise.all(
              existingWorkout.exercises.map((ex: any) =>
                transformExerciseFromAPI(ex, exerciseDatabase)
              )
            );

            // UPDATED: include ALL days this workout appears on, not just dayParam
            const derivedDays = deriveDaysForWorkout(existingWorkout);

            if (cancelled) return;
            setWorkout({
              name: existingWorkout.name,
              days: derivedDays.length > 0 ? derivedDays : [dayParam],
              exercises: transformedExercises,
            });
          } else {
            // No workout for this day - switch to create-like state
            if (cancelled) return;
            setWorkout((prev) => ({ ...prev, days: [dayParam] }));
          }
        }
      } catch (error) {
        console.error("Error loading workout data:", error);
        Alert.alert("Error", "Failed to load workout data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    mode,
    dayParam,
    params.workoutId,
    contextLoading,
    getWorkoutById,
    getWorkoutForDay,
    exerciseDatabase,
    deriveDaysForWorkout,
  ]);

  /* --------------------------- Check for buffered exercises on focus -------------------------- */
  useFocusEffect(
    useCallback(() => {
      const bufferedExercises = getTempExercises();
      if (bufferedExercises && bufferedExercises.length > 0) {
        if (exerciseToReplace) {
          // Replace mode: replace the exercise
          replaceExerciseWithNew(exerciseToReplace, bufferedExercises[0]);
          setExerciseToReplace(null);
        } else {
          // Add mode: add all exercises
          addExercisesFromList(bufferedExercises);
        }
        // Note: getTempExercises automatically clears the buffer
      }
    }, [exerciseToReplace])
  );

  // Track exercise IDs
  useEffect(() => {
    console.log("Current exercise IDs:", workout.exercises.map((ex) => ex.id));
  }, [workout.exercises]);

  /* --------------------------- Exercise helpers --------------------------- */
  const generateId = () => `ex_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const addExercisesFromList = (exerciseData: any[]) => {
    const weightUnit = unitSystem === "metric" ? "kg" : "lbs";

    const newExercises: Exercise[] = exerciseData.map((ex) => ({
      id: generateId(),
      name: ex.name,
      sets: [
        { reps: "10", weight: `0 ${weightUnit}` },
        { reps: "10", weight: `0 ${weightUnit}` },
        { reps: "10", weight: `0 ${weightUnit}` },
      ],
      notes: "",
      originalExerciseId: ex.id,
    }));

    setWorkout((prev) => ({
      ...prev,
      exercises: [...prev.exercises, ...newExercises],
    }));
  };

  const replaceExerciseWithNew = (exerciseId: string, newExerciseData: any) => {
    const weightUnit = unitSystem === "metric" ? "kg" : "lbs";

    const newExercise: Exercise = {
      id: exerciseId, // Keep the same ID
      name: newExerciseData.name,
      sets: [
        { reps: "10", weight: `0 ${weightUnit}` },
        { reps: "10", weight: `0 ${weightUnit}` },
        { reps: "10", weight: `0 ${weightUnit}` },
      ],
      notes: "",
      originalExerciseId: newExerciseData.id,
    };

    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId ? newExercise : ex
      ),
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

  const replaceExercise = (id: string) => {
    setExerciseToReplace(id);
    navigateToExerciseList("replace");
  };

  const reorderExercises = (fromIndex: number, toIndex: number) => {
    const newExercises = [...workout.exercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);

    setWorkout({
      ...workout,
      exercises: newExercises,
    });
  };

  const handleReorderComplete = (reorderedExercises: Exercise[]) => {
    setWorkout({
      ...workout,
      exercises: reorderedExercises,
    });
  };

  const toggleDay = (d: string) =>
    setWorkout({
      ...workout,
      days: workout.days.includes(d)
        ? workout.days.filter((x) => x !== d)
        : normalizeDays([...workout.days, d]),
    });

  const displayDays = () => {
    const normalized = normalizeDays(workout.days);
    if (normalized.length === 0) return "Select days";

    const weekdaySet = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const weekendSet = ["Saturday", "Sunday"];

    const hasAll = indexToDay.every((d) => normalized.includes(d));
    if (hasAll) return "Everyday";

    const isWeekdays =
      weekdaySet.every((d) => normalized.includes(d)) &&
      weekendSet.every((d) => !normalized.includes(d));
    if (isWeekdays) return "Weekdays";

    const isWeekends =
      weekendSet.every((d) => normalized.includes(d)) &&
      weekdaySet.every((d) => !normalized.includes(d));
    if (isWeekends) return "Weekends";

    return normalized.join(", ");
  };

  const handleSave = async () => {
    const validation = validateWorkoutForSave(workout);
    if (!validation.isValid) {
      Alert.alert("Validation Error", getDetailedValidationMessage(validation));
      return;
    }

    setIsSaving(true);
    try {
      let result;

      if (mode === "create") {
        result = await createWorkout(workout.name, workout.exercises, workout.days);
      } else {
        if (!existingWorkoutId) throw new Error("No existing workout ID found for editing");

        result = await updateWorkout(
          existingWorkoutId,
          workout.name,
          workout.exercises,
          workout.days
        );
      }

      if (result.success) {
        const action = mode === "create" ? "created" : "updated";
        Alert.alert("Success", `Workout ${action} successfully!`, [
          {
            text: "OK",
            onPress: () => {
              // Add delay to ensure navigation system is ready
              setTimeout(() => {
                try {
                  router.back();
                } catch (error) {
                  console.log("Navigation error, using fallback:", error);
                  router.replace("/(tabs)/home");
                }
              }, 100);
            },
          },
        ]);
      } else {
        throw new Error(result.error || "Failed to save workout");
      }
    } catch (error) {
      console.error("Save workout error:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save workout");
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToExerciseList = (action: "add" | "replace" = "add") => {
    router.push({
      pathname: "/home/exercise-list",
      params: {
        returnTo: mode === "create" ? "create-workout" : "edit-workout",
        action,
        ...(dayParam && { day: dayParam }),
      },
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
                opacity: isSaving ? 0.7 : 1,
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
          <Text className="text-gray-100 text-xs mt-2">
            Select which days this workout will be scheduled in your weekly plan
          </Text>
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
              onPress={() => navigateToExerciseList("add")}
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
                  onReplace={replaceExercise}
                  onReorder={reorderExercises}
                  onReorderComplete={handleReorderComplete}
                  totalExercises={workout.exercises.length}
                  allExercises={workout.exercises}
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

        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
          const selected = workout.days.includes(day);
          return (
            <TouchableOpacity
              key={day}
              className={`p-4 border-b border-black-200 ${selected ? "bg-black-200" : ""}`}
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
