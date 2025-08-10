// Path: /app/(tabs)/stats/muscle-group.tsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import { useUserProgress } from "@/context/UserProvider";
import Header from "@/components/Header";

const MuscleGroupDetail = () => {
  const { primaryColor } = useThemeContext();
  const { convertWeight, formatWeight, unitSystem } = useWorkouts();
  const { level } = useUserProgress();
  const { group } = useLocalSearchParams<{ group?: string | string[] }>();

  // Normalize "group" to a simple string key
  const groupKey = Array.isArray(group) ? group[0] : group ?? "";

  // Map muscle group IDs to display names - includes all front and back muscle groups
  const muscleGroupNames: Record<string, string> = {
    // Front muscle groups
    abdominals: "Abdominals",
    biceps: "Biceps", 
    chest: "Chest",
    forearms: "Forearms",
    neck: "Neck",
    quadriceps: "Quadriceps",
    shoulders: "Shoulders",
    traps: "Traps",
    
    // Back muscle groups
    abductors: "Abductors",
    adductors: "Adductors", 
    calves: "Calves",
    glutes: "Glutes",
    hamstrings: "Hamstrings",
    lats: "Latissimus Dorsi",
    "lower-back": "Lower Back",
    "middle-back": "Middle Back",
    triceps: "Triceps",
  };

  const muscleGroupName = muscleGroupNames[groupKey] || "Unknown Muscle Group";

  // Get muscle group category for contextual data
  const getMuscleGroupCategory = (key: string): "upper" | "lower" | "core" => {
    const upperBody = ["biceps", "chest", "forearms", "neck", "shoulders", "traps", "lats", "middle-back", "triceps"];
    const lowerBody = ["quadriceps", "abductors", "adductors", "calves", "glutes", "hamstrings", "lower-back"];
    const core = ["abdominals"];
    
    if (upperBody.includes(key)) return "upper";
    if (lowerBody.includes(key)) return "lower";
    return "core";
  };

  const muscleCategory = getMuscleGroupCategory(groupKey);

  // Boilerplate data - replace with real data later
  const recoveryStatus: "Fresh" | "Recovering" | "Fatigued" | string = "Fresh";
  const lastWorked = "3 days ago";
  const workoutCount = 12;
  
  // Convert average volume to user's preferred unit (assuming stored in lbs)
  const avgVolumeNumber = 2450;
  const convertedAvgVolume = convertWeight(avgVolumeNumber, "imperial", unitSystem);
  const formattedAvgVolume = `${Math.round(convertedAvgVolume).toLocaleString()} ${unitSystem === "metric" ? "kg" : "lbs"}`;
  
  const strengthGain = "+15%";

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "fresh":
        return "#22C55E";
      case "recovering":
        return "#EAB308";
      case "fatigued":
        return "#EF4444";
      default:
        return primaryColor;
    }
  };

  // Get sample exercises based on muscle group
  const getSampleExercises = (key: string): string[] => {
    const exerciseMap: Record<string, string[]> = {
      // Front
      abdominals: ["Plank", "Crunches", "Russian Twists"],
      biceps: ["Bicep Curls", "Hammer Curls", "Chin-ups"],
      chest: ["Bench Press", "Push-ups", "Chest Flyes"],
      forearms: ["Wrist Curls", "Farmer's Walk", "Dead Hangs"], 
      neck: ["Neck Bridges", "Resistance Band Pulls", "Isometric Holds"],
      quadriceps: ["Squats", "Lunges", "Leg Press"],
      shoulders: ["Shoulder Press", "Lateral Raises", "Upright Rows"],
      traps: ["Shrugs", "Face Pulls", "Upright Rows"],
      
      // Back
      abductors: ["Side Leg Raises", "Clamshells", "Monster Walks"],
      adductors: ["Inner Thigh Squeezes", "Sumo Squats", "Side Lunges"],
      calves: ["Calf Raises", "Jump Rope", "Walking"],
      glutes: ["Hip Thrusts", "Glute Bridges", "Bulgarian Split Squats"],
      hamstrings: ["Romanian Deadlifts", "Leg Curls", "Good Mornings"],
      lats: ["Pull-ups", "Lat Pulldowns", "Rows"],
      "lower-back": ["Deadlifts", "Back Extensions", "Superman"],
      "middle-back": ["Bent-over Rows", "T-Bar Rows", "Reverse Flyes"],
      triceps: ["Tricep Dips", "Close-grip Push-ups", "Overhead Press"],
    };
    
    return exerciseMap[key] || ["Exercise 1", "Exercise 2", "Exercise 3"];
  };

  const sampleExercises = getSampleExercises(groupKey);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header row identical in structure to your Workout Plans screen */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            {/* Middle: Title / Subtitle using your Header component */}
            <Header MText={muscleGroupName} SText={`Level ${level} • ${muscleCategory.toUpperCase()}`} />

            {/* Right: spacer (keeps header visually centered, like your other screen with a right action) */}
            <View style={{ width: 36 }} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Recovery Status Header */}
        <View className="p-6 rounded-2xl mb-4" style={{ backgroundColor: "#1A1925" }}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-psemibold text-xl">{muscleGroupName}</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(recoveryStatus) }}
            >
              <Text className="text-white font-pmedium text-sm">{recoveryStatus}</Text>
            </View>
          </View>

          <Text className="text-gray-400 font-pmedium text-sm mb-2">Last Worked</Text>
          <Text className="text-white font-pbold text-2xl">{lastWorked}</Text>
        </View>

        {/* Quick Stats Grid */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: "#1A1925" }}>
            <Text className="text-gray-400 font-pmedium text-sm">Workouts</Text>
            <Text className="text-white font-pbold text-xl mt-1">{workoutCount}</Text>
            <Text className="text-blue-400 font-pmedium text-xs mt-1">This month</Text>
          </View>

          <View className="flex-1 p-4 rounded-xl" style={{ backgroundColor: "#1A1925" }}>
            <Text className="text-gray-400 font-pmedium text-sm">Avg Volume</Text>
            <Text className="text-white font-pbold text-xl mt-1">{formattedAvgVolume}</Text>
            <Text className="text-green-400 font-pmedium text-xs mt-1">{strengthGain} this month</Text>
          </View>
        </View>

        {/* Workout History */}
        <View className="mb-4">
          <Text className="text-white font-psemibold text-lg mb-3">Recent Workouts</Text>

          {[
            { date: "Jan 15", exercises: sampleExercises.slice(0, 2), volumeLbs: 2850 },
            { date: "Jan 12", exercises: [sampleExercises[2], sampleExercises[0]], volumeLbs: 2200 },
            { date: "Jan 9", exercises: sampleExercises.slice(0, 2), volumeLbs: 2650 },
          ].map((workout, index) => {
            // Convert volume to user's preferred unit
            const convertedVolume = convertWeight(workout.volumeLbs, "imperial", unitSystem);
            const formattedVolume = `${Math.round(convertedVolume).toLocaleString()} ${unitSystem === "metric" ? "kg" : "lbs"}`;

            return (
              <View key={index} className="p-4 rounded-xl mb-2" style={{ backgroundColor: "#1A1925" }}>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-pmedium">{workout.date}</Text>
                  <Text className="text-gray-400 font-pmedium text-sm">{formattedVolume}</Text>
                </View>
                <Text className="text-gray-400 font-pmedium text-sm">
                  {workout.exercises.join(" • ")}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default MuscleGroupDetail;