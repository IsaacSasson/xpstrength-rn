// Path: /components/home/ActiveWorkout/AddExerciseCard.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";

interface Props {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  CARD_HEIGHT: number;
}

const ActiveWorkoutAddCard: React.FC<Props> = ({
  primaryColor,
  secondaryColor,
  tertiaryColor,
  CARD_HEIGHT,
}) => {
  return (
    <View
      className="rounded-2xl p-4 mt-10 items-center justify-between"
      style={{
        backgroundColor: tertiaryColor,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        shadowColor: primaryColor,
        shadowOpacity: 0.2,
        shadowRadius: 13,
        shadowOffset: { width: 0, height: 4 },
        height: CARD_HEIGHT,
      }}
    >
      {/* Header */}
      <Text
        className="text-2xl font-pbold text-center"
        style={{ color: secondaryColor, marginTop: 8 }}
      >
        Add Exercise
      </Text>

      {/* Big round add button */}
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/home/exercise-list",
            params: { action: "add", returnTo: "active-workout" },
          })
        }
        className="items-center justify-center"
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: primaryColor,
        }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="plus" size={38} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </View>
  );
};

export default ActiveWorkoutAddCard;