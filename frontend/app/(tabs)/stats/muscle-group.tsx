// Path: /app/(tabs)/stats/muscle-group.tsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserProgress } from "@/context/UserProvider";
import Header from "@/components/Header";

const MuscleGroupDetail = () => {
  const { primaryColor } = useThemeContext();
  const { level } = useUserProgress();
  const { group } = useLocalSearchParams<{ group?: string | string[] }>();

  // Normalize "group" to a simple string key
  const groupKey = Array.isArray(group) ? group[0] : group ?? "";

  // Map muscle group IDs to display names
  const muscleGroupNames: Record<string, string> = {
    abdominals: "Abdominals",
    biceps: "Biceps",
    chest: "Chest",
    forearms: "Forearms",
    neck: "Neck",
    quadriceps: "Quadriceps",
    shoulders: "Shoulders",
    traps: "Traps",
  };

  const muscleGroupName = muscleGroupNames[groupKey] || "Unknown Muscle Group";

  // Boilerplate data - replace with real data later
  const recoveryStatus: "Fresh" | "Recovering" | "Fatigued" | string = "Fresh";
  const lastWorked = "3 days ago";
  const workoutCount = 12;
  const avgVolume = "2,450 lbs";
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

  const recoveryTips =
    recoveryStatus === "Fresh"
      ? [
          "Ready for intense training",
          "Consider progressive overload",
          "Focus on compound movements",
          "Maintain proper form",
        ]
      : recoveryStatus === "Recovering"
      ? [
          "Light to moderate intensity",
          "Focus on technique refinement",
          "Consider active recovery",
          "Ensure adequate protein intake",
        ]
      : [
          "Prioritize rest and recovery",
          "Light stretching or mobility work",
          "Avoid high-intensity training",
          "Focus on sleep and nutrition",
        ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header row identical in structure to your Workout Plans screen */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            {/* Left: Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                height: 36,
                width: 36,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Middle: Title / Subtitle using your Header component */}
            <Header MText={muscleGroupName} SText={`Level ${level}`} />

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
            <Text className="text-white font-pbold text-xl mt-1">{avgVolume}</Text>
            <Text className="text-green-400 font-pmedium text-xs mt-1">{strengthGain} this month</Text>
          </View>
        </View>

        {/* Workout History */}
        <View className="mb-4">
          <Text className="text-white font-psemibold text-lg mb-3">Recent Workouts</Text>

          {[
            { date: "Jan 15", exercises: ["Bench Press", "Incline DB Press"], volume: "2,850 lbs" },
            { date: "Jan 12", exercises: ["Push-ups", "Chest Flyes"], volume: "2,200 lbs" },
            { date: "Jan 9", exercises: ["Bench Press", "Dips"], volume: "2,650 lbs" },
          ].map((workout, index) => (
            <View key={index} className="p-4 rounded-xl mb-2" style={{ backgroundColor: "#1A1925" }}>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white font-pmedium">{workout.date}</Text>
                <Text className="text-gray-400 font-pmedium text-sm">{workout.volume}</Text>
              </View>
              <Text className="text-gray-400 font-pmedium text-sm">
                {workout.exercises.join(" • ")}
              </Text>
            </View>
          ))}
        </View>

        {/* Exercise Recommendations */}
        <View className="mb-4">
          <Text className="text-white font-psemibold text-lg mb-3">Recommended Exercises</Text>

          <View className="p-4 rounded-xl" style={{ backgroundColor: "#1A1925" }}>
            <Text className="text-gray-400 font-pmedium text-sm mb-3">
              Based on your training history and recovery status:
            </Text>

            {[
              "Bench Press - 4 sets of 8-10 reps",
              "Incline Dumbbell Press - 3 sets of 10-12 reps",
              "Chest Flyes - 3 sets of 12-15 reps",
              "Push-ups - 2 sets to failure",
            ].map((exercise, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: primaryColor }} />
                <Text className="text-white font-pmedium text-sm flex-1">{exercise}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recovery Tips */}
        <View className="mb-4">
          <Text className="text-white font-psemibold text-lg mb-3">Recovery Tips</Text>

          <View className="p-4 rounded-2xl" style={{ backgroundColor: "#1A1925" }}>
            <Text className="text-gray-400 font-pmedium text-sm mb-3">
              Your {muscleGroupName.toLowerCase()} are currently {recoveryStatus.toLowerCase()}. Here's
              what you should focus on:
            </Text>

            {recoveryTips.map((tip, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <Text className="text-gray-400 font-pmedium text-sm mr-2">•</Text>
                <Text className="text-white font-pmedium text-sm flex-1">{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MuscleGroupDetail;