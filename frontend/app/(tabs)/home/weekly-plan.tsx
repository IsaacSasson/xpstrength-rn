// Path: /app/(tabs)/home/weekly-plan.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import DayCard from "@/components/DayCard";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import Header from "@/components/Header";

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
    workoutPlan, 
    customWorkouts, 
    exerciseDatabase, 
    isLoading, 
    isRefreshing,
    error, 
    refreshData, 
    getWorkoutForDay,
    clearError 
  } = useWorkouts();

  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();

  // Create state for tracking expanded state for each day
  const [expandedDays, setExpandedDays] = useState(() => {
    const arr = new Array(7).fill(false);
    arr[today] = true; // Expand current day by default
    return arr;
  });

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
      const exercises = workout.exercises.map((ex: any) => {
        // Find exercise name from database
        const exerciseDetails = exerciseDatabase.find(e => e.id === ex.exercise.toString());
        const exerciseName = exerciseDetails?.name || `Exercise ${ex.exercise}`;
        
        return {
          name: exerciseName,
          sets: ex.sets,
          reps: ex.reps.toString(),
        };
      });

      // Estimate workout time (2-3 minutes per set)
      const totalSets = workout.exercises.reduce((sum: number, ex: any) => sum + ex.sets, 0);
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
      const newExpanded = [...prev];
      newExpanded[index] = !newExpanded[index];
      return newExpanded;
    });
  };

  const goBack = () => {
    if (Platform.OS === "web") {
      router.push("/home");
    } else {
      router.back();
    }
  };

  const editWorkout = (dayIndex: number) => {
    const day = daysOfWeek[dayIndex];
    const workout = getWorkoutForDay(dayIndex);
    
    if (!workout) {
      // No workout for this day - create a new one
      router.push({
        pathname: "/home/create-workout",
        params: { day }
      });
    } else {
      // Edit existing workout
      router.push({
        pathname: "/home/edit-workout", 
        params: { day }
      });
    }
  };

  const startWorkout = (dayIndex: number) => {
    const workout = getWorkoutForDay(dayIndex);
    
    if (!workout) {
      Alert.alert("No Workout", "There's no workout scheduled for this day.");
      return;
    }

    // Navigate to active workout with the workout ID
    router.push({
      pathname: "/home/active-workout",
      params: { workoutId: workout.id.toString() }
    });
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
          <Text className="text-white font-pmedium mt-4">Loading your weekly plan...</Text>
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
            <FontAwesome5 name="exclamation-triangle" size={40} color="#ff6b6b" style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text className="text-white font-pmedium text-center text-lg mb-2">
              Something went wrong
            </Text>
            <Text className="text-gray-100 text-center mb-4">
              {error}
            </Text>
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
        className="px-4 pt-2 pb-6"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {weeklyWorkoutData.map((dayData, index) => (
          <DayCard
            key={dayData.day}
            dayData={dayData}
            isToday={index === today}
            isExpanded={expandedDays[index]}
            onToggleExpand={() => toggleExpand(index)}
            onEdit={() => editWorkout(index)}
            onStart={() => startWorkout(index)}
          />
        ))}
      </ScrollView>
    </View>
  );
}