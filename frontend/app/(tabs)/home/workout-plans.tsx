import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import Header from "@/components/Header";
import { SafeAreaView } from "react-native-safe-area-context";

/* ----------------------------- Types ----------------------------- */
type Exercise = { name: string; sets: number; reps?: string };
type Session = { id: string; title: string; exercises: Exercise[] };

// Single-session "daily" workout plans
export type WorkoutPlan = {
  id: string;
  name: string;           // e.g., "Push Day", "Legs Strength"
  sessions: Session[];    // exactly one session per plan for now
};

/* Helper function to handle new exercise data format */
const processExerciseData = (ex: any, exerciseDatabase: any[]) => {
  // Find exercise name from database safely
  const exerciseDetails = exerciseDatabase.find(
    (e) => e.id === (ex.exercise ? String(ex.exercise) : '')
  );
  const exerciseName = exerciseDetails?.name || `Exercise ${ex.exercise || 'Unknown'}`;

  // Handle new format where sets is an array of {reps, weight} objects
  if (Array.isArray(ex.sets)) {
    const setsCount = ex.sets.length;
    const repsArray = ex.sets.map((set: any) => Number(set.reps) || 0);
    const minReps = Math.min(...repsArray);
    const maxReps = Math.max(...repsArray);
    
    // Create rep range string
    const repsDisplay = minReps === maxReps ? String(minReps) : `${minReps}-${maxReps}`;
    
    return {
      name: exerciseName,
      sets: setsCount,
      reps: repsDisplay,
    };
  } else {
    // Fallback for old format
    return {
      name: exerciseName,
      sets: ex.sets || 0,
      reps: String(ex.reps || 0),
    };
  }
};

/* -------------------------------- Screen -------------------------------- */
const WorkoutPlans = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const {
    customWorkouts,
    exerciseDatabase,
    isLoading,
    error,
    refreshData,   // kept for manual retry on error only
    deleteWorkout,
    clearError,
  } = useWorkouts();

  // Transform API data to UI format (cached; no auto refetch on focus)
  const plans: WorkoutPlan[] = useMemo(() => {
    return customWorkouts.map((workout) => {
      const exercises: Exercise[] = workout.exercises.map((ex: any) => 
        processExerciseData(ex, exerciseDatabase)
      );

      return {
        id: workout.id.toString(),
        name: workout.name,
        sessions: [
          {
            id: "main",
            title: "Main Session",
            exercises,
          },
        ],
      };
    });
  }, [customWorkouts, exerciseDatabase]);

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
    router.push({
      pathname: "/home/edit-workout",
      params: { workoutId: plan.id },
    });
  };

  const createPlan = () => {
    router.push("/home/create-workout");
  };

  const removePlan = async (id: string) => {
    const plan = plans.find((p) => p.id === id);
    const planName = plan?.name || "this workout";

    Alert.alert(
      "Delete workout?",
      `This will remove "${planName}" permanently and from your weekly schedule.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteWorkout(parseInt(id));
              if (result.success) {
                Alert.alert("Success", "Workout deleted successfully");
              } else {
                Alert.alert("Error", result.error || "Failed to delete workout");
              }
            } catch (error) {
              console.error("Error deleting workout:", error);
              Alert.alert("Error", "Failed to delete workout");
            }
          },
        },
      ]
    );
  };

  const handleRetry = () => {
    clearError();
    refreshData(); // manual only
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Header MText="Workouts" SText="Loading your workouts..." />
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

        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={primaryColor} />
          <Text className="text-white font-pmedium mt-4">Loading workouts...</Text>
        </View>
      </View>
    );
  }

  // Error state (no isRefreshing check; no pull-to-refresh)
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Header MText="Workouts" SText="Error loading workouts" />
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

        <View className="flex-1 justify-center items-center px-4">
          <View
            className="rounded-2xl p-6 w-full max-w-sm"
            style={{ backgroundColor: tertiaryColor }}
          >
            <FontAwesome5
              name="exclamation-triangle"
              size={40}
              color="#ff6b6b"
              style={{ alignSelf: "center", marginBottom: 16 }}
            />
            <Text className="text-white font-pmedium text-center text-lg mb-2">
              Something went wrong
            </Text>
            <Text className="text-gray-100 text-center mb-4">{error}</Text>
            <TouchableOpacity
              onPress={handleRetry}
              className="py-3 px-6 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium text-center">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
            <MaterialCommunityIcons name="notebook-outline" size={48} color="#888" />
            <Text className="text-white/80 mt-4 text-lg font-pmedium">No workouts yet</Text>
            <Text className="text-white/60 mt-2 text-center">
              Create your first workout to get started with your fitness journey.
            </Text>
            <TouchableOpacity
              onPress={createPlan}
              className="mt-6 py-3 px-6 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Create First Workout</Text>
            </TouchableOpacity>
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