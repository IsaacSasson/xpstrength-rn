// Path: /app/home/WeeklyPlan.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DayCard from "@/components/DayCard";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import Header from "@/components/Header";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";

// Days of the week in order (Sunday first to match your data structure)
const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function WeeklyPlan() {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const {
    customWorkouts,
    exerciseDatabase,
    isLoading,
    isRefreshing,
    error,
    refreshData,
    getWorkoutForDay,
    clearError,
    setPlanDay, // plan-based assignment
  } = useWorkouts();

  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();

  // Expanded state per day
  const [expandedDays, setExpandedDays] = useState(() => {
    const arr = new Array(7).fill(false);
    arr[today] = true;
    return arr;
  });

  /* ---------------- Bottom sheet for quick assignment ---------------- */
  const [assignSheetVisible, setAssignSheetVisible] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const openAssignSheet = (dayIndex: number) => {
    setEditingDayIndex(dayIndex);
    setAssignSheetVisible(true);
  };
  const closeAssignSheet = () => {
    setAssignSheetVisible(false);
    setEditingDayIndex(null);
  };

  const goToCreateWorkout = () => {
    closeAssignSheet();
    const dayName =
      editingDayIndex !== null ? daysOfWeek[editingDayIndex] : undefined;
    if (dayName) {
      router.push({ pathname: "/home/create-workout", params: { day: dayName } });
    } else {
      router.push("/home/create-workout");
    }
  };

  /** Set selected day to Rest (-1) via workout plan */
  const handleChooseRest = async () => {
    if (editingDayIndex === null) return;

    try {
      setIsAssigning(true);

      const current = getWorkoutForDay(editingDayIndex);
      if (!current) {
        Alert.alert("Rest Day", "This day is already set as a rest day.");
        setIsAssigning(false);
        return;
      }

      const ok = await setPlanDay(editingDayIndex, -1);
      if (!ok) throw new Error("Failed to set rest day");

      await refreshData();
      closeAssignSheet();
    } catch (e) {
      console.error("Assign rest error:", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update day");
    } finally {
      setIsAssigning(false);
    }
  };

  /** Assign a workout id to the selected day via workout plan */
  const handleChooseWorkout = async (workoutId: number) => {
    if (editingDayIndex === null) return;

    try {
      setIsAssigning(true);

      const target = customWorkouts.find((w: any) => w.id === workoutId);
      if (!target) throw new Error("Selected workout not found.");

      const ok = await setPlanDay(editingDayIndex, workoutId);
      if (!ok) throw new Error("Failed to assign day to workout");

      await refreshData();
      closeAssignSheet();
    } catch (e) {
      console.error("Assign workout error:", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update day");
    } finally {
      setIsAssigning(false);
    }
  };

  // Transform API data to match DayCard expected format
  const weeklyWorkoutData = useMemo(() => {
    return daysOfWeek.map((day, index) => {
      const workout = getWorkoutForDay(index);

      if (!workout) {
        // Rest day
        return {
          day,
          workout: {
            name: "Rest Day",
            exercises: [],
            time: "0m",
          },
        };
      }

      // Transform exercises to expected format
      const exercises = (workout.exercises ?? []).map((ex: any) => {
        const exerciseDetails = exerciseDatabase.find(
          (e) => e.id === ex.exercise.toString()
        );
        const exerciseName = exerciseDetails?.name || `Exercise ${ex.exercise}`;

        return {
          name: exerciseName,
          sets: ex.sets,
          reps: String(ex.reps),
        };
      });

      // Estimate workout time (2-3 minutes per set)
      const totalSets = (workout.exercises ?? []).reduce(
        (sum: number, ex: any) => sum + (ex.sets || 0),
        0
      );
      const estimatedMinutes = Math.max(15, Math.round(totalSets * 2.5));

      return {
        day,
        workout: {
          name: workout.name,
          exercises,
          time: `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`,
        },
      };
    });
  }, [getWorkoutForDay, exerciseDatabase]);

  const toggleExpand = (index: number) => {
    setExpandedDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const editWorkout = (dayIndex: number) => {
    openAssignSheet(dayIndex);
  };

  const handleRetry = () => {
    clearError();
    refreshData();
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6">
            <View className="flex-row items-center justify-between mb-6">
              <Header
                MText="Weekly Workout Plan"
                SText="Loading your weekly schedule..."
              />
            </View>
          </View>
        </SafeAreaView>

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="text-white font-pmedium mt-4">
            Loading your weekly plan...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !isRefreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6">
            <View className="flex-row items-center justify-between mb-6">
              <Header
                MText="Weekly Workout Plan"
                SText="Error loading your schedule"
              />
            </View>
          </View>
        </SafeAreaView>

        <View className="flex-1 justify-center items-center px-4">
          <View
            className="rounded-2xl p-6 w-full max-w-sm"
            style={{ backgroundColor: tertiaryColor }}
          >
            <FontAwesome5
              name="exclamation-triangle"
              size={40}
              color="#ff6b6b"
              style={{ alignSelf: "center", marginBottom: 16 }}
            />
            <Text className="text-white font-pmedium text-center text-lg mb-2">
              Something went wrong
            </Text>
            <Text className="text-gray-100 text-center mb-4">{error}</Text>
            <TouchableOpacity
              onPress={handleRetry}
              className="py-3 px-6 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium text-center">
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const selectedDayLabel =
    editingDayIndex !== null ? daysOfWeek[editingDayIndex] : "";

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Top Header Section */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <Header
              MText="Weekly Workout Plan"
              SText="Your workout schedule for the week"
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Workout Cards */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4 pt-2 pb-6"
      >
        {weeklyWorkoutData.map((dayData, index) => (
          <DayCard
            key={dayData.day}
            dayData={dayData}
            isToday={index === today}
            isExpanded={expandedDays[index]}
            onToggleExpand={() => toggleExpand(index)}
            onEdit={() => editWorkout(index)}
          />
        ))}
      </ScrollView>

      {/* ───────────────── Bottom Sheet: fixed height + internal scroll ───────────────── */}
      <DraggableBottomSheet
        visible={assignSheetVisible}
        onClose={closeAssignSheet}
        primaryColor={primaryColor}
        heightRatio={0.5}      // opens to half screen (sheet has fixed height)
        scrollable={false}     // keep header fixed; content below uses its own ScrollView
        keyboardOffsetRatio={0}
      >
        {/* Header (fixed within sheet) */}
        <View style={{ alignItems: "center", marginBottom: 8 }}>
          <Text className="text-white text-xl font-psemibold text-center">
            {selectedDayLabel ? `Edit ${selectedDayLabel}` : "Edit Day"}
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

        {/* Scrollable content inside the sheet */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Create Workout shortcut */}
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
                marginBottom: 12,
              }}
            >
              <Text className="text-white/80">You don't have any workouts yet.</Text>
              {/* Inner CTA */}
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
            </View>
          ) : (
            customWorkouts.map((w: any, idx: number) => (
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
                  marginBottom: idx === customWorkouts.length - 1 ? 16 : 12,
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
                          (s: number, ex: any) => s + (ex.sets || 0),
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
        </ScrollView>
      </DraggableBottomSheet>
    </View>
  );
}
