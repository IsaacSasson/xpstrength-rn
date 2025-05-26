// Path: /app/(tabs)/history.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";

// ------------------------------------------------------------------
// reusable ExpandableSection (copied from DayCard logic)
// ------------------------------------------------------------------
interface ExpandableSectionProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) setContentHeight(height);
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, contentHeight]);

  return (
    <View>
      <Animated.View style={{ height: animation, overflow: "hidden" }}>{children}</Animated.View>
      {/* hidden measure */}
      <View style={{ position: "absolute", top: 10000, left: 0, right: 0, opacity: 0 }} onLayout={onMeasure}>
        {children}
      </View>
    </View>
  );
};

// ------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------
interface ExerciseSummary {
  name: string;
  sets: number;
  reps: string;
}

interface PastWorkout {
  id: string;
  date: string; // ISO
  name: string;
  duration: string;
  exercises: ExerciseSummary[];
}

// ------------------------------------------------------------------
// Sample Data (replace later)
// ------------------------------------------------------------------
const sampleHistory: PastWorkout[] = [
  {
    id: "w_20250524_001",
    date: "2025-05-24",
    name: "Pull Day",
    duration: "55m",
    exercises: [
      { name: "Deadlifts", sets: 4, reps: "5" },
      { name: "Pull‑ups", sets: 3, reps: "8" },
      { name: "Barbell Rows", sets: 3, reps: "10" },
      { name: "Bicep Curls", sets: 3, reps: "12" },
    ],
  },
  {
    id: "w_20250523_001",
    date: "2025-05-23",
    name: "Push Day",
    duration: "1h 10m",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8" },
      { name: "Incline DB Press", sets: 3, reps: "10" },
      { name: "Tricep Extensions", sets: 3, reps: "12" },
      { name: "Shoulder Press", sets: 3, reps: "10" },
    ],
  },
];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
const WorkoutHistory = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const [history, setHistory] = useState<PastWorkout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setHistory(sampleHistory); // TODO replace with real fetch
  }, []);

  const toggleExpand = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  const goBack = () => {
    // If using expo-router uncomment below:
    // import { router } from "expo-router"; router.back();
    // fallback:
    // @ts-ignore
    if (global.history?.back) global.history.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={goBack} className="mr-4">
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-psemibold text-white">History</Text>
              <Text className="font-pmedium text-sm text-gray-100">Your past workouts</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Body */}
      {history.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <MaterialCommunityIcons name="history" size={64} color={primaryColor} />
          <Text className="text-white font-pmedium text-lg mt-4">No workout history yet</Text>
          <Text className="text-gray-100 text-center mt-2">Complete a workout and it will appear here.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-6" contentContainerStyle={{ paddingBottom: 20 }}>
          {history.map(workout => {
            const isExpanded = expandedId === workout.id;
            return (
              <View key={workout.id} className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: tertiaryColor }}>
                {/* Header Row (tap to expand) */}
                <TouchableOpacity className="p-4 flex-row items-center justify-between" onPress={() => toggleExpand(workout.id)} activeOpacity={0.8}>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="dumbbell" size={22} color={primaryColor} />
                    <View className="ml-3">
                      <Text className="text-white font-psemibold text-lg">{workout.name}</Text>
                      <Text className="font-pmedium text-gray-100" style={{ color: secondaryColor }}>{formatDate(workout.date)}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <View className="px-3 py-1 rounded-lg mr-3" style={{ backgroundColor: primaryColor }}>
                      <Text className="text-white font-pmedium text-xs">{workout.duration}</Text>
                    </View>
                    <FontAwesome5 name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#CDCDE0" />
                  </View>
                </TouchableOpacity>

                {/* Expandable content (exercise list) */}
                <ExpandableSection isExpanded={isExpanded}>
                  <View className="p-4 border-t border-black-200">
                    {workout.exercises.map((ex, idx) => (
                      <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                        <FontAwesome5 name="angle-right" size={14} color={primaryColor} />
                        <Text className="text-white font-pmedium ml-3">{ex.name}</Text>
                        <Text className="text-gray-100 ml-auto">{ex.sets} × {ex.reps}</Text>
                      </View>
                    ))}
                  </View>
                </ExpandableSection>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default WorkoutHistory;
