// Path: /components/home/ActiveWorkout/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface Props {
  title: string;
  elapsedSeconds: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  onCancel: () => void;
  onPause: () => void; // Add pause handler
  onFinish: () => void;
}

const ActiveWorkoutHeader: React.FC<Props> = ({
  title,
  elapsedSeconds,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  onCancel,
  onPause,
  onFinish,
}) => {
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ backgroundColor: tertiaryColor }}
    >
      <View
        className="px-4 py-3"
        style={{ backgroundColor: tertiaryColor }}
      >
        <View className="flex-row items-center justify-between">
          {/* Left: Cancel button */}
          <TouchableOpacity
            onPress={onCancel}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <Text className="text-white font-pmedium">Cancel</Text>
          </TouchableOpacity>

          {/* Center: Title and Timer with Pause */}
          <View className="flex-1 items-center">
            <Text
              className="text-lg font-psemibold"
              style={{ color: secondaryColor }}
            >
              {title}
            </Text>
            <View className="flex-row items-center mt-1">
              {/* Pause button as icon */}
              <TouchableOpacity 
                onPress={onPause}
                className="mr-2 p-1"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="pause-circle-outline"
                  size={20}
                  color={primaryColor}
                />
              </TouchableOpacity>
              
              {/* Timer */}
              <Text
                className="text-lg font-pmedium"
                style={{ color: primaryColor }}
              >
                {fmt(elapsedSeconds)}
              </Text>
            </View>
          </View>

          {/* Right: Finish button */}
          <TouchableOpacity
            onPress={onFinish}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-pmedium">Finish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ActiveWorkoutHeader;