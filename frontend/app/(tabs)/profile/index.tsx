// Path: /app/(tabs)/profile.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import TopBar from "@/components/TopBar";
import pfptest from "@/assets/images/favicon.png";
import { router } from "expo-router";


/* ------------------------------------------------------------------
   Dummy User Data (replace with real state later)
-------------------------------------------------------------------*/
const user = {
  username: "Wiiwho",
  profilePic: { pfptest },
  level: 12,
  xp: 2863,
  xpNext: 5000,
  friends: 14,
  totalWorkouts: 87,
  totalMinutes: 4230, // 70h30m
  joinDate: "2024-01-12",
  goal: "Bench 315 lbs",
  showcaseAchievements: [
    { id: "a1", title: "7-Day Streak", icon: "fire" },
    { id: "a2", title: "100 Push-Ups", icon: "medal" },
    { id: "a3", title: "10 Miles", icon: "running" },
  ],
  showcaseLift: {
    exercise: "Bench Press",
    oneRm: 280,
  },
};

/* ------------------------------------------------------------------
   Helpers
-------------------------------------------------------------------*/
const formatMinutes = (min: number) =>
  `${Math.floor(min / 60)}h ${min % 60}m`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const ProgressBar: React.FC<{
  progress: number;
  total: number;
  color: string;
}> = ({ progress, total, color }) => {
  const ratio = Math.min(progress / total, 1);
  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <View
        className="h-full"
        style={{ width: `${ratio * 100}%`, backgroundColor: color }}
      />
    </View>
  );
};

/* ------------------------------------------------------------------
   Component
-------------------------------------------------------------------*/
const Profile = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar subtext="It's You!" title="Your Profile" titleTop />

      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {/* ---------- USER CARD ---------- */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          {/* top row — avatar & text on left, menu on right */}
          <View className="flex-row justify-between">
            {/* avatar + info */}
            <View className="flex-row">
              <Image
                source={pfptest}
                style={{ width: 60, height: 60, borderRadius: 30 }}
              />
              <View className="ml-3">
                <Text
                  className="text-white font-psemibold text-xl"
                  style={{ color: primaryColor }}
                >
                  {user.username}
                </Text>

                <Text className="text-gray-100 text-xs">
                  Goal:&nbsp;
                  <Text style={{ color: secondaryColor }}>{user.goal}</Text>
                </Text>

                <Text className="text-gray-100 text-xs">
                  Joined {formatDate(user.joinDate)}
                </Text>
              </View>
            </View>

            {/* 3-dot menu (placeholder) */}
            <TouchableOpacity
              className="p-2"
              onPress={() => {
                router.push("/profile/settings");
              }}
            >
              <FontAwesome5 name="cog" size={18} color={primaryColor} />
            </TouchableOpacity>
          </View>

          {/* XP bar */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white">Level {user.level}</Text>
              <Text className="text-gray-100">
                {user.xp}/{user.xpNext} XP
              </Text>
            </View>
            <ProgressBar
              progress={user.xp}
              total={user.xpNext}
              color={primaryColor}
            />
          </View>

          {/* Quick Stats — Friends / Workouts / Time */}
          <View className="flex-row justify-between mt-4">
            <View className="items-center flex-1">
              <FontAwesome5 name="user-friends" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">{user.friends}</Text>
              <Text className="text-gray-100 text-xs">Friends</Text>
            </View>

            <View className="items-center flex-1">
              <MaterialCommunityIcons
                name="dumbbell"
                size={22}
                color={primaryColor}
              />
              <Text className="text-white mt-1 font-pmedium">
                {user.totalWorkouts}
              </Text>
              <Text className="text-gray-100 text-xs">Workouts</Text>
            </View>

            <View className="items-center flex-1">
              <FontAwesome5 name="clock" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">
                {formatMinutes(user.totalMinutes)}
              </Text>
              <Text className="text-gray-100 text-xs">Time</Text>
            </View>
          </View>
        </View>

        {/* ---------- GOAL ---------- */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-center">
            <Text className="text-white font-pmedium text-lg mr-2">
              Current Goal:
            </Text>
            <Text style={{ color: secondaryColor }} className="text-lg">
              {user.goal}
            </Text>
          </View>
        </View>

        {/* ---------- ACHIEVEMENTS ---------- */}
        <Text className="text-white text-xl font-psemibold mb-3 text-center">
          Featured Achievements
        </Text>
        <View className="flex-row mb-6">
          {user.showcaseAchievements.map((ach) => (
            <View key={ach.id} className="flex-1 items-center">
              <View
                className="h-16 w-16 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                <FontAwesome5 name={ach.icon as any} size={24} color="#FFF" />
              </View>
              <Text className="text-center text-white text-xs font-pmedium px-1">
                {ach.title}
              </Text>
            </View>
          ))}
        </View>

        {/* ---------- SPOTLIGHT LIFT ---------- */}
        <Text className="text-white text-xl font-psemibold mb-3">
          Spotlight Exercise
        </Text>
        <View
          className="rounded-2xl p-5"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="arm-flex"
                size={22}
                color={primaryColor}
              />
              <Text className="text-white font-pmedium text-lg ml-2">
                {user.showcaseLift.exercise}
              </Text>
            </View>
            <Text
              className="text-white font-psemibold text-lg"
              style={{ color: primaryColor }}
            >
              {user.showcaseLift.oneRm} lbs
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
