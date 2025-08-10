// Path: /app/(tabs)/personal-bests.tsx
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
import { useWorkouts } from "@/context/WorkoutContext";
import { router } from "expo-router";
import Header from "@/components/Header";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface BestLift {
  id: string;
  exercise: string;
  weight: number; // 1-rep max in pounds (stored value)
  date: string; // ISO date of record
  category: string; // muscle group
}

/* ------------------------------------------------------------------ */
/*  Dummy Records (extra entries for testing)                          */
/* ------------------------------------------------------------------ */
const dummyBests: BestLift[] = [
  // Chest
  {
    id: "1",
    exercise: "Bench Press",
    weight: 280,
    date: "2025-05-18",
    category: "Chest",
  },
  {
    id: "2",
    exercise: "Incline DB Press",
    weight: 225,
    date: "2025-05-10",
    category: "Chest",
  },
  {
    id: "3",
    exercise: "Chest Dip (weighted)",
    weight: 135,
    date: "2025-04-22",
    category: "Chest",
  },
  // Back
  {
    id: "4",
    exercise: "Deadlift",
    weight: 430,
    date: "2025-05-24",
    category: "Back",
  },
  {
    id: "5",
    exercise: "Barbell Row",
    weight: 245,
    date: "2025-05-12",
    category: "Back",
  },
  {
    id: "6",
    exercise: "Weighted Pull-up",
    weight: 115,
    date: "2025-03-30",
    category: "Back",
  },
  // Legs
  {
    id: "7",
    exercise: "Squat",
    weight: 350,
    date: "2025-04-28",
    category: "Legs",
  },
  {
    id: "8",
    exercise: "Front Squat",
    weight: 275,
    date: "2025-05-03",
    category: "Legs",
  },
  {
    id: "9",
    exercise: "Romanian Deadlift",
    weight: 315,
    date: "2025-02-14",
    category: "Legs",
  },
  // Shoulders
  {
    id: "10",
    exercise: "Overhead Press",
    weight: 175,
    date: "2025-05-05",
    category: "Shoulders",
  },
  {
    id: "11",
    exercise: "Push Press",
    weight: 205,
    date: "2025-04-11",
    category: "Shoulders",
  },
  // Arms
  {
    id: "12",
    exercise: "EZ-Bar Curl",
    weight: 115,
    date: "2025-04-20",
    category: "Arms",
  },
  {
    id: "13",
    exercise: "Close-Grip Bench",
    weight: 245,
    date: "2025-03-02",
    category: "Arms",
  },
];

/* ------------------------------------------------------------------ */
/*  Helper functions                                                  */
/* ------------------------------------------------------------------ */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const groupByCategory = (lifts: BestLift[]) =>
  lifts.reduce<Record<string, BestLift[]>>((acc, lift) => {
    acc[lift.category] = acc[lift.category]
      ? [...acc[lift.category], lift]
      : [lift];
    return acc;
  }, {});

/* ------------------------------------------------------------------ */
/*  Expandable Section component                                      */
/* ------------------------------------------------------------------ */
const ExpandableSection: React.FC<{
  isExpanded: boolean;
  children: React.ReactNode;
}> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const measure = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height && height !== contentHeight) setContentHeight(height);
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, contentHeight]);

  return (
    <View>
      <Animated.View style={{ height: animation, overflow: "hidden" }}>
        {children}
      </Animated.View>
      {/* Hidden copy for measuring height */}
      <View
        style={{ position: "absolute", top: 10000, opacity: 0 }}
        onLayout={measure}
      >
        {children}
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
const PersonalBests = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const { convertWeight, formatWeight, unitSystem } = useWorkouts();

  const [bestLifts, setBestLifts] = useState<BestLift[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /* load dummy data & open all groups on mount */
  useEffect(() => {
    setBestLifts(dummyBests);
    const open: Record<string, boolean> = {};
    Object.keys(groupByCategory(dummyBests)).forEach((cat) => {
      open[cat] = true;
    });
    setExpanded(open);
  }, []);

  /* toggle a single muscle-group section */
  const toggleCategory = (cat: string) =>
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const liftsByCategory = groupByCategory(bestLifts);

  const goBack = () => {
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* ---------- Header ---------- */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <Header MText="Personal Bests" SText="Track your strongest lifts" />
          </View>
        </View>
      </SafeAreaView>

      {/* ---------- Content ---------- */}
      {bestLifts.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={primaryColor}
          />
          <Text className="text-white font-pmedium text-lg mt-4">
            No data yet
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            Complete workouts to set new personal records.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-4 pb-6"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {Object.keys(liftsByCategory)
            .sort()
            .map((category) => {
              const isOpen = !!expanded[category];
              return (
                <View key={category} className="mb-4">
                  {/* --- Category Row --- */}
                  <TouchableOpacity
                    onPress={() => toggleCategory(category)}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-between py-3"
                  >
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons
                        name="folder-star"
                        size={20}
                        color={primaryColor}
                      />
                      <Text className="text-white font-psemibold text-lg ml-2">
                        {category}
                      </Text>
                    </View>
                    <FontAwesome5
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#CDCDE0"
                    />
                  </TouchableOpacity>

                  {/* --- Expandable Section --- */}
                  <ExpandableSection isExpanded={isOpen}>
                    <View className="mb-2">
                      {liftsByCategory[category]
                        .sort((a, b) => b.weight - a.weight) // strongest first
                        .map((lift) => {
                          // Convert weight to user's preferred unit (assuming stored in lbs)
                          const convertedWeight = convertWeight(lift.weight, "imperial", unitSystem);
                          const formattedWeight = formatWeight(convertedWeight);
                          
                          return (
                            <View
                              key={lift.id}
                              className="rounded-xl p-4 mb-3"
                              style={{ backgroundColor: tertiaryColor }}
                            >
                              <View className="flex-row items-center justify-between mb-1">
                                <Text className="text-white font-pmedium text-base">
                                  {lift.exercise}
                                </Text>
                                <Text
                                  className="text-white font-psemibold text-base"
                                  style={{ color: primaryColor }}
                                >
                                  {formattedWeight}
                                </Text>
                              </View>
                              <Text className="text-gray-100 text-right text-xs">
                                {formatDate(lift.date)}
                              </Text>
                            </View>
                          );
                        })}
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

export default PersonalBests;