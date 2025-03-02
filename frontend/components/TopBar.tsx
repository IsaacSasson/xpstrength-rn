import React from "react";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TopBarProps = {
  subtext: string;
  title: string;
  titleTop: boolean;
};

const TopBar: React.FC<TopBarProps> = ({ subtext, title, titleTop }) => {
  return (
    <View className="justify-between items-start flex-row mb-6">
      <View>
        {titleTop ? (
          <>
            <Text className="text-2xl font-psemibold text-white">{title}</Text>
            <Text className="font-psemibold text-sm text-gray-100">{subtext}</Text>
          </>
        ) : (
          <>
            <Text className="font-pmedium text-sm text-gray-100">{subtext}</Text>
            <Text className="text-2xl font-psemibold text-white">{title}</Text>
          </>
        )}
      </View>
      <View>
        <Image
          source={require("../assets/images/logo.png")}
          style={{
            height: 57,
            width: 100,
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default TopBar;