// Path: /components/home/TodaysWorkout.tsx
import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { router } from "expo-router";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { useWorkouts } from "@/context/WorkoutContext";

/* ----------------------------- Types ----------------------------------- */
export interface WorkoutType {
  exists: boolean;
  /** When true, this day is explicitly marked as a Rest Day (plan uses -1) */
  isRest?: boolean;
  name?: string;
  calories?: number;
  exercises?: { name: string; sets: number; reps: string }[];
}

interface Props {
  workout: WorkoutType | null;
  /** Allow "Assign/ Create Workout" actions on this date */
  allowCreate?: boolean;
  /** The selected date for context when assigning/editing workouts */
  selectedDate?: Date;
}

/* -------------------------- Constants ---------------------------------- */
const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* Helper function to handle new exercise data format in TodaysWorkout */
const processExerciseForDisplay = (ex: any, exerciseDatabase: any[]) => {
  // Find exercise name from database safely
  const exerciseDetails = exerciseDatabase.find(e => 
    e.id === (ex.exercise ? String(ex.exercise) : '')
  );
  const exerciseName = exerciseDetails?.name || `Exercise ${ex.exercise || 'Unknown'}`;
  
  // Handle new format where sets is an array of {reps, weight} objects
  if (Array.isArray(ex.sets)) {
    const setsCount = ex.sets.length;
    const repsArray = ex.sets.map((set: any) => Number(set.reps) || 0);
    const minReps = Math.min(...repsArray);
    const maxReps = Math.max(...repsArray);
    
    // Create rep range string
    const repsDisplay = minReps === maxReps ? String(minReps) : `${minReps}-${maxReps}`;
    
    return {
      name: exerciseName,
      sets: setsCount,
      reps: repsDisplay,
    };
  } else {
    // Fallback for old format
    return {
      name: exerciseName,
      sets: ex.sets || 0,
      reps: String(ex.reps || 0),
    };
  }
};

/* --------------------------- Component --------------------------------- */
const TodaysWorkout: React.FC<Props> = ({
  workout,
  allowCreate = true,
  selectedDate,
}) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const {
    customWorkouts,
    exerciseDatabase,
    getWorkoutForDay,
    setPlanDay,   // <<< use plan-based day assignment
    refreshData,
  } = useWorkouts();

  // Determine the context day
  const dayIndex = useMemo(
    () => (selectedDate ? selectedDate.getDay() : new Date().getDay()),
    [selectedDate]
  );
  const dayName = useMemo(
    () =>
      selectedDate
        ? selectedDate.toLocaleDateString("en-US", { weekday: "long" })
        : daysOfWeek[dayIndex],
    [selectedDate, dayIndex]
  );

  // Navigation helpers
  const goToEditWorkout = () => {
    if (dayName) {
      router.push({ pathname: "/home/edit-workout", params: { day: dayName } });
    } else {
      router.push("/home/edit-workout");
    }
  };

  const goToCreateWorkout = () => {
    closeAssignSheet();
    if (dayName) {
      router.push({ pathname: "/home/create-workout", params: { day: dayName } });
    } else {
      router.push("/home/create-workout");
    }
  };

  // UPDATED: Pass the actual plan workout (ids + sets + reps) to Active Workout
  const goToActiveWorkout = () => {
    const plan = getWorkoutForDay(dayIndex); // comes from WorkoutContext
    if (!plan || !plan.exercises?.length) {
      Alert.alert("No workout", "This day doesn't have an assigned workout.");
      return;
    }

    // Build a compact preset payload to hydrate ActiveWorkout
    const preset = {
      name: plan.name ?? `${dayName} Workout`,
      // Handle new format where exercises have array of sets
      exercises: plan.exercises.map((ex: any) => {
        if (Array.isArray(ex.sets)) {
          // New format: use first set's reps as representative
          const reps = ex.sets.length > 0 ? Number(ex.sets[0].reps) || 0 : 0;
          return {
            id: Number(ex.exercise),
            reps: reps,
            sets: ex.sets.length,
          };
        } else {
          // Old format fallback
          return {
            id: Number(ex.exercise),
            reps: typeof ex.reps === "string" ? parseInt(ex.reps, 10) || 0 : Number(ex.reps ?? 0),
            sets: Number(ex.sets ?? 0),
          };
        }
      }),
    };

    router.push({
      pathname: "/home/active-workout", // <-- change this if your route differs
      params: { preset: JSON.stringify(preset) },
    });
  };

  const data: WorkoutType = workout ?? { exists: false };

  /* ---------------- Rest Day state (explicit) --------------------------- */
  const [isRestDay, setIsRestDay] = useState<boolean>(!!data.isRest);
  useEffect(() => {
    setIsRestDay(!!(workout && workout.isRest));
  }, [workout]);

  /* ---------------- Bottom sheet state ---------------------------------- */
  const [assignSheetVisible, setAssignSheetVisible] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const openAssignSheet = () => setAssignSheetVisible(true);
  const closeAssignSheet = () => setAssignSheetVisible(false);

  /** Set this day to Rest (-1) via /user/workout-plan */
  const handleChooseRest = async () => {
    try {
      setIsAssigning(true);
      const ok = await setPlanDay(dayIndex, -1);
      if (!ok) throw new Error("Failed to set rest day");
      // Optimistic UI
      setIsRestDay(true);
      await refreshData();
      closeAssignSheet();
    } catch (e) {
      console.error("Assign rest error:", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update day");
    } finally {
      setIsAssigning(false);
    }
  };

  /** Assign a specific workout id to this day via /user/workout-plan */
  const handleChooseWorkout = async (workoutId: number) => {
    try {
      setIsAssigning(true);
      const ok = await setPlanDay(dayIndex, workoutId);
      if (!ok) throw new Error("Failed to assign day to workout");
      // If a workout is chosen, it's no longer a rest day
      setIsRestDay(false);
      await refreshData();
      closeAssignSheet();
    } catch (e) {
      console.error("Assign workout error:", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update day");
    } finally {
      setIsAssigning(false);
    }
  };

  /* ------------------------------ UI ----------------------------------- */
  return (
    <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: tertiaryColor }}>
      {/* ─────────────── REST DAY ─────────────── */}
      {isRestDay ? (
        <View className="items-center py-8">
          <MaterialCommunityIcons name="weather-night" size={50} color={primaryColor} />
          <Text className="text-white font-psemibold text-center mt-4 text-lg">
            Rest Day
          </Text>
          <Text className="text-gray-100 text-center mt-2 mb-4">
            {dayName ? `${dayName} is set as a rest day.` : "This date is set as a rest day."}
          </Text>

          {allowCreate && (
            <TouchableOpacity
              onPress={openAssignSheet}
              style={{ backgroundColor: primaryColor }}
              className="flex-row items-center px-6 py-3 rounded-lg"
              activeOpacity={0.7}
            >
              <FontAwesome5 name="exchange-alt" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Change your mind</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : data.exists ? (
        /* ---------------------- HAS WORKOUT ------------------------------- */
        <View>
          {/* Header row: Workout name (left) + replace + edit (right) */}
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="font-pbold"
              style={{ color: primaryColor, fontSize: 20, lineHeight: 26 }}
              numberOfLines={1}
            >
              {data.name ?? "Workout"}
            </Text>

            <View className="flex-row items-center">
              {/* Replace Workout button (opens the same assign sheet) */}
              {allowCreate && (
                <TouchableOpacity onPress={openAssignSheet} className="p-2 mr-5" activeOpacity={0.8}>
                  <FontAwesome5 name="exchange-alt" size={18} color="#FFF" />
                </TouchableOpacity>
              )}

              {/* Edit button */}
              <TouchableOpacity onPress={goToEditWorkout} className="py-2" activeOpacity={0.8}>
                <FontAwesome5 name="pencil-alt" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Exercise list */}
          {data.exercises && data.exercises.length > 0 ? (
            <View className="mb-4">
              {data.exercises.map((ex, idx) => (
                <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                  <MaterialCommunityIcons name="dumbbell" size={18} color={primaryColor} />
                  <Text className="text-white font-pmedium ml-3 flex-1" numberOfLines={1}>
                    {ex.name}
                  </Text>
                  <Text className="text-gray-100 ml-2">
                    {ex.sets} sets × {ex.reps}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="mb-4 py-2">
              <Text className="text-gray-100 text-center">
                No exercises configured for this workout
              </Text>
            </View>
          )}

          {/* Calories + Start button */}
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center">
              <FontAwesome5 name="fire" size={14} color="#f97316" />
              <Text className="text-orange-500 ml-2">≈ {data.calories ?? 0} kcal</Text>
            </View>

            <TouchableOpacity
              onPress={goToActiveWorkout} // UPDATED: sends preset to ActiveWorkout
              style={{ backgroundColor: primaryColor }}
              className="flex-row items-center px-4 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <FontAwesome5 name="play" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Start Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ----------------------- NO WORKOUT ------------------------------ */
        <View className="items-center py-8">
          <FontAwesome5 name="calendar-times" size={50} color={primaryColor} />
          <Text className="text-white font-pmedium text-center mt-4 text-lg">
            No Workout Scheduled
          </Text>
          <Text className="text-gray-100 text-center mt-2 mb-4">
            {allowCreate
              ? `You don't have a workout planned for ${dayName ? dayName : "this date"}.`
              : "Past date—workouts can't be added here."}
          </Text>

          {allowCreate && (
            <TouchableOpacity
              onPress={openAssignSheet}
              style={{ backgroundColor: primaryColor }}
              className="flex-row items-center px-6 py-3 rounded-lg"
              activeOpacity={0.7}
            >
              <FontAwesome5 name="exchange-alt" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Assign Workout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─────────────── Bottom Sheet: Assign / Rest / Create / List ─────────────── */}
      <DraggableBottomSheet
        visible={assignSheetVisible}
        onClose={closeAssignSheet}
        primaryColor={primaryColor}
        heightRatio={0.6}
        scrollable
        keyboardOffsetRatio={0}
      >
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Text className="text-white text-xl font-psemibold text-center">
            {dayName ? `Edit ${dayName}` : "Edit Day"}
          </Text>
          <Text className="text-gray-100 text-center mt-1">
            Choose a routine for this day, or set it as a rest day.
          </Text>
          {isAssigning && (
            <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator size="small" color={primaryColor} />
              <Text className="text-white ml-2">Assigning…</Text>
            </View>
          )}
        </View>

        {/* Rest Day */}
        <TouchableOpacity
          onPress={isAssigning ? undefined : handleChooseRest}
          activeOpacity={0.85}
          style={{
            opacity: isAssigning ? 0.6 : 1,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons name="weather-night" size={20} color={primaryColor} />
          <Text className="text-white ml-10 text-base font-pmedium">Rest Day</Text>
        </TouchableOpacity>

        {/* Create Workout shortcut (only if allowed) */}
        {allowCreate && (
          <TouchableOpacity
            onPress={isAssigning ? undefined : goToCreateWorkout}
            activeOpacity={0.9}
            style={{
              opacity: isAssigning ? 0.6 : 1,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesome5 name="plus" size={16} color={primaryColor} />
            <Text className="text-white ml-10 text-base font-pmedium">Create Workout</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "rgba(255,255,255,0.08)",
            marginVertical: 12,
          }}
        />

        {/* List of workouts */}
        <Text className="text-white/80 mb-12">Your Workouts</Text>

        {customWorkouts.length === 0 ? (
          <View
            style={{
              paddingVertical: 18,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text className="text-white/80">You don't have any workouts yet.</Text>
            {allowCreate && (
              <TouchableOpacity
                onPress={goToCreateWorkout}
                style={{
                  marginTop: 12,
                  alignSelf: "flex-start",
                  backgroundColor: primaryColor,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                activeOpacity={0.9}
              >
                <FontAwesome5 name="plus" size={12} color="#FFF" />
                <Text className="text-white ml-2 font-pmedium">Create Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          customWorkouts.map((w: any) => (
            <TouchableOpacity
              key={w.id}
              onPress={isAssigning ? undefined : () => handleChooseWorkout(w.id)}
              activeOpacity={0.9}
              style={{
                opacity: isAssigning ? 0.6 : 1,
                backgroundColor: tertiaryColor,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FontAwesome5 name="clipboard-list" size={16} color={primaryColor} />
                <Text className="text-white ml-10 text-base font-pmedium">{w.name}</Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons name="timer-outline" size={16} color={primaryColor} />
                <Text className="text-white ml-2 text-xs">
                  {Math.max(
                    15,
                    Math.round(
                      (w.exercises ?? []).reduce(
                        (s: number, ex: any) => {
                          if (Array.isArray(ex.sets)) {
                            return s + ex.sets.length;
                          } else {
                            return s + (ex.sets || 0);
                          }
                        },
                        0
                      ) * 2
                    )
                  )}{" "}
                  min
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </DraggableBottomSheet>
    </View>
  );
};

export default TodaysWorkout;