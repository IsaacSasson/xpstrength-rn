// Path: /app/workout-details.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";
import type { PastWorkout } from "./workout-history"; // re-use type

/* -------------- Helpers -------------- */
const decodeWorkoutParam = (raw: unknown): PastWorkout | null => {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as PastWorkout;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.date === "string" &&
      typeof parsed.duration === "string" &&
      Array.isArray(parsed.exercises)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/* -------------- Component -------------- */
const WorkoutDetails: React.FC = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const params = useLocalSearchParams<{ workout?: string }>();

  const workout = useMemo(() => decodeWorkoutParam(params.workout), [params]);

  if (!workout) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A", justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <Text className="text-white font-pmedium mb-4">
          Workout data not found.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Text className="text-white font-pmedium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Top SafeArea / Header */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
            accessibilityLabel="Go back"
          >
            <FontAwesome5 name="chevron-left" size={14} color="#FFFFFF" />
          </TouchableOpacity>

          <Text className="text-white font-psemibold text-lg flex-1 text-center ml-2 mr-2">
            {workout.name}
          </Text>

          {/* Spacer for symmetry */}
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4 pb-8"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Meta */}
        <View className="mt-6 mb-4 items-start">
          <Text
            className="font-pmedium text-gray-100 mb-2"
            style={{ color: secondaryColor }}
          >
            {formatDate(workout.date)}
          </Text>

          <View
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-pmedium text-sm">
              {workout.duration}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            width: "100%",
            backgroundColor: tertiaryColor,
            opacity: 0.4,
            marginBottom: 16,
          }}
        />

        {/* Exercises */}
        <View>
          <Text className="text-white font-psemibold text-base mb-4">
            Exercises
          </Text>

          {workout.exercises.map((ex, idx) => (
            <View
              key={`${workout.id}_ex_${idx}`}
              className="flex-row items-center mb-4"
            >
              <MaterialCommunityIcons
                name="checkbox-blank-circle-outline"
                size={16}
                color={primaryColor}
              />
              <Text className="text-white font-pmedium ml-3">{ex.name}</Text>
              <Text className="text-gray-100 ml-auto">
                {ex.sets} × {ex.reps}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View className="mt-8">
          <Text className="text-white font-psemibold text-base mb-2">
            Summary
          </Text>
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-100 font-pmedium">Total Sets:</Text>
            <Text className="text-white font-psemibold ml-2">{totalSets}</Text>
          </View>
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-100 font-pmedium">Exercises:</Text>
            <Text className="text-white font-psemibold ml-2">
              {workout.exercises.length}
            </Text>
          </View>
        </View>

        {/* Future actions placeholder */}
        <View className="mt-10">
          <Text
            className="text-gray-100 text-xs opacity-60"
            style={{ textAlign: "center" }}
          >
            (Add export / duplicate / re-run workout actions here.)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkoutDetails;
