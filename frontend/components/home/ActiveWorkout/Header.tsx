// Path: /components/ActiveWorkoutHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  title: string;
  elapsedSeconds: number;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  onCancel: () => void;
  onFinish: () => void;
}

const ActiveWorkoutHeader: React.FC<Props> = ({
  title,
  elapsedSeconds,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  onCancel,
  onFinish,
}) => {
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  return (
    <SafeAreaView edges={["top"]}>
      <View className="px-4 pt-4 flex-row items-center justify-between">
        <View>
          <Text
            className="text-lg font-psemibold"
            style={{ color: secondaryColor }}
          >
            {title}
          </Text>
          <Text
            className="font-psemibold mt-1"
            style={{ color: secondaryColor }}
          >
            {fmt(elapsedSeconds)}
          </Text>
        </View>

        <View className="flex-row">
          <TouchableOpacity
            onPress={onCancel}
            className="px-3 py-2 rounded-lg mr-2"
            style={{ backgroundColor: tertiaryColor }}
          >
            <Text className="text-white font-pmedium">Cancel</Text>
          </TouchableOpacity>
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
