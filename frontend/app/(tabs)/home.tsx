// Path: /app/(tabs)/home.tsx
import React from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import TopBar from "@/components/TopBar";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// Import just the theme context
import { useThemeContext } from "@/context/ThemeContext";

// Mock data for today's workout
const todaysWorkout = {
  exists: true,
  name: "Push Day",
  exercises: [
    { name: "Bench Press", sets: 4, reps: "8-10" },
    { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
    { name: "Shoulder Press", sets: 3, reps: "10-12" },
    { name: "Tricep Pushdown", sets: 3, reps: "12-15" },
  ],
  calories: 550, // calorie estimate replaces time
};

const Home = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  // Navigation functions
  const goToEditWorkout = () => router.push("/edit-workout");
  const goToCreateWorkout = () => router.push("/create-workout");
  const goToPlannedWorkouts = () => router.push("/weekly-plan");
  const goToActiveWorkout = () => router.push("/active-workout");

  // Format today's date
  const today = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" } as const;
  const formattedDate = today.toLocaleDateString("en-US", options);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Top Header Section */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <TopBar subtext="Welcome Back" title="Wiiwho" titleTop={false} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-6">
        {/* Today's Date */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-pmedium text-lg">{formattedDate}</Text>
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

        {/* Today's Workout Card */}
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-psemibold">
              Today's Workout
            </Text>

            {/* Pencil-only edit button */}
            {todaysWorkout.exists && (
              <TouchableOpacity
                onPress={goToEditWorkout}
                className="p-2 rounded-lg"
              >
                <FontAwesome5 name="pencil-alt" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {todaysWorkout.exists ? (
            <View>
              <Text
                style={{ color: secondaryColor }}
                className="text-lg font-pmedium mb-4"
              >
                {todaysWorkout.name}
              </Text>

              {/* Exercise List */}
              <View className="mb-4">
                {todaysWorkout.exercises.map((exercise, index) => (
                  <View
                    key={index}
                    className="flex-row items-center mb-3 last:mb-0"
                  >
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={18}
                      color={primaryColor}
                    />
                    <Text className="text-white font-pmedium ml-3">
                      {exercise.name}
                    </Text>
                    <Text className="text-gray-100 ml-auto">
                      {exercise.sets} sets × {exercise.reps}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row items-center justify-between mt-2">
                {/* Calorie estimate */}
                <View className="flex-row items-center">
                  <FontAwesome5 name="fire" size={14} color="#f97316" />
                  <Text className="text-orange-500 ml-2">
                    ≈ {todaysWorkout.calories} kcal
                  </Text>
                </View>

                {/* Start Workout button */}
                <TouchableOpacity
                  onPress={goToActiveWorkout}
                  style={{ backgroundColor: primaryColor }}
                  className="flex-row items-center px-4 py-2 rounded-lg"
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="play" size={14} color="#FFF" />
                  <Text className="text-white font-pmedium ml-2">
                    Start Workout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <FontAwesome5
                name="calendar-times"
                size={50}
                color={primaryColor}
              />
              <Text className="text-white font-pmedium text-center mt-4 text-lg">
                No Workout Scheduled
              </Text>
              <Text className="text-gray-100 text-center mt-2 mb-4">
                You don't have a workout planned for today.
              </Text>

              <TouchableOpacity
                onPress={goToCreateWorkout}
                style={{ backgroundColor: primaryColor }}
                className="flex-row items-center px-6 py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <FontAwesome5 name="plus" size={14} color="#FFF" />
                <Text className="text-white font-pmedium ml-2">
                  Create Workout
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <Text className="text-white text-xl font-psemibold mb-4">
          Quick Actions
        </Text>
        <View className="flex-row flex-wrap mb-8">
          <ActionButton
            title="Create New Workout"
            icon="dumbbell"
            iconType="material"
            onPress={goToCreateWorkout}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
          <ActionButton
            title="View Workout Plan"
            icon="calendar-week"
            onPress={goToPlannedWorkouts}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
          <ActionButton
            title="Invite Friends"
            icon="user-plus"
            onPress={() => router.push("/friends")}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
          <ActionButton
            title="View Progress"
            icon="chart-line"
            onPress={() => router.push("/stats")}
            iconColor={primaryColor}
            backgroundColor={tertiaryColor}
          />
        </View>

        {/* Recent Activity */}
        <Text className="text-white text-xl font-psemibold mb-4">
          Recent Activity
        </Text>
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-start mb-4">
            <View
              style={{ backgroundColor: primaryColor }}
              className="h-10 w-10 rounded-full items-center justify-center mr-3"
            >
              <FontAwesome5 name="trophy" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-pmedium">
                New Personal Best!
              </Text>
              <Text className="text-gray-100">
                Bench Press: 225 lbs × 8 reps
              </Text>
              <Text className="text-gray-100 text-xs mt-1">
                Yesterday at 7:24 PM
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-4">
            <View className="bg-black-200 h-10 w-10 rounded-full items-center justify-center mr-3">
              <FontAwesome5 name="dumbbell" size={18} color={primaryColor} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-pmedium">Completed Workout</Text>
              <Text className="text-gray-100">Pull Day: 45 minutes</Text>
              <Text className="text-gray-100 text-xs mt-1">
                2 days ago at 6:15 PM
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="bg-black-200 h-10 w-10 rounded-full items-center justify-center mr-3">
              <FontAwesome5 name="user-friends" size={16} color={primaryColor} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-pmedium">
                Friend Request Accepted
              </Text>
              <Text className="text-gray-100">
                You and Alex are now friends
              </Text>
              <Text className="text-gray-100 text-xs mt-1">
                3 days ago at 11:32 AM
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/* ── Action Button Component ─────────────────────────────────────── */
interface ActionButtonProps {
  title: string;
  icon: any;
  iconType?: "material" | "fontawesome";
  onPress: () => void;
  iconColor?: string;
  backgroundColor?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  icon,
  iconType = "fontawesome",
  onPress,
  iconColor,
  backgroundColor,
}) => (
  <View className="w-1/2 p-2">
    <TouchableOpacity
      onPress={onPress}
      className="rounded-xl h-[90px] justify-center items-center p-4"
      activeOpacity={0.7}
      style={{ backgroundColor }}
    >
      {iconType === "material" ? (
        <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
      ) : (
        <FontAwesome5 name={icon} size={24} color={iconColor} />
      )}
      <Text className="text-white font-pmedium text-center mt-3">{title}</Text>
    </TouchableOpacity>
  </View>
);

export default Home;
