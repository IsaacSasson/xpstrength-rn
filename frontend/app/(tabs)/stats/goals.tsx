// Path: /app/(tabs)/goals.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { router } from "expo-router";
import Header from "@/components/Header";
import Tabs from "@/components/TabList";

/* ------------------------------------------------------------------
   Types
-------------------------------------------------------------------*/
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  date?: string;
  usersUnlocked: number;
  totalUsers: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

type PageType = "achievements" | "muscle-levels";

/* ------------------------------------------------------------------
   Dummy Achievement Data
-------------------------------------------------------------------*/
const dummyAchievements: Achievement[] = [
  // Completed achievements
  {
    id: "a1",
    title: "First Steps",
    description: "Complete your first workout",
    icon: "baby",
    unlocked: true,
    date: "2025-01-15",
    usersUnlocked: 847,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a2",
    title: "Push-Up Rookie",
    description: "Complete 100 total push-ups",
    icon: "medal",
    unlocked: true,
    date: "2025-02-03",
    usersUnlocked: 623,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a3",
    title: "Week Warrior",
    description: "Maintain a 7-day workout streak",
    icon: "fire",
    unlocked: true,
    date: "2025-02-20",
    usersUnlocked: 441,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a4",
    title: "Volume Master",
    description: "Complete 50,000 total reps",
    icon: "dumbbell",
    unlocked: true,
    date: "2025-03-10",
    usersUnlocked: 127,
    totalUsers: 1250,
    rarity: "epic",
  },

  // Locked achievements
  {
    id: "a5",
    title: "Marathon Mindset",
    description: "Run a total of 26.2 miles",
    icon: "running",
    unlocked: false,
    usersUnlocked: 89,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a6",
    title: "Consistency King",
    description: "Maintain a 30-day workout streak",
    icon: "crown",
    unlocked: false,
    usersUnlocked: 203,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a7",
    title: "Iron Will",
    description: "Complete 100 consecutive workout days",
    icon: "shield-alt",
    unlocked: false,
    usersUnlocked: 45,
    totalUsers: 1250,
    rarity: "legendary",
  },
  {
    id: "a8",
    title: "Push-Up Legend",
    description: "Complete 10,000 total push-ups",
    icon: "star",
    unlocked: false,
    usersUnlocked: 67,
    totalUsers: 1250,
    rarity: "legendary",
  },
  {
    id: "a9",
    title: "Speed Demon",
    description: "Complete a workout in under 10 minutes",
    icon: "bolt",
    unlocked: false,
    usersUnlocked: 312,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a10",
    title: "Heavy Lifter",
    description: "Lift a total of 100,000 lbs",
    icon: "weight-hanging",
    unlocked: false,
    usersUnlocked: 134,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a11",
    title: "Time Warrior",
    description: "Complete 500 total workout minutes",
    icon: "clock",
    unlocked: false,
    usersUnlocked: 456,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a12",
    title: "Muscle Memory",
    description: "Complete the same workout 50 times",
    icon: "brain",
    unlocked: false,
    usersUnlocked: 78,
    totalUsers: 1250,
    rarity: "epic",
  },
];

/* ------------------------------------------------------------------
   Helper Functions
-------------------------------------------------------------------*/
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getRarityColor = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return "#4ADE80";
    case "rare":
      return "#3B82F6";
    case "epic":
      return "#A855F7";
    case "legendary":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

const getRarityGradient = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return ["#4ADE80", "#22C55E"];
    case "rare":
      return ["#3B82F6", "#2563EB"];
    case "epic":
      return ["#A855F7", "#9333EA"];
    case "legendary":
      return ["#F59E0B", "#D97706"];
    default:
      return ["#6B7280", "#4B5563"];
  }
};

/* ------------------------------------------------------------------
   Achievement Card Component
-------------------------------------------------------------------*/
const AchievementCard: React.FC<{
  achievement: Achievement;
  primaryColor: string;
  tertiaryColor: string;
}> = ({ achievement, primaryColor, tertiaryColor }) => {
  const percentage = Math.round(
    (achievement.usersUnlocked / achievement.totalUsers) * 100
  );
  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <View
      className="rounded-2xl p-4 mb-3 flex-row items-center relative overflow-hidden"
      style={{
        backgroundColor: achievement.unlocked ? tertiaryColor : "#1A1925",
        borderWidth: achievement.unlocked ? 2 : 1,
        borderColor: achievement.unlocked ? rarityColor : "#2C2B37",
      }}
    >
      {/* Rarity glow effect for unlocked achievements */}
      {achievement.unlocked && (
        <View
          className="absolute inset-0 opacity-10"
          style={{ backgroundColor: rarityColor }}
        />
      )}

      {/* Icon */}
      <View
        className="h-14 w-14 rounded-xl items-center justify-center mr-4 relative"
        style={{
          backgroundColor: achievement.unlocked ? rarityColor : "#2C2B37",
          shadowColor: achievement.unlocked ? rarityColor : "transparent",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <FontAwesome5
          name={achievement.icon as any}
          size={22}
          color={achievement.unlocked ? "#FFF" : "#69697E"}
        />
        {achievement.unlocked && (
          <View className="absolute -top-1 -right-1">
            <FontAwesome5 name="check-circle" size={16} color="#4ADE80" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text
            className="font-psemibold text-base mr-2"
            style={{ color: achievement.unlocked ? "#FFFFFF" : "#A1A1AA" }}
          >
            {achievement.title}
          </Text>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${rarityColor}20` }}
          >
            <Text
              className="text-xs font-pmedium capitalize"
              style={{ color: rarityColor }}
            >
              {achievement.rarity}
            </Text>
          </View>
        </View>

        <Text
          className="text-sm mb-2"
          style={{ color: achievement.unlocked ? "#D1D5DB" : "#6B7280" }}
        >
          {achievement.description}
        </Text>

        {/* Stats */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-400">
            {achievement.usersUnlocked.toLocaleString()} of{" "}
            {achievement.totalUsers.toLocaleString()} users ({percentage}%)
          </Text>

          {achievement.unlocked && achievement.date && (
            <Text className="text-xs" style={{ color: rarityColor }}>
              Unlocked {formatDate(achievement.date)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------
   Main Component
-------------------------------------------------------------------*/
const AchievementsPage = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();

  const unlockedAchievements = dummyAchievements.filter((a) => a.unlocked);
  const lockedAchievements = dummyAchievements.filter((a) => !a.unlocked);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <Header
              MText="Achievements"
              SText="Unlock milestones and compare with others"
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Page tabs */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{ paddingBottom: 30 }}
        style={{
          flex: 1,
        }}
      >
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-4">
              <Text className="text-white text-xl font-psemibold">
                Unlocked ({unlockedAchievements.length})
              </Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="trophy" size={16} color={primaryColor} />
                <Text className="text-sm ml-2" style={{ color: primaryColor }}>
                  {Math.round(
                    (unlockedAchievements.length / dummyAchievements.length) *
                      100
                  )}
                  % Complete
                </Text>
              </View>
            </View>

            {unlockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                primaryColor={primaryColor}
                tertiaryColor={tertiaryColor}
              />
            ))}
          </>
        )}

        {/* Divider */}
        {unlockedAchievements.length > 0 && lockedAchievements.length > 0 && (
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-600" />
            <Text className="text-gray-400 text-sm font-pmedium mx-4">
              Locked Achievements
            </Text>
            <View className="flex-1 h-px bg-gray-600" />
          </View>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-psemibold">
                Locked ({lockedAchievements.length})
              </Text>
              <View className="flex-row items-center">
                <FontAwesome5 name="lock" size={14} color="#6B7280" />
                <Text className="text-sm ml-2 text-gray-400">
                  Keep grinding!
                </Text>
              </View>
            </View>

            {lockedAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                primaryColor={primaryColor}
                tertiaryColor={tertiaryColor}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AchievementsPage;
