// Path: /components/DayCard.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";

// Define the ExpandableSection component for animated expansion
interface ExpandableSectionProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 300,
      useNativeDriver: false, // height animation requires useNativeDriver: false
    }).start();
  }, [isExpanded, contentHeight]);

  return (
    <View>
      <Animated.View style={{ height: animation, overflow: "hidden" }}>
        {children}
      </Animated.View>
      {/* Hidden container to measure content height */}
      <View
        style={{
          position: "absolute",
          top: 10000,
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

// Types for our data structure
interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface Workout {
  name: string;
  exercises: Exercise[];
  time: string;
}

interface DayProps {
  dayData: {
    day: string;
    workout: Workout;
  };
  isToday: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onStart: () => void;
}

const DayCard: React.FC<DayProps> = ({
  dayData,
  isToday,
  isExpanded,
  onToggleExpand,
  onEdit,
  onStart,
}) => {
  // Use our theme context for colors
  const { primaryColor, secondaryColor } = useThemeContext();

  // Toggle the expanded state (no LayoutAnimation now)
  const toggleExpand = () => {
    onToggleExpand();
  };

  // Determine if it's a rest day
  const isRestDay = dayData.workout.name === "Rest Day";

  return (
    <View
      className={`bg-black-100 rounded-xl overflow-hidden mb-4 ${isToday ? "border-2" : ""}`}
      style={isToday ? { borderColor: primaryColor } : {}}
    >
      {/* Card Header - Always visible */}
      <TouchableOpacity
        className="flex-row items-center justify-between p-4"
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          {isToday && (
            <View
              className="h-2 w-2 rounded-full mr-2"
              style={{ backgroundColor: primaryColor }}
            />
          )}
          <Text className="text-white font-psemibold text-lg">{dayData.day}</Text>
        </View>

        <View className="flex-row items-center">
          {!isRestDay ? (
            <Text className="font-pmedium mr-3" style={{ color: secondaryColor }}>
              {dayData.workout.name}
            </Text>
          ) : (
            <Text className="text-gray-100 font-pmedium mr-2">Rest Day</Text>
          )}
          {!isRestDay && (
            <View className="flex-row items-center mr-2">
              <FontAwesome5 name="clock" size={12} color="#CDCDE0" />
              <Text className="text-gray-100 ml-1">{dayData.workout.time}</Text>
            </View>
          )}
          <FontAwesome5
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color="#CDCDE0"
          />
        </View>
      </TouchableOpacity>

      {/* Animated Expanded Content */}
      <ExpandableSection isExpanded={isExpanded}>
        <View className="p-4 border-t border-black-200">
          {isRestDay ? (
            <View className="items-center py-4">
              <MaterialCommunityIcons name="sleep" size={40} color={primaryColor} />
              <Text className="text-white font-pmedium text-center mt-3">
                Rest and recovery day. No workout scheduled.
              </Text>
            </View>
          ) : (
            <>
              <View className="mb-4">
                {dayData.workout.exercises.map((exercise, index) => (
                  <View key={index} className="flex-row items-center mb-3 last:mb-0">
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={18}
                      color={primaryColor}
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

              <View className="flex-row justify-end">
                <TouchableOpacity
                  onPress={onEdit}
                  className="flex-row items-center mr-3 px-3 py-2 rounded-lg bg-black-200"
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="edit" size={14} color={primaryColor} />
                  <Text className="text-white font-pmedium ml-2">Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onStart}
                  style={{ backgroundColor: primaryColor }}
                  className="flex-row items-center px-3 py-2 rounded-lg"
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="play" size={14} color="#FFF" />
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
