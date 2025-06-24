// Path: /app/(tabs)/home.tsx
import React from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import TopBar from "@/components/TopBar";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import ActivityView from "@/components/home/ActivityView";
import TodaysWorkout from "@/components/home/TodaysWorkout";
import QuickActions from "@/components/home/QuickActions";

import { useThemeContext } from "@/context/ThemeContext";

const Home = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();

  const goToCreateWorkout = () => router.push("/create-workout");
  const goToPlannedWorkouts = () => router.push("/weekly-plan");
  const goToFriends = () => router.push("/friends");
  const goToStats = () => router.push("/stats");

  const today = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" } as const;
  const formattedDate = today.toLocaleDateString("en-US", options);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar subtext="Welcome Back" title="Wiiwho" titleTop={false} />

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-6">
        {/* Today's Date */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-pmedium text-lg">
            {formattedDate}
          </Text>
          <TouchableOpacity
            onPress={goToPlannedWorkouts}
            className="flex-row items-center"
          >
            <Text style={{ color: primaryColor }} className="mr-2 font-pmedium">
              Weekly Plan
            </Text>
            <FontAwesome5 name="calendar-alt" size={16} color={primaryColor} />
          </TouchableOpacity>
        </View>

        <TodaysWorkout />

        <Text className="text-white text-xl font-psemibold mb-4">
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap mb-8">
          <QuickActions
            title="Create New Workout"
            icon="dumbbell"
            iconType="material"
            onPress={goToCreateWorkout}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
          <QuickActions
            title="View Workout Plan"
            icon="calendar-week"
            onPress={goToPlannedWorkouts}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
          <QuickActions
            title="Invite Friends"
            icon="user-plus"
            onPress={goToFriends}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
          <QuickActions
            title="View Progress"
            icon="chart-line"
            onPress={goToStats}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
        </View>
        <ActivityView />
      </ScrollView>
    </View>
  );
};

export default Home;
