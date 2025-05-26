// Path: /app/(tabs)/goals.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { router } from 'expo-router';

/* ------------------------------------------------------------------
   Types
-------------------------------------------------------------------*/
interface Goal {
  id: string;
  title: string;
  target: number;
  unit: string;
  progress: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
}

/* ------------------------------------------------------------------
   Dummy Data
-------------------------------------------------------------------*/
const dummyGoals: Goal[] = [
  { id: "g1", title: "Do 5,000 total push‑ups", target: 5000, unit: "push‑ups", progress: 2300 },
  { id: "g2", title: "Run 100 total miles", target: 100, unit: "miles", progress: 42 },
];

const dummyAchievements: Achievement[] = [
  { id: "a1", title: "First 100 Push‑Ups", description: "Completed 100 cumulative push‑ups", icon: "medal", unlocked: true, date: "2025-03-10" },
  { id: "a2", title: "7‑Day Streak", description: "Worked out 7 days in a row", icon: "fire", unlocked: true, date: "2025-04-02" },
  { id: "a3", title: "Marathon Mindset", description: "Ran a total of 26 miles", icon: "running", unlocked: false },
  { id: "a4", title: "Consistency Master", description: "30‑day workout streak", icon: "trophy", unlocked: false },
];

/* ------------------------------------------------------------------
   Helpers
-------------------------------------------------------------------*/
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/* ------------------------------------------------------------------
   Progress Bar Component
-------------------------------------------------------------------*/
const ProgressBar: React.FC<{ progress: number; total: number; color: string }> = ({ progress, total, color }) => {
  const width = (progress / total) * 100;
  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <Animated.View style={{ width: `${width}%`, backgroundColor: color }} className="h-full rounded-full" />
    </View>
  );
};

/* ------------------------------------------------------------------
   Main Component
-------------------------------------------------------------------*/
const GoalsAndAchievements = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);

  const adjustProgress = (id: string, delta: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, progress: Math.max(0, Math.min(g.target, g.progress + delta)) } : g,
      ),
    );
  };

  const goBack = () => {
   router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={goBack} className="mr-4">
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-psemibold text-white">Goals & Achievements</Text>
              <Text className="font-pmedium text-sm text-gray-100">Track progress and celebrate wins</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-6" contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Active Goals */}
        <Text className="text-white text-xl font-psemibold mb-4">Active Goals</Text>
        {goals.map((goal) => (
          <View key={goal.id} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: tertiaryColor }}>
            <Text className="text-white font-pmedium text-lg mb-1">{goal.title}</Text>
            <ProgressBar progress={goal.progress} total={goal.target} color={primaryColor} />
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-gray-100">
                {goal.progress}/{goal.target} {goal.unit}
              </Text>
              <View className="flex-row">
                <TouchableOpacity onPress={() => adjustProgress(goal.id, -1)} className="h-8 w-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: primaryColor }}>
                  <FontAwesome5 name="minus" size={12} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => adjustProgress(goal.id, +1)} className="h-8 w-8 rounded-full items-center justify-center" style={{ backgroundColor: primaryColor }}>
                  <FontAwesome5 name="plus" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Achievements */}
        <Text className="text-white text-xl font-psemibold mt-6 mb-4">Milestones</Text>
        {dummyAchievements.map((ach) => (
          <View key={ach.id} className="rounded-2xl p-4 mb-3 flex-row items-center" style={{ backgroundColor: ach.unlocked ? tertiaryColor : "#1A1925" }}>
            <View className="h-12 w-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: ach.unlocked ? primaryColor : "#2C2B37" }}>
              <FontAwesome5 name={ach.icon as any} size={20} color={ach.unlocked ? "#FFF" : "#69697E"} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-pmedium">{ach.title}</Text>
              <Text className="text-gray-100 text-sm">{ach.description}</Text>
            </View>
            {ach.unlocked && ach.date && (
              <Text className="text-gray-100 text-xs ml-3">{formatDate(ach.date)}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default GoalsAndAchievements;
