// Path: /app/(tabs)/home/index.tsx
import React, { useMemo, useState, useCallback } from "react";
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
import QuickActionsCustomizer, {
  ActionDefinition,
} from "@/components/home/QuickActionsCustomizer";

/* ---------- helpers ---------- */
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const midnight = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

/* Heading builder (moved out of TodaysWorkout) */
const getHeadingForDate = (selectedDate: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sel = new Date(selectedDate);
  sel.setHours(0, 0, 0, 0);

  const diffDays = Math.round((sel.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today's Workout";
  if (diffDays === 1) return "Tomorrow's Workout";
  if (diffDays === -1) return "Yesterday's Workout";

  const dayName = sel.toLocaleDateString("en-US", { weekday: "long" });
  return `${dayName}'s Workout`;
};

export default function Home() {
  const { primaryColor, tertiaryColor } = useThemeContext();

  /* ---- navigation ---- */
  const goToCreateWorkout = () => router.push("/home/create-workout");
  const goToPlannedWorkouts = () => router.push("/home/weekly-plan");
  const goToWorkoutPlans = () => router.push("/home/workout-plans");
  const goToFriends = () => router.push("/friends");
  const goToStats = () => router.push("/stats/stats-over-time");

  /* ---- calendar ---- */
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const restDays = useMemo<Date[]>(() => [], []);
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
    };
  }, []);

  const key = dateKey(selectedDate);
  const workoutForDate = workoutsByDate[key] ?? null;
  const isPastEmpty =
    selectedDate < midnight && !restSet.has(key) && !workoutForDate;

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const heading = getHeadingForDate(selectedDate);

  /* ---- quick actions ---- */
  const allActions: ActionDefinition[] = useMemo(
    () => [
      {
        id: "createWorkout",
        title: "Create New Workout",
        icon: "dumbbell",
        iconType: "material",
        onPress: goToCreateWorkout,
      },
      {
        id: "viewPlan",
        title: "Weekly Plan",
        icon: "calendar-week",
        iconType: "fontawesome",
        onPress: goToPlannedWorkouts,
      },
      {
        id: "workoutPlans",
        title: "Workout Plans",
        icon: "clipboard-list",
        iconType: "fontawesome",
        onPress: goToWorkoutPlans,
      },
      {
        id: "inviteFriends",
        title: "Invite Friends",
        icon: "user-plus",
        iconType: "fontawesome",
        onPress: goToFriends,
      },
      {
        id: "viewProgress",
        title: "View Progress",
        icon: "chart-line",
        iconType: "fontawesome",
        onPress: goToStats,
      },
      // extras
      {
        id: "exerciseList",
        title: "Exercise List",
        icon: "list",
        iconType: "fontawesome",
        onPress: () => router.push("/home/exercise-list"),
      },
      {
        id: "personalBests",
        title: "Personal Bests",
        icon: "trophy",
        iconType: "fontawesome",
        onPress: () => router.push("/stats/personal-bests"),
      },
      {
        id: "goals",
        title: "Goals",
        icon: "medal",
        iconType: "fontawesome",
        onPress: () => router.push("/stats/goals"),
      },
      {
        id: "settings",
        title: "Settings",
        icon: "cog",
        iconType: "fontawesome",
        onPress: () => router.push("/profile/settings"),
      },
    ],
    [
      goToCreateWorkout,
      goToPlannedWorkouts,
      goToWorkoutPlans,
      goToFriends,
      goToStats,
    ]
  );

  // allow nulls = empty slots
  const [quickSlotIds, setQuickSlotIds] = useState<(string | null)[]>([
    "createWorkout",
    "viewPlan",
    "workoutPlans",
    "viewProgress",
  ]);

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const openCustomizer = useCallback(() => setCustomizeOpen(true), []);
  const closeCustomizer = useCallback(() => setCustomizeOpen(false), []);

  const idToAction = useCallback(
    (id: string) => allActions.find((a) => a.id === id)!,
    [allActions]
  );

  const currentSlots = quickSlotIds
    .filter(Boolean)
    .map((id) => idToAction(id as string));

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar subtext="Welcome Back" title="Wiiwho" titleTop={false} />

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-6">
        {/* date + quick links */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-pmedium text-lg">
            {formattedDate}
          </Text>

          {/* Right-aligned links row */}
          <View className="flex-row items-center">
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
        </View>

        {/* calendar */}
        <Calender
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          restDays={restDays}
        />

        {/* heading + right-aligned "My Workouts" aligned with Weekly Plan */}
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <Text className="text-white text-xl font-psemibold">{heading}</Text>

          {/* Same structure + no extra right margin so it aligns with Weekly Plan above */}
          <TouchableOpacity onPress={goToWorkoutPlans} className="flex-row items-center">
            <Text style={{ color: primaryColor }} className="mr-2 font-pmedium">
              My Workouts
            </Text>
            <FontAwesome5 name="clipboard-list" size={16} color={primaryColor} />
          </TouchableOpacity>
        </View>

        {/* workout card (no heading inside) */}
        <TodaysWorkout workout={workoutForDate} allowCreate={!isPastEmpty} />

        {/* quick actions */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-psemibold">Quick Actions</Text>
          <TouchableOpacity className="pl-10 pr-5" onPress={openCustomizer}>
            <FontAwesome5 name="ellipsis-v" size={20} color={primaryColor} />
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap mb-8">
          {currentSlots.map((action) => (
            <QuickActions
              key={action.id}
              title={action.title}
              icon={action.icon}
              iconType={action.iconType}
              onPress={action.onPress}
              iconColor={primaryColor}
              backgroundColor={tertiaryColor}
            />
          ))}
        </View>

        <ActivityView />
      </ScrollView>

      <QuickActionsCustomizer
        visible={customizeOpen}
        actions={allActions}
        slotIds={quickSlotIds}
        onChangeSlotIds={setQuickSlotIds}
        onRequestClose={closeCustomizer}
        primaryColor={primaryColor}
        tertiaryColor={tertiaryColor}
      />
    </View>
  );
}
