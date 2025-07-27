// Path: /components/home/TodaysWorkout.tsx
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
  /** Allow "Create Workout" button when no workout exists */
  allowCreate?: boolean;
  /** The selected date for context when creating/editing workouts */
  selectedDate?: Date;
}

/* --------------------------- Component --------------------------------- */
const TodaysWorkout: React.FC<Props> = ({ 
  workout, 
  allowCreate = true, 
  selectedDate 
}) => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  // Get day name for navigation context
  const dayName = selectedDate ? selectedDate.toLocaleDateString("en-US", { weekday: "long" }) : undefined;

  const goToEditWorkout = () => {
    if (dayName) {
      router.push({
        pathname: "/home/edit-workout",
        params: { day: dayName }
      });
    } else {
      router.push("/home/edit-workout");
    }
  };

  const goToCreateWorkout = () => {
    if (dayName) {
      router.push({
        pathname: "/home/create-workout",
        params: { day: dayName }
      });
    } else {
      router.push("/home/create-workout");
    }
  };

  const goToActiveWorkout = () => {
    // For now, just navigate to active workout
    // In the future, we could pass the workout ID
    router.push("/home/active-workout");
  };

  const data: WorkoutType = workout ?? { exists: false };

  return (
    <View
      className="rounded-2xl p-5 mb-6"
      style={{ backgroundColor: tertiaryColor }}
    >
      {data.exists ? (
        /* ---------------------- HAS WORKOUT ------------------------------- */
        <View>
          {/* Header row: Workout name (left) + edit pencil (right) */}
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="font-pbold"
              style={{
                color: primaryColor,
                fontSize: 20, // enlarged
                lineHeight: 26,
              }}
              numberOfLines={1}
            >
              {data.name ?? "Workout"}
            </Text>

            <TouchableOpacity onPress={goToEditWorkout} className="p-2">
              <FontAwesome5 name="pencil-alt" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Exercise list */}
          {data.exercises && data.exercises.length > 0 ? (
            <View className="mb-4">
              {data.exercises.map((ex, idx) => (
                <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={18}
                    color={primaryColor}
                  />
                  <Text className="text-white font-pmedium ml-3 flex-1" numberOfLines={1}>
                    {ex.name}
                  </Text>
                  <Text className="text-gray-100 ml-2">
                    {ex.sets} sets × {ex.reps}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="mb-4 py-2">
              <Text className="text-gray-100 text-center">
                No exercises configured for this workout
              </Text>
            </View>
          )}

          {/* Calories + Start button */}
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center">
              <FontAwesome5 name="fire" size={14} color="#f97316" />
              <Text className="text-orange-500 ml-2">
                ≈ {data.calories ?? 0} kcal
              </Text>
            </View>

            <TouchableOpacity
              onPress={goToActiveWorkout}
              style={{ backgroundColor: primaryColor }}
              className="flex-row items-center px-4 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <FontAwesome5 name="play" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Start Workout</Text>
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
              ? `You don't have a workout planned for ${dayName ? dayName : 'this date'}.`
              : "Past date—workouts can't be added here."}
          </Text>

          {allowCreate && (
            <TouchableOpacity
              onPress={goToCreateWorkout}
              style={{ backgroundColor: primaryColor }}
              className="flex-row items-center px-6 py-3 rounded-lg"
              activeOpacity={0.7}
            >
              <FontAwesome5 name="plus" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Create Workout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default TodaysWorkout;