// Path: /app/(tabs)/home/index.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import TopBar from "@/components/TopBar";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import ActivityView from "@/components/home/ActivityView";
import TodaysWorkout, { WorkoutType } from "@/components/home/TodaysWorkout";
import QuickActions from "@/components/home/QuickActions";
import Calender from "@/components/home/Calender";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import { useAuth } from "@/context/AuthProvider";
import QuickActionsCustomizer, {
  ActionDefinition,
} from "@/components/home/QuickActionsCustomizer";

/* ---------- helpers ---------- */
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const midnight = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

/* Heading builder (moved out of TodaysWorkout) */
const getHeadingForDate = (selectedDate: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sel = new Date(selectedDate);
  sel.setHours(0, 0, 0, 0);

  const diffDays = Math.round((sel.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today's Workout";
  if (diffDays === 1) return "Tomorrow's Workout";
  if (diffDays === -1) return "Yesterday's Workout";

  const dayName = sel.toLocaleDateString("en-US", { weekday: "long" });
  return `${dayName}'s Workout`;
};

/* Helper function to handle new exercise data format */
const processExerciseData = (ex: any, exerciseDatabase: any[]) => {
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

export default function Home() {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const { user } = useAuth();
  const { 
    workoutPlan, 
    customWorkouts, 
    exerciseDatabase, 
    isLoading, 
    error, 
    refreshData, 
    getWorkoutForDay,
    clearError 
  } = useWorkouts();

  /* ---- navigation ---- */
  const goToCreateWorkout = () => router.push("/home/create-workout");
  const goToPlannedWorkouts = () => router.push("/home/weekly-plan");
  const goToWorkoutPlans = () => router.push("/home/workout-plans");
  const goToFriends = () => router.push("/friends");
  const goToStats = () => router.push("/stats/stats-over-time");

  /* ---- calendar ---- */
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const restDays = useMemo<Date[]>(() => [], []);
  const restSet = useMemo(() => new Set(restDays.map(dateKey)), [restDays]);

  /* ---- Transform API data to UI format ---- */
  const workoutsByDate: Record<string, WorkoutType> = useMemo(() => {
    if (!workoutPlan || !customWorkouts || !exerciseDatabase) return {};

    const workoutMap: Record<string, WorkoutType> = {};
    
    // Get current week dates
    const today = new Date();
    const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    
    // Map each day of the week to its workout
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      const key = dateKey(date);
      
      const workout = getWorkoutForDay(i);
      if (workout) {
        // Transform API workout to UI format with proper exercise names and rep ranges
        workoutMap[key] = {
          exists: true,
          name: workout.name,
          calories: Math.round(workout.exercises.length * 50 + Math.random() * 100), // Estimate
          exercises: workout.exercises.slice(0, 4).map((ex: any) => 
            processExerciseData(ex, exerciseDatabase)
          ),
        };
      }
    }

    return workoutMap;
  }, [workoutPlan, customWorkouts, exerciseDatabase, getWorkoutForDay]);

  const key = dateKey(selectedDate);
  const workoutForDate = workoutsByDate[key] ?? null;
  const isPastEmpty =
    selectedDate < midnight && !restSet.has(key) && !workoutForDate;

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const heading = getHeadingForDate(selectedDate);

  /* ---- quick actions ---- */
  const allActions: ActionDefinition[] = useMemo(
    () => [
      {
        id: "createWorkout",
        title: "Create New Workout",
        icon: "dumbbell",
        iconType: "material",
        onPress: goToCreateWorkout,
      },
      {
        id: "viewPlan",
        title: "Weekly Plan",
        icon: "calendar-week",
        iconType: "fontawesome",
        onPress: goToPlannedWorkouts,
      },
      {
        id: "workoutPlans",
        title: "Workout Plans",
        icon: "clipboard-list",
        iconType: "fontawesome",
        onPress: goToWorkoutPlans,
      },
      {
        id: "inviteFriends",
        title: "Invite Friends",
        icon: "user-plus",
        iconType: "fontawesome",
        onPress: goToFriends,
      },
      {
        id: "viewProgress",
        title: "View Progress",
        icon: "chart-line",
        iconType: "fontawesome",
        onPress: goToStats,
      },
      // extras
      {
        id: "exerciseList",
        title: "Exercise List",
        icon: "list",
        iconType: "fontawesome",
        onPress: () => router.push("/home/exercise-list"),
      },
      {
        id: "personalBests",
        title: "Personal Bests",
        icon: "trophy",
        iconType: "fontawesome",
        onPress: () => router.push("/stats/personal-bests"),
      },
      {
        id: "goals",
        title: "Goals",
        icon: "medal",
        iconType: "fontawesome",
        onPress: () => router.push("/stats/goals"),
      },
      {
        id: "settings",
        title: "Settings",
        icon: "cog",
        iconType: "fontawesome",
        onPress: () => router.push("/profile/settings"),
      },
    ],
    [
      goToCreateWorkout,
      goToPlannedWorkouts,
      goToWorkoutPlans,
      goToFriends,
      goToStats,
    ]
  );

  // allow nulls = empty slots
  const [quickSlotIds, setQuickSlotIds] = useState<(string | null)[]>([
    "createWorkout",
    "viewPlan",
    "workoutPlans",
    "viewProgress",
  ]);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const openCustomizer = useCallback(() => setCustomizeOpen(true), []);
  const closeCustomizer = useCallback(() => setCustomizeOpen(false), []);

  const idToAction = useCallback(
    (id: string) => allActions.find((a) => a.id === id)!,
    [allActions]
  );

  const currentSlots = quickSlotIds
    .filter(Boolean)
    .map((id) => idToAction(id as string));

  const handleRetry = () => {
    clearError();
    refreshData();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar subtext="Welcome back" title={user?.username || "User"} titleTop={false} />

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-6">
        {/* date + quick links */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-pmedium text-lg">
            {formattedDate}
          </Text>

          {/* Right-aligned links row */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={goToPlannedWorkouts}
              className="flex-row items-center"
            >
              <Text style={{ color: primaryColor }} className="mr-2 font-pmedium">
                Weekly Plan
              </Text>
              <FontAwesome5 name="calendar-alt" size={16} color={primaryColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* calendar */}
        <Calender
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          restDays={restDays}
        />

        {/* heading + right-aligned "My Workouts" aligned with Weekly Plan */}
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <Text className="text-white text-xl font-psemibold">{heading}</Text>

          {/* Same structure + no extra right margin so it aligns with Weekly Plan above */}
          <TouchableOpacity onPress={goToWorkoutPlans} className="flex-row items-center">
            <Text style={{ color: primaryColor }} className="mr-2 font-pmedium">
              My Workouts
            </Text>
            <FontAwesome5 name="clipboard-list" size={16} color={primaryColor} />
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {isLoading && (
          <View
            className="rounded-2xl p-8 mb-6 items-center"
            style={{ backgroundColor: tertiaryColor }}
          >
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="text-white font-pmedium mt-4">Loading workouts...</Text>
          </View>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <View
            className="rounded-2xl p-6 mb-6"
            style={{ backgroundColor: "#ff4d4d20" }}
          >
            <Text className="text-red-400 font-pmedium text-center">{error}</Text>
            <TouchableOpacity
              onPress={handleRetry}
              className="mt-3 items-center"
            >
              <Text style={{ color: primaryColor }} className="font-pmedium">
                Tap to retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* workout card (no heading inside) */}
        {!isLoading && !error && (
          <TodaysWorkout 
            workout={workoutForDate} 
            allowCreate={!isPastEmpty}
            selectedDate={selectedDate}
          />
        )}

        {/* quick actions */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-psemibold">Quick Actions</Text>
          <TouchableOpacity className="pl-10 pr-5" onPress={openCustomizer}>
            <FontAwesome5 name="ellipsis-v" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap mb-8">
          {currentSlots.map((action) => (
            <QuickActions
              key={action.id}
              title={action.title}
              icon={action.icon}
              iconType={action.iconType}
              onPress={action.onPress}
              iconColor={primaryColor}
              backgroundColor={tertiaryColor}
            />
          ))}
        </View>

        <ActivityView />
      </ScrollView>

      <QuickActionsCustomizer
        visible={customizeOpen}
        actions={allActions}
        slotIds={quickSlotIds}
        onChangeSlotIds={setQuickSlotIds}
        onRequestClose={closeCustomizer}
        primaryColor={primaryColor}
        tertiaryColor={tertiaryColor}
      />
    </View>
  );
}