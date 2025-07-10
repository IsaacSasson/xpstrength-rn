import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { router } from "expo-router";

/* ----------------------------- Types ----------------------------------- */
export interface WorkoutType {
  exists: boolean;
  name?: string;
  calories?: number;
  exercises?: { name: string; sets: number; reps: string }[];
}

interface Props {
  workout: WorkoutType | null;
  /** Allow “Create Workout” button when no workout exists */
  allowCreate?: boolean;
}

/* --------------------------- Component --------------------------------- */
const TodaysWorkout: React.FC<Props> = ({ workout, allowCreate = true }) => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  const goToEditWorkout = () => router.push("/edit-workout");
  const goToCreateWorkout = () => router.push("/create-workout");
  const goToActiveWorkout = () => router.push("/active-workout");

  const data: WorkoutType = workout ?? { exists: false };

  return (
    <View
      className="rounded-2xl p-5 mb-6"
      style={{ backgroundColor: tertiaryColor }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-xl font-psemibold">
          Today's Workout
        </Text>

        {data.exists && (
          <TouchableOpacity onPress={goToEditWorkout} className="p-2">
            <FontAwesome5 name="pencil-alt" size={16} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {data.exists ? (
        /* ---------------------- HAS WORKOUT ------------------------------- */
        <View>
          <Text
            style={{ color: secondaryColor }}
            className="text-lg font-pmedium mb-4"
          >
            {data.name}
          </Text>

          <View className="mb-4">
            {data.exercises?.map((ex, idx) => (
              <View
                key={idx}
                className="flex-row items-center mb-3 last:mb-0"
              >
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={18}
                  color={primaryColor}
                />
                <Text className="text-white font-pmedium ml-3">
                  {ex.name}
                </Text>
                <Text className="text-gray-100 ml-auto">
                  {ex.sets} sets × {ex.reps}
                </Text>
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center">
              <FontAwesome5 name="fire" size={14} color="#f97316" />
              <Text className="text-orange-500 ml-2">
                ≈ {data.calories} kcal
              </Text>
            </View>

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
        /* ----------------------- NO WORKOUT ------------------------------ */
        <View className="items-center py-8">
          <FontAwesome5 name="calendar-times" size={50} color={primaryColor} />
          <Text className="text-white font-pmedium text-center mt-4 text-lg">
            No Workout Scheduled
          </Text>
          <Text className="text-gray-100 text-center mt-2 mb-4">
            {allowCreate
              ? "You don't have a workout planned for this date."
              : "Past date—workouts can’t be added here."}
          </Text>

          {allowCreate && (
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
          )}
        </View>
      )}
    </View>
  );
};

export default TodaysWorkout;
