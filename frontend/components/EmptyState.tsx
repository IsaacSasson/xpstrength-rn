import { View, Text, Image } from "react-native";
import React from "react";
import empty from "../assets/images/empty.png";
import CustomButton from "./CustomButton";
import { router } from "expo-router";
const EmptyState = ({title, subtitle}: {title: string, subtitle: string}) => {
  return (
    <View className="justify-center items-center px-4">
      <Image
        source={empty}
        style={{
          height: 215,
          width: 270,
        }}
        resizeMode="contain"
      />
      <Text className="text-2xl font-psemibold text-white">{title}</Text>
      <Text className="font-pmedium text-sm text-gray-100">{subtitle}</Text>
      <CustomButton 
       title="Appraise an item"
       handlePress={() => router.push('/camera')}
       containerStyles="w-full my-5"
      />
    </View>
  );
};

export default EmptyState;
