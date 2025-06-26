import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { goBack } from "expo-router/build/global-state/routing";

interface HeaderProps {
  MText: string;
  SText: string;
}

export default function Header({ MText, SText }: HeaderProps): JSX.Element {
  return (
    <View className="flex-1 flex-row items-center">
      <TouchableOpacity onPress={goBack} className="mr-3">
        <FontAwesome5 name="arrow-left" size={20} color="white" />
      </TouchableOpacity>
      <View>
        <Text className="text-white font-psemibold text-2xl">{MText}</Text>
        <Text className="text-gray-100 font-pmedium text-sm">{SText}</Text>
      </View>
    </View>
  );
}
