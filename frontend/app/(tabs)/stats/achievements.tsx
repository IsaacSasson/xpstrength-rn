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
  icon: string; // FontAwesome5 icon name
  unlocked: boolean;
  date?: string; // ISO or displayable date
  usersUnlocked: number;
  totalUsers: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

type PageType = "achievements" | "muscle-levels";

/* ------------------------------------------------------------------
   Dummy Achievement Data (50 tiered items)
   Rarity mix: 25 common, 15 rare, 7 epic, 3 legendary
-------------------------------------------------------------------*/
const dummyAchievements: Achievement[] = [
  // ---------- COMMON (25) ----------
  {
    id: "a1",
    title: "First Steps",
    description: "Complete your first workout",
    icon: "baby",
    unlocked: true,
    date: "2025-01-15",
    usersUnlocked: 900,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a2",
    title: "Routine Rookie",
    description: "Complete 5 workouts",
    icon: "calendar-check",
    unlocked: true,
    date: "2025-02-03",
    usersUnlocked: 780,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a3",
    title: "Pace Setter",
    description: "Finish a workout under 30 minutes",
    icon: "stopwatch",
    unlocked: true,
    date: "2025-02-12",
    usersUnlocked: 710,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a4",
    title: "Push-Up Rookie",
    description: "Complete 100 total push-ups",
    icon: "medal",
    unlocked: true,
    date: "2025-02-20",
    usersUnlocked: 650,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a5",
    title: "Cardio Kickoff",
    description: "Run or walk 5 miles total",
    icon: "running",
    unlocked: false,
    usersUnlocked: 620,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a6",
    title: "Weight Watcher",
    description: "Lift 5,000 lbs total",
    icon: "weight-hanging",
    unlocked: false,
    usersUnlocked: 590,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a7",
    title: "Streak Spark",
    description: "Maintain a 3-day workout streak",
    icon: "fire",
    unlocked: false,
    usersUnlocked: 560,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a8",
    title: "Rep Counter",
    description: "Accumulate 1,000 reps",
    icon: "chart-line",
    unlocked: false,
    usersUnlocked: 540,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a9",
    title: "Hydration Station",
    description: "Complete 5 recovery/cooldown sessions",
    icon: "spa",
    unlocked: false,
    usersUnlocked: 520,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a10",
    title: "Stretch & Flex",
    description: "Do 3 mobility sessions",
    icon: "leaf",
    unlocked: false,
    usersUnlocked: 505,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a11",
    title: "New Moves",
    description: "Try 10 different exercises",
    icon: "cogs",
    unlocked: false,
    usersUnlocked: 490,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a12",
    title: "Tempo Taster",
    description: "Finish 3 interval workouts",
    icon: "tachometer-alt",
    unlocked: false,
    usersUnlocked: 475,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a13",
    title: "Habit Builder",
    description: "Work out on 10 different days",
    icon: "calendar-alt",
    unlocked: false,
    usersUnlocked: 460,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a14",
    title: "Core Kickoff",
    description: "Complete 200 ab reps",
    icon: "bullseye",
    unlocked: false,
    usersUnlocked: 440,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a15",
    title: "Leg Day Light",
    description: "Complete 2 leg-focused workouts",
    icon: "bicycle",
    unlocked: false,
    usersUnlocked: 430,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a16",
    title: "Chest Starter",
    description: "Complete 2 push-focused workouts",
    icon: "dumbbell",
    unlocked: false,
    usersUnlocked: 420,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a17",
    title: "Back Builder",
    description: "Complete 2 pull-focused workouts",
    icon: "wrench",
    unlocked: false,
    usersUnlocked: 415,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a18",
    title: "Social Starter",
    description: "Add 1 friend or follow someone",
    icon: "user-friends",
    unlocked: false,
    usersUnlocked: 380,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a19",
    title: "Playlist Pump",
    description: "Finish a workout with music",
    icon: "music",
    unlocked: false,
    usersUnlocked: 375,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a20",
    title: "Night Owl",
    description: "Work out after 9 PM",
    icon: "moon",
    unlocked: false,
    usersUnlocked: 360,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a21",
    title: "Early Bird",
    description: "Work out before 7 AM",
    icon: "sun",
    unlocked: true,
    date: "2025-03-05",
    usersUnlocked: 350,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a22",
    title: "Cooldown Champ",
    description: "Finish cooldown after 10 workouts",
    icon: "wind",
    unlocked: false,
    usersUnlocked: 340,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a23",
    title: "Notebook Nerd",
    description: "Add notes to 5 exercises",
    icon: "book",
    unlocked: false,
    usersUnlocked: 330,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a24",
    title: "Steady Steps",
    description: "Log activity 7 days this month",
    icon: "calendar",
    unlocked: false,
    usersUnlocked: 320,
    totalUsers: 1250,
    rarity: "common",
  },
  {
    id: "a25",
    title: "Form Finder",
    description: "Watch 5 form tips",
    icon: "book-open",
    unlocked: false,
    usersUnlocked: 315,
    totalUsers: 1250,
    rarity: "common",
  },

  // ---------- RARE (15) ----------
  {
    id: "a26",
    title: "Second Steps",
    description: "Complete 15 workouts",
    icon: "shoe-prints",
    unlocked: false,
    usersUnlocked: 290,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a27",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "fire",
    unlocked: false,
    usersUnlocked: 260,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a28",
    title: "Rep Machine",
    description: "Accumulate 5,000 reps",
    icon: "chart-bar",
    unlocked: false,
    usersUnlocked: 240,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a29",
    title: "Minute Miner",
    description: "Reach 500 workout minutes",
    icon: "clock",
    unlocked: false,
    usersUnlocked: 225,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a30",
    title: "Pace Predator",
    description: "Finish a workout under 15 minutes",
    icon: "stopwatch",
    unlocked: false,
    usersUnlocked: 210,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a31",
    title: "Weight Wrangler",
    description: "Lift 25,000 lbs total",
    icon: "weight-hanging",
    unlocked: false,
    usersUnlocked: 195,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a32",
    title: "Variety Pack",
    description: "Try 25 different exercises",
    icon: "cubes",
    unlocked: false,
    usersUnlocked: 180,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a33",
    title: "HIIT Hype",
    description: "Complete 10 interval workouts",
    icon: "bolt",
    unlocked: false,
    usersUnlocked: 170,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a34",
    title: "Explorer",
    description: "Try 5 different workout plans",
    icon: "map",
    unlocked: false,
    usersUnlocked: 165,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a35",
    title: "Coachable",
    description: "Add notes on 10 workouts",
    icon: "clipboard-check",
    unlocked: false,
    usersUnlocked: 160,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a36",
    title: "Mind–Muscle Link",
    description: "Perform 10 tempo-focused sets",
    icon: "brain",
    unlocked: false,
    usersUnlocked: 150,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a37",
    title: "Route Runner",
    description: "Run or walk 20 miles total",
    icon: "route",
    unlocked: false,
    usersUnlocked: 145,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a38",
    title: "Recovery Rebel",
    description: "Do 10 recovery sessions",
    icon: "spa",
    unlocked: false,
    usersUnlocked: 140,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a39",
    title: "Pace Keeper",
    description: "Complete 10 workouts between 35–45 min",
    icon: "tachometer-alt",
    unlocked: false,
    usersUnlocked: 130,
    totalUsers: 1250,
    rarity: "rare",
  },
  {
    id: "a40",
    title: "Consistency Cadet",
    description: "Work out 20 days in a month",
    icon: "calendar-check",
    unlocked: false,
    usersUnlocked: 125,
    totalUsers: 1250,
    rarity: "rare",
  },

  // ---------- EPIC (7) ----------
  {
    id: "a41",
    title: "Volume Master",
    description: "Accumulate 50,000 reps",
    icon: "dumbbell",
    unlocked: false,
    usersUnlocked: 100,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a42",
    title: "Iron Marathon",
    description: "Lift 100,000 lbs total",
    icon: "weight-hanging",
    unlocked: false,
    usersUnlocked: 90,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a43",
    title: "Streak Inferno",
    description: "Maintain a 30-day streak",
    icon: "fire",
    unlocked: false,
    usersUnlocked: 80,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a44",
    title: "Tempo Titan",
    description: "Complete 25 interval workouts",
    icon: "tachometer-alt",
    unlocked: false,
    usersUnlocked: 75,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a45",
    title: "Variety Virtuoso",
    description: "Try 50 different exercises",
    icon: "cubes",
    unlocked: false,
    usersUnlocked: 70,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a46",
    title: "Endurance Engine",
    description: "Reach 1,500 workout minutes",
    icon: "battery-full",
    unlocked: false,
    usersUnlocked: 65,
    totalUsers: 1250,
    rarity: "epic",
  },
  {
    id: "a47",
    title: "Speedrunner",
    description: "Finish a workout under 10 minutes",
    icon: "bolt",
    unlocked: false,
    usersUnlocked: 60,
    totalUsers: 1250,
    rarity: "epic",
  },

  // ---------- LEGENDARY (3) ----------
  {
    id: "a48",
    title: "Consistency King",
    description: "Maintain a 100-day streak",
    icon: "crown",
    unlocked: false,
    usersUnlocked: 25,
    totalUsers: 1250,
    rarity: "legendary",
  },
  {
    id: "a49",
    title: "Mythic Lifter",
    description: "Lift 500,000 lbs total",
    icon: "gem",
    unlocked: false,
    usersUnlocked: 18,
    totalUsers: 1250,
    rarity: "legendary",
  },
  {
    id: "a50",
    title: "Push-Up Legend",
    description: "Complete 10,000 total push-ups",
    icon: "star",
    unlocked: false,
    usersUnlocked: 12,
    totalUsers: 1250,
    rarity: "legendary",
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
type AchievementCardProps = {
  achievement: Achievement;
  primaryColor: string;
  tertiaryColor: string;
  enableTestControls?: boolean;
  onToggleUnlock?: (nextValue: boolean) => void;
};

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  primaryColor,
  tertiaryColor,
  enableTestControls = true,
  onToggleUnlock,
}) => {
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
      {achievement.unlocked && (
        <View
          className="absolute inset-0 opacity-10"
          style={{ backgroundColor: rarityColor }}
        />
      )}

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
      </View>

      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
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

          {/* Test-only unlock toggle */}
          {enableTestControls && (
            <TouchableOpacity
              onPress={() => onToggleUnlock?.(!achievement.unlocked)}
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: "#2C2B37" }}
            >
              <Text className="text-xs" style={{ color: "#E5E7EB" }}>
                {achievement.unlocked ? "Lock" : "Unlock"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text
          className="text-sm mb-2"
          style={{ color: achievement.unlocked ? "#D1D5DB" : "#6B7280" }}
        >
          {achievement.description}
        </Text>

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

  const SHOW_TEST_CONTROLS = true;

  const [achievements, setAchievements] =
    useState<Achievement[]>(dummyAchievements);

  const setUnlocked = (id: string, value: boolean) => {
    setAchievements((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              unlocked: value,
              date: value ? new Date().toISOString() : undefined,
            }
          : a
      )
    );
  };

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{ paddingBottom: 30 }}
        style={{ flex: 1 }}
      >
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
                    (unlockedAchievements.length / achievements.length) * 100
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
                enableTestControls={SHOW_TEST_CONTROLS}
                onToggleUnlock={(next) => setUnlocked(achievement.id, next)}
              />
            ))}
          </>
        )}

        {unlockedAchievements.length > 0 && lockedAchievements.length > 0 && (
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-gray-600" />
            <Text className="text-gray-400 text-sm font-pmedium mx-4">
              Locked Achievements
            </Text>
            <View className="flex-1 h-px bg-gray-600" />
          </View>
        )}

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
                enableTestControls={SHOW_TEST_CONTROLS}
                onToggleUnlock={(next) => setUnlocked(achievement.id, next)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AchievementsPage;