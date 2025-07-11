import React from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import pfptest from "@/assets/images/favicon.png";

/* ------------------------------------------------------------------ */
/*                               Utils                                */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*                           Friend Profile                           */
/* ------------------------------------------------------------------ */
const FriendProfile = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  /* ---- params from FriendCard ---- */
  const {
    name = "Unknown",
    level = "0",
    xp = "0",
    joinDate = "2025-01-01",
    goal = "Keep grinding!",
    exercise = "Bench Press",
    oneRm = "0",
    friends = "0",
    workouts = "0",
  } = useLocalSearchParams<{
    name?: string;
    level?: string;
    xp?: string;
    joinDate?: string;
    goal?: string;
    exercise?: string;
    oneRm?: string;
    friends?: string;
    workouts?: string;
  }>();

  /* ---- derived ---- */
  const levelNum = Number(level);
  const xpNum = Number(xp);
  const xpNext = (levelNum + 1) * 250;
  const workoutsNum = Number(workouts);
  const oneRmNum = Number(oneRm);
  const friendsNum = Number(friends);

  /* ---------------------------------------------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* ---------- header ---------- */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6 mb-6">
          <Header MText={`${name}'s Profile`} SText="It's Your Friend!" />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {/* --------------- USER CARD --------------- */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          {/* top row → avatar/info + menu dots */}
          <View className="flex-row justify-between">
            {/* avatar + text */}
            <View className="flex-row">
              <Image
                source={pfptest}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                }}
              />
              <View className="ml-3">
                <Text
                  className="text-white font-psemibold text-xl"
                  style={{ color: primaryColor }}
                >
                  {name}
                </Text>

                <Text className="text-gray-100 text-xs">
                  Goal:&nbsp;
                  <Text style={{ color: secondaryColor }}>{goal}</Text>
                </Text>
                <Text className="text-gray-100 text-xs">
                  Joined {formatDate(joinDate)}
                </Text>
              </View>
            </View>

            {/* 3-dot menu */}
            <TouchableOpacity
              className="p-2"
              onPress={() => {
                /* future action sheet */
              }}
            >
              <FontAwesome5 name="ellipsis-h" size={18} color={primaryColor} />
            </TouchableOpacity>
          </View>

          {/* --- XP progress bar --- */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white">Level {levelNum}</Text>
              <Text className="text-gray-100">
                {xpNum}/{xpNext} XP
              </Text>
            </View>
            <ProgressBar progress={xpNum} total={xpNext} color={primaryColor} />
          </View>

          {/* --- Quick stats (Friends / Workouts / Time) --- */}
          <View className="flex-row w-full justify-between mt-4">
            <View className="items-center flex-1">
              <FontAwesome5 name="user-friends" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">{friendsNum}</Text>
              <Text className="text-gray-100 text-xs">Friends</Text>
            </View>
            <View className="items-center flex-1">
              <FontAwesome5 name="dumbbell" size={22} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">
                {workoutsNum}
              </Text>
              <Text className="text-gray-100 text-xs">Workouts</Text>
            </View>
            <View className="items-center flex-1">
              <FontAwesome5 name="clock" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">
                {Math.floor((workoutsNum * 45) / 60)}h{" "}
                {(workoutsNum * 45) % 60}m
              </Text>
              <Text className="text-gray-100 text-xs">Time</Text>
            </View>
          </View>
        </View>

        {/* --------------- SPOTLIGHT --------------- */}
        <Text className="text-white text-xl font-psemibold mb-3">
          Spotlight Exercise
        </Text>
        <View
          className="rounded-2xl p-5 mb-6"
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
                {exercise}
              </Text>
            </View>
            <Text
              className="text-white font-psemibold text-lg"
              style={{ color: primaryColor }}
            >
              {oneRmNum} lbs
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default FriendProfile;
