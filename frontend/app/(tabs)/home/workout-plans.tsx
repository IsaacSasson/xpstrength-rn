// Path: /app/(tabs)/home/workout-plans.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import Header from "@/components/Header";
import { SafeAreaView } from "react-native-safe-area-context";

/* ----------------------------- Types & Mock ----------------------------- */
type Exercise = { name: string; sets: number; reps?: string };
type Session = { id: string; title: string; exercises: Exercise[] };

// Single-session “daily” workout plans
export type WorkoutPlan = {
  id: string;
  name: string;           // e.g., "Push Day", "Legs Strength"
  sessions: Session[];    // exactly one session per plan for now
};

const MOCK_PLANS: WorkoutPlan[] = [
  {
    id: "p_push",
    name: "Push Day",
    sessions: [
      {
        id: "s_main",
        title: "Main Session",
        exercises: [
          { name: "Barbell Bench Press", sets: 5, reps: "5" },
          { name: "Incline DB Press", sets: 4, reps: "8–10" },
          { name: "Overhead Press", sets: 3, reps: "8–10" },
          { name: "Cable Fly", sets: 3, reps: "12–15" },
          { name: "Triceps Pushdown", sets: 3, reps: "12–15" },
        ],
      },
    ],
  },
  {
    id: "p_pull",
    name: "Pull Day",
    sessions: [
      {
        id: "s_main",
        title: "Main Session",
        exercises: [
          { name: "Conventional Deadlift", sets: 3, reps: "3–5" },
          { name: "Barbell Row", sets: 4, reps: "6–8" },
          { name: "Lat Pulldown", sets: 3, reps: "10–12" },
          { name: "Face Pull", sets: 3, reps: "12–15" },
          { name: "DB Curl", sets: 3, reps: "10–12" },
        ],
      },
    ],
  },
  {
    id: "p_legs",
    name: "Legs Day",
    sessions: [
      {
        id: "s_main",
        title: "Main Session",
        exercises: [
          { name: "Back Squat", sets: 5, reps: "5" },
          { name: "Romanian Deadlift", sets: 3, reps: "6–8" },
          { name: "Leg Press", sets: 4, reps: "10–12" },
          { name: "Hamstring Curl", sets: 3, reps: "12–15" },
          { name: "Calf Raise", sets: 3, reps: "12–15" },
        ],
      },
    ],
  },
];

/* -------------------------------- Screen -------------------------------- */
const WorkoutPlans = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [plans, setPlans] = useState<WorkoutPlan[]>(MOCK_PLANS);

  // Totals per plan (single-session)
  const totals = useMemo(
    () =>
      Object.fromEntries(
        plans.map((p) => {
          const session = p.sessions[0];
          const exercises = session?.exercises ?? [];
          const sets = exercises.reduce((sum, e) => sum + (e.sets || 0), 0);
          const estMinutes = Math.max(15, Math.round(sets * 2)); // ~2 min per set, min 15
          return [p.id, { exercises: exercises.length, sets, estMinutes }];
        })
      ),
    [plans]
  );

  const openPlan = (plan: WorkoutPlan) => {
    // detail page suggestion
    router.push({ pathname: "/home/active-workout", params: { id: plan.id } });
  };

  const createPlan = () => {
    router.push("/home/create-workout");
  };

  const removePlan = (id: string) => {
    Alert.alert("Delete workout?", "This will remove the workout permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setPlans((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header with Create button on the right */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Header MText="Workouts" SText="Single-session routines" />
            <TouchableOpacity
              onPress={createPlan}
              activeOpacity={0.85}
              style={{
                backgroundColor: primaryColor,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <FontAwesome5 name="plus" size={14} color="#FFF" />
              <Text className="text-white font-psemibold ml-2">Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
        {plans.length === 0 ? (
          <View className="mt-10 items-center">
            <MaterialCommunityIcons name="notebook-outline" size={36} color="#888" />
            <Text className="text-white/80 mt-3">No workouts yet.</Text>
            <Text className="text-white/60 mt-1">Tap “Create” to get started.</Text>
          </View>
        ) : (
          plans.map((plan) => {
            const t = totals[plan.id];
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => openPlan(plan)}
                activeOpacity={0.9}
                style={{
                  // Glassmorphism card (mirrors ActiveWorkout styling language)
                  backgroundColor: tertiaryColor,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 20, 
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  shadowColor: primaryColor,
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <FontAwesome5 name="clipboard-list" size={18} color={primaryColor} />
                    <Text className="text-white ml-3 text-lg font-psemibold">
                      {plan.name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => removePlan(plan.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#aaa" />
                  </TouchableOpacity>
                </View>

                {/* Compact pills row */}
                <View className="flex-row mt-4">
                  <InfoPill
                    icon="dumbbell"
                    iconType="material"
                    label={`${t.exercises} Exercises`}
                    color={primaryColor}
                    bg="rgba(255,255,255,0.06)"
                  />
                  <InfoPill
                    icon="list-ol"
                    iconType="fontawesome"
                    label={`${t.sets} Sets`}
                    color={primaryColor}
                    bg="rgba(255,255,255,0.06)"
                  />
                  <InfoPill
                    icon="timer-outline"
                    iconType="material"
                    label={`${t.estMinutes} min`}
                    color={primaryColor}
                    bg="rgba(255,255,255,0.06)"
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* spacer */}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
};

/* ----------------------------- Small Components ----------------------------- */
const InfoPill = ({
  icon,
  iconType = "fontawesome",
  label,
  color,
  bg,
}: {
  icon: string;
  iconType?: "material" | "fontawesome";
  label: string;
  color: string;
  bg: string;
}) => {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 8,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {iconType === "material" ? (
        <MaterialCommunityIcons name={icon as any} size={16} color={color} />
      ) : (
        <FontAwesome5 name={icon as any} size={14} color={color} />
      )}
      <Text className="text-white ml-2">{label}</Text>
    </View>
  );
};

export default WorkoutPlans;
