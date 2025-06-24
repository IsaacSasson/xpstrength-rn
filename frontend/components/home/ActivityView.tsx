import { View, Text } from "react-native";
import React from "react";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";
export default function ActivityView() {
  const { primaryColor, tertiaryColor } = useThemeContext();

  return (
    <View>
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
          <Text className="text-white font-pmedium">New Personal Best!</Text>
          <Text className="text-gray-100">Bench Press: 225 lbs × 8 reps</Text>
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
          <Text className="text-gray-100">You and Alex are now friends</Text>
          <Text className="text-gray-100 text-xs mt-1">
            3 days ago at 11:32 AM
          </Text>
        </View>
      </View>
    </View>
    </View>
  );
}
