import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutChangeEvent,
  Image,
} from "react-native";
import UserFriend from "./UserFriend";
import pfptest from "@/assets/images/favicon.png";

/**
 * NativeWind allows you to use Tailwind CSS-like classes via the `className` prop.
 * Ensure you have nativewind configured in your babel.config.js (or similar) and
 * you have tailwind.config.js set up for React Native.
 */

const FriendsBar: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const animatedLeft = useRef(new Animated.Value(0)).current;

  // Measure container width to calculate sweeper width
  const onTabContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Animate the sweeper position
  const onTabPress = (index: number) => {
    setActiveTab(index);
    if (containerWidth > 0) {
      Animated.timing(animatedLeft, {
        toValue: index * (containerWidth / 3),
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false, // We animate layout properties, so must be false
      }).start();
    }
  };

  // Render the tab content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <UserFriend 
          name="Wiiwho"
          level="25"
          pfp={pfptest}
          />
        );
      case 1:
        return <Text className="text-white"></Text>;
      case 2:
        return <Text className="text-white"></Text>;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 items-center justify-center my-3">
      {/* Tabs Container */}
      <View className="w-full relative mb-4 py-4" onLayout={onTabContainerLayout}>
        {/* Animated Sweeper */}
        {containerWidth > 0 && (
          <Animated.View
            style={[
              {
                width: containerWidth / 3,
                transform: [{ translateX: animatedLeft }],
              },
            ]}
            className="absolute top-0 left-0 h-[20px] bg-[rgba(107,33,168,0.5)] rounded-t-lg"
          />
        )}

        {/* Tab Buttons */}
        <View className="flex-row">
          {/* Tab #1 */}
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-1 rounded-l-full bg-[rgba(107,33,168,0.2)] ${
              activeTab === 0 ? "bg-purple-800" : ""
            }`}
            onPress={() => onTabPress(0)}
          >
            <Text
              className={`text-sm ${
                activeTab === 0 ? "text-white font-bold" : "text-purple-300"
              }`}
            >
              Friends
            </Text>
          </TouchableOpacity>

          {/* Tab #2 */}
          <TouchableOpacity
            className={`flex-1 items-center justify-center py-1 bg-[rgba(107,33,168,0.2)] ${
              activeTab === 1 ? "bg-purple-800" : ""
            }`}
            onPress={() => onTabPress(1)}
          >
            <Text
              className={`text-sm ${
                activeTab === 1 ? "text-white font-bold" : "text-purple-300"
              }`}
            >
              Requests
            </Text>
          </TouchableOpacity>

          {/* Tab #3 */}
          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-r-full py-1 bg-[rgba(107,33,168,0.2)] ${
              activeTab === 2 ? "bg-purple-800" : ""
            }`}
            onPress={() => onTabPress(2)}
          >
            <Text
              className={`text-sm ${
                activeTab === 2 ? "text-white font-bold" : "text-purple-300"
              }`}
            >
              Pending
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      <View>{renderContent()}</View>
    </View>
  );
};

export default FriendsBar;
