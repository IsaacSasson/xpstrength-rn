// Path: /app/(workout)/weekly-plan.tsx
import React, { useState } from "react";
import {
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import DayCard from "@/components/DayCard";
import { useThemeContext } from "@/context/ThemeContext";

// Weekly workout data defined directly in this file
const weeklyWorkoutData = [
  {
    day: "Monday",
    workout: {
      name: "Push Day",
      exercises: [
        { name: "Bench Press", sets: 4, reps: "8-10" },
        { name: "Shoulder Press", sets: 3, reps: "10-12" },
        { name: "Incline DB Press", sets: 3, reps: "10-12" },
        { name: "Tricep Extensions", sets: 3, reps: "12-15" },
      ],
      time: "1h 15m",
    },
  },
  {
    day: "Tuesday",
    workout: {
      name: "Pull Day",
      exercises: [
        { name: "Deadlifts", sets: 4, reps: "6-8" },
        { name: "Pull-ups", sets: 3, reps: "8-10" },
        { name: "Barbell Rows", sets: 3, reps: "8-10" },
        { name: "Bicep Curls", sets: 3, reps: "12-15" },
      ],
      time: "1h 10m",
    },
  },
  {
    day: "Wednesday",
    workout: {
      name: "Rest Day",
      exercises: [],
      time: "0m",
    },
  },
  {
    day: "Thursday",
    workout: {
      name: "Legs Day",
      exercises: [
        { name: "Squats", sets: 4, reps: "8-10" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Lunges", sets: 3, reps: "10 each" },
        { name: "Calf Raises", sets: 4, reps: "15-20" },
      ],
      time: "1h 20m",
    },
  },
  {
    day: "Friday",
    workout: {
      name: "Upper Body",
      exercises: [
        { name: "Incline Bench", sets: 4, reps: "8-10" },
        { name: "Lat Pulldowns", sets: 3, reps: "10-12" },
        { name: "Lateral Raises", sets: 3, reps: "12-15" },
        { name: "Face Pulls", sets: 3, reps: "15-20" },
      ],
      time: "1h 05m",
    },
  },
  {
    day: "Saturday",
    workout: {
      name: "Lower Body",
      exercises: [
        { name: "Romanian Deadlifts", sets: 4, reps: "8-10" },
        { name: "Hack Squats", sets: 3, reps: "10-12" },
        { name: "Leg Extensions", sets: 3, reps: "12-15" },
        { name: "Hamstring Curls", sets: 3, reps: "12-15" },
      ],
      time: "1h 15m",
    },
  },
  {
    day: "Sunday",
    workout: {
      name: "Rest Day",
      exercises: [],
      time: "0m",
    },
  },
];

const WeeklyPlan = () => {
  // Use our theme context
  const { primaryColor } = useThemeContext();
  
  // Get current day (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  // Adjust so that Monday becomes index 0 (Sunday becomes index 6)
  const todayIndex = today === 0 ? 6 : today - 1;

  // Create state for tracking expanded state for each day
  const [expandedDays, setExpandedDays] = useState(() => {
    const arr = new Array(weeklyWorkoutData.length).fill(false);
    arr[todayIndex] = true; // Expand current day by default
    return arr;
  });

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
    console.log(`Edit workout for ${weeklyWorkoutData[dayIndex].day}`);
    // Add navigation to edit screen if needed
  };

  const startWorkout = (dayIndex: number) => {
    console.log("Start workout");
    // Add functionality to start the workout if needed
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Top Header Section */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={goBack} className="mr-4">
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-psemibold text-white">
                Weekly Workout Plan
              </Text>
              <Text className="font-pmedium text-sm text-gray-100">
                Your training schedule
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Workout Cards */}
      <ScrollView className="px-4 pt-2 pb-6">
        {weeklyWorkoutData.map((dayData, index) => (
          <DayCard
            key={dayData.day}
            dayData={dayData}
            isToday={index === todayIndex}
            isExpanded={expandedDays[index]}
            onToggleExpand={() => toggleExpand(index)}
            onEdit={() => editWorkout(index)}
            onStart={() => startWorkout(index)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default WeeklyPlan;