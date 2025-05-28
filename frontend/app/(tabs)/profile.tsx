import React from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  /* 👇 Animated is no longer needed for a static bar
  Animated,
  */
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import TopBar from "@/components/TopBar";
import pfptest from "@/assets/images/favicon.png";

/* ------------------------------------------------------------------
   Dummy User Data
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
const formatMinutes = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/* ------------------------------------------------------------------
   Progress Bar
-------------------------------------------------------------------*/
const ProgressBar: React.FC<{
  progress: number;
  total: number;
  color: string;
}> = ({ progress, total, color }) => {
  // clamp so we never exceed 100 %
  const progressRatio = Math.min(progress / total, 1);

  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{
          width: `${progressRatio * 100}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

/* ------------------------------------------------------------------
   Main Component
-------------------------------------------------------------------*/
const Profile = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <TopBar subtext={`It's You!`} title="Your Profile" titleTop={true} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {/* ----- User Card ----- */}
        <View
          className="rounded-2xl p-5 mb-6 items-center"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-center justify-center mb-2">
            <Image
              source={pfptest}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                marginRight: 12,
              }}
            />
            <Text
              style={{
                color: primaryColor,
              }}
              className="text-white font-psemibold text-2xl"
            >
              {user.username}
            </Text>
          </View>
          <Text className="text-gray-100 mb-3">
            Joined {formatDate(user.joinDate)}
          </Text>

          {/* Level & XP */}
          <View className="w-full mb-4">
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

          {/* Quick Stats */}
          <View className="flex-row w-full justify-between mt-2">
            <View className="items-center flex-1">
              <FontAwesome5
                name="user-friends"
                size={20}
                color={primaryColor}
              />
              <Text className="text-white mt-1 font-pmedium">
                {user.friends}
              </Text>
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

        {/* ----- Goal ----- */}
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

        {/* ----- Showcase Achievements ----- */}
        <Text className="text-white text-xl font-psemibold mb-3">
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

        {/* ----- Showcase Lift ----- */}
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
