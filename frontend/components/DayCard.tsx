// Path: /components/DayCard.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";

// Enable layout animations on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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
  // Use our theme context
  const { primaryColor, secondaryColor } = useThemeContext();

  // Configure animation when expanded state changes
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleExpand();
  };

  // Determine if it's a rest day
  const isRestDay = dayData.workout.name === "Rest Day";

  return (
    <View
      className={`bg-black-100 rounded-xl overflow-hidden mb-4 ${
        isToday ? "border-2" : ""
      }`}
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
          <Text className="text-white font-psemibold text-lg">
            {dayData.day}
          </Text>
        </View>

        <View className="flex-row items-center">
          {!isRestDay && (
            <Text
              className="font-pmedium mr-3"
              style={{ color: secondaryColor }}
            >
              {dayData.workout.name}
            </Text>
          )}
          {isRestDay ? (
            <Text className="text-gray-100 font-pmedium mr-2">Rest Day</Text>
          ) : (
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

      {/* Expanded Content */}
      {isExpanded && !isRestDay && (
        <View className="p-4 border-t border-black-200">
          {/* Exercise List */}
          <View className="mb-4">
            {dayData.workout.exercises.map((exercise, index) => (
              <View
                key={index}
                className="flex-row items-center mb-3 last:mb-0"
              >
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

          {/* Action Buttons */}
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
        </View>
      )}
    </View>
  );
};

export default DayCard;