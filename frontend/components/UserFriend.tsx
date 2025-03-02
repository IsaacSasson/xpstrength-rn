import { View, Text, Image, ImageSourcePropType } from "react-native";
import React from "react";

interface UserFriendProps {
  pfp: ImageSourcePropType;
  level: string;
  name: string;
}

const UserFriend: React.FC<UserFriendProps> = ({ pfp, level, name }) => {
  return (
    <View className="flex-row items-center right-[100%] pt-2">
      <Image
        source={pfp}
        style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "#fff",
        }}
      />

      {/* Text container: Username above Level (Edit spacing or colors as desired) */}
      <View className="flex-col ml-2">
        <Text className="text-white font-semibold">{name}</Text>
        <Text className="text-purple-400 font-normal -mt-1">
          Level: {level}
        </Text>
      </View>

      {/* Spacer for future additional content (edit or remove if not needed) */}
      <View className="flex-1" />
    </View>
  );
};

export default UserFriend;
