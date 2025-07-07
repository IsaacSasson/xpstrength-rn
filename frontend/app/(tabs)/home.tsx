import React, { useMemo, useState } from "react";
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
import TodaysWorkout, { WorkoutType } from "@/components/home/TodaysWorkout";
import QuickActions from "@/components/home/QuickActions";
import Calender from "@/components/home/Calender";
import { useThemeContext } from "@/context/ThemeContext";

/* ------------------------------ Helpers -------------------------------- */
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const startOfToday = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

/* ----------------------------- Component ------------------------------- */
const Home = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();

  /* -------- Public navigation shortcuts -------- */
  const goToCreateWorkout = () => router.push("/create-workout");
  const goToPlannedWorkouts = () => router.push("/weekly-plan");
  const goToFriends = () => router.push("/friends");
  const goToStats = () => router.push("/stats");

  /* -------- Calendar / selection state -------- */
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  /* -------- Demo data sets -------- */
  const restDays = useMemo<Date[]>(() => [], []);          // add real rest days
  const restSet = useMemo(() => new Set(restDays.map(dateKey)), [restDays]);

  const workoutsByDate: Record<string, WorkoutType> = useMemo(() => {
    const today = new Date();
    return {
      [dateKey(today)]: {
        exists: true,
        name: "Push Day",
        calories: 550,
        exercises: [
          { name: "Bench Press", sets: 4, reps: "8-10" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
          { name: "Shoulder Press", sets: 3, reps: "10-12" },
          { name: "Tricep Pushdown", sets: 3, reps: "12-15" },
        ],
      },
      // add more scheduled workouts here...
    };
  }, []);

  /* -------- Determine what to show -------- */
  const key = dateKey(selectedDate);
  const workoutForDate = workoutsByDate[key] ?? null;

  const isPastEmpty =
    selectedDate < startOfToday &&
    !restSet.has(key) &&
    workoutForDate === null;

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  } as const);

  /* ----------------------------- Render ------------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar subtext="Welcome Back" title="Wiiwho" titleTop={false} />

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-6">
        {/* Header date label */}
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

        {/* Calendar */}
        <Calender
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          restDays={restDays}
        />

        {/* Workout card (or “No Workout” card) */}
        <TodaysWorkout
          workout={workoutForDate}
          allowCreate={!isPastEmpty}
        />

        {/* Quick Actions */}
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
