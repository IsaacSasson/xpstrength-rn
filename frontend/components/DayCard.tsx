// DayCard.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface DayData {
  day: string;
  workout: {
    name: string;
    exercises: Exercise[];
    time: string;
  };
}

interface DayCardProps {
  dayData: DayData;
  isToday: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onStart: () => void;
}

/**
 * Inline ExpandableSection replicates your original code's
 * expand/collapse functionality and uses the same approach
 * to measure children height off-screen.
 */
const ExpandableSection: React.FC<{
  isExpanded: boolean;
  children: React.ReactNode;
}> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 300,
      useNativeDriver: false, // Must be false for height animation
    }).start();
  }, [isExpanded, contentHeight]);

  return (
    <View>
      {/* Animated container that shows/hides the content */}
      <Animated.View style={{ height: animation, overflow: "hidden" }}>
        {children}
      </Animated.View>

      {/* Hidden container to measure the children height */}
      <View
        style={{
          position: "absolute",
          top: 10000, // push it off-screen
          left: 0,
          right: 0,
          opacity: 0,
        }}
        onLayout={onMeasure}
      >
        {children}
      </View>
    </View>
  );
};

/**
 * DayCard uses the exact Tailwind classes from your original code
 * so that it matches the colors and style from your tailwind.config.js.
 */
const DayCard: React.FC<DayCardProps> = ({
  dayData,
  isToday,
  isExpanded,
  onToggleExpand,
  onEdit,
  onStart,
}) => {
  const isRestDay = dayData.workout.name === "Rest Day";

  return (
    <View
      // Matches "bg-black-100 rounded-xl mb-4 overflow-hidden"
      // plus border-secondary if isToday
      className={`bg-black-100 rounded-xl mb-4 overflow-hidden ${
        isToday ? "border border-secondary" : ""
      }`}
    >
      {/* Day Header */}
      <Pressable
        onPress={onToggleExpand}
        android_ripple={{ color: "#232533" }}
        // Matches "p-4 flex-row justify-between items-center"
        className="p-4 flex-row justify-between items-center"
      >
        <View className="flex-row items-center">
          <View
            // Matches "h-10 w-10 rounded-full items-center justify-center mr-3"
            // plus "bg-secondary" if isToday, otherwise "bg-black-200"
            className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${
              isToday ? "bg-secondary" : "bg-black-200"
            }`}
          >
            <Text className="text-white font-pbold">
              {dayData.day.substring(0, 2)}
            </Text>
          </View>
          <View>
            <View className="flex-row items-center">
              <Text className="text-white font-psemibold text-lg">
                {dayData.day}
              </Text>
              {isToday && (
                <View className="bg-secondary rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-white text-xs font-pbold">TODAY</Text>
                </View>
              )}
            </View>
            <Text
              // Matches "font-pmedium" plus "text-gray-100" if rest day
              // or "text-secondary-100" otherwise
              className={`font-pmedium ${
                isRestDay ? "text-gray-100" : "text-secondary-100"
              }`}
            >
              {dayData.workout.name}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          {!isRestDay && (
            <View className="flex-row items-center mr-3">
              <FontAwesome5 name="clock" size={14} color="#CDCDE0" />
              <Text className="text-gray-100 ml-1">
                {dayData.workout.time}
              </Text>
            </View>
          )}
          <FontAwesome5
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#CDCDE0"
          />
        </View>
      </Pressable>

      {/* Expanded Content */}
      <ExpandableSection isExpanded={isExpanded}>
        {/* Matches "border-t border-black-200 p-4" */}
        <View className="border-t border-black-200 p-4">
          {isRestDay ? (
            <View className="items-center py-4">
              <MaterialCommunityIcons name="sleep" size={40} color="#A742FF" />
              <Text className="text-white font-pmedium text-center mt-3">
                Rest and recovery day. No workout scheduled.
              </Text>
            </View>
          ) : (
            <>
              <View className="mb-4">
                {dayData.workout.exercises.map((exercise, idx) => (
                  <View
                    key={idx}
                    // Matches "flex-row items-center mb-3 last:mb-0"
                    className="flex-row items-center mb-3 last:mb-0"
                  >
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={18}
                      color="#A742FF"
                    />
                    <Text className="text-white font-pmedium ml-3">
                      {exercise.name}
                    </Text>
                    <Text className="text-gray-100 ml-auto">
                      {exercise.sets} sets × {exercise.reps}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-end mt-2">
                <TouchableOpacity
                  onPress={onEdit}
                  className="bg-secondary flex-row items-center px-4 py-2 rounded-lg mr-3"
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="edit" size={14} color="#FFF" />
                  <Text className="text-white font-pmedium ml-2">Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onStart}
                  className="bg-black-200 flex-row items-center px-4 py-2 rounded-lg"
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="play" size={14} color="#A742FF" />
                  <Text className="text-white font-pmedium ml-2">Start</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ExpandableSection>
    </View>
  );
};

export default DayCard;
