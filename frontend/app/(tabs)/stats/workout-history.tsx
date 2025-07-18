// Path: /app/(tabs)/history.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { router } from "expo-router";
import Header from "@/components/Header";
import Tabs from "@/components/TabList";

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */
interface ExerciseSummary {
  name: string;
  sets: number;
  reps: string;
}

export interface PastWorkout {
  id: string;
  date: string; // ISO YYYY-MM-DD
  name: string;
  duration: string;
  exercises: ExerciseSummary[];
}

type HistoryRange = "Week" | "Month" | "All Time";

/* ------------------------------------------------------------------
 * ExpandableSection (collapsible content container)
 * ------------------------------------------------------------------ */
interface ExpandableSectionProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  isExpanded,
  children,
}) => {
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
      <Animated.View style={{ height: animation, overflow: "hidden" }}>
        {children}
      </Animated.View>

      {/* hidden measure node */}
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

/* ------------------------------------------------------------------
 * Utils
 * ------------------------------------------------------------------ */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/** Returns today at midnight local (no time) */
const todayDateOnly = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const diffInDaysFromToday = (iso: string) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const t = todayDateOnly().getTime();
  const diffMs = t - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/* ------------------------------------------------------------------
 * Dummy History Data Generator
 * ------------------------------------------------------------------
 * Generates a bunch of plausible workouts over the past ~120 days.
 */
const EXERCISE_LIBRARY: ExerciseSummary[] = [
  { name: "Bench Press", sets: 4, reps: "8" },
  { name: "Incline DB Press", sets: 3, reps: "10" },
  { name: "Shoulder Press", sets: 3, reps: "10" },
  { name: "Tricep Extensions", sets: 3, reps: "12" },
  { name: "Push‑ups", sets: 3, reps: "AMRAP" },
  { name: "Deadlifts", sets: 4, reps: "5" },
  { name: "Pull‑ups", sets: 3, reps: "8" },
  { name: "Barbell Rows", sets: 3, reps: "10" },
  { name: "Lat Pulldown", sets: 3, reps: "12" },
  { name: "Bicep Curls", sets: 3, reps: "12" },
  { name: "Squats", sets: 4, reps: "6" },
  { name: "Leg Press", sets: 3, reps: "12" },
  { name: "Lunges", sets: 3, reps: "10/leg" },
  { name: "Leg Curls", sets: 3, reps: "12" },
  { name: "Planks", sets: 3, reps: "60s" },
  { name: "Crunches", sets: 3, reps: "20" },
  { name: "Burpees", sets: 3, reps: "15" },
];

const WORKOUT_TEMPLATES = [
  {
    name: "Push Day",
    picks: ["Bench Press", "Incline DB Press", "Shoulder Press", "Tricep Extensions"],
  },
  {
    name: "Pull Day",
    picks: ["Deadlifts", "Pull‑ups", "Barbell Rows", "Bicep Curls"],
  },
  {
    name: "Leg Day",
    picks: ["Squats", "Leg Press", "Lunges", "Leg Curls"],
  },
  {
    name: "Full Body",
    picks: ["Bench Press", "Deadlifts", "Squats", "Planks"],
  },
  {
    name: "Upper Body Blast",
    picks: ["Bench Press", "Pull‑ups", "Shoulder Press", "Bicep Curls"],
  },
  {
    name: "HIIT Circuit",
    picks: ["Burpees", "Push‑ups", "Crunches", "Planks"],
  },
];

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickExercises = (names: string[]): ExerciseSummary[] => {
  const items: ExerciseSummary[] = [];
  names.forEach((n) => {
    const ex = EXERCISE_LIBRARY.find((e) => e.name === n);
    if (ex) items.push(ex);
  });
  return items;
};

const genDuration = () => {
  const mins = rand(35, 90);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * Generate dummy PastWorkout array covering ~120 days back,
 * ~4 workouts/week on random days.
 */
const generateDummyHistory = (): PastWorkout[] => {
  const out: PastWorkout[] = [];
  const today = todayDateOnly();
  const daysBack = 120;

  let idCounter = 1;

  for (let i = 0; i <= daysBack; i++) {
    // ~4 workouts per 7 days -> roughly 57% chance of a workout
    const hasWorkout = Math.random() < 0.57;
    if (!hasWorkout) continue;

    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD

    const tmpl = WORKOUT_TEMPLATES[rand(0, WORKOUT_TEMPLATES.length - 1)];
    out.push({
      id: `w_${iso}_${idCounter.toString().padStart(3, "0")}`,
      date: iso,
      name: tmpl.name,
      duration: genDuration(),
      exercises: pickExercises(tmpl.picks),
    });
    idCounter++;
  }

  // Ensure at least *some* workouts exist in the very recent ranges for testing:
  if (!out.some((w) => diffInDaysFromToday(w.date) <= 6)) {
    // Inject a very recent workout (today)
    const tmpl = WORKOUT_TEMPLATES[0];
    const iso = today.toISOString().slice(0, 10);
    out.push({
      id: `w_${iso}_${idCounter.toString().padStart(3, "0")}`,
      date: iso,
      name: tmpl.name,
      duration: genDuration(),
      exercises: pickExercises(tmpl.picks),
    });
    idCounter++;
  }

  if (!out.some((w) => diffInDaysFromToday(w.date) <= 29)) {
    // Inject one within 30 days
    const d = new Date(today);
    d.setDate(today.getDate() - 10);
    const iso = d.toISOString().slice(0, 10);
    const tmpl = WORKOUT_TEMPLATES[1];
    out.push({
      id: `w_${iso}_${idCounter.toString().padStart(3, "0")}`,
      date: iso,
      name: tmpl.name,
      duration: genDuration(),
      exercises: pickExercises(tmpl.picks),
    });
    idCounter++;
  }

  // Sort newest first
  out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return out;
};

/* ------------------------------------------------------------------
 * Main Component
 * ------------------------------------------------------------------ */
const WorkoutHistory: React.FC = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  /* ------------------ State ------------------ */
  const [history, setHistory] = useState<PastWorkout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState<HistoryRange>("Week");
  const [isAnimating, setIsAnimating] = useState(false); // parity w/ Stats usage

  /* ------------------ Init Dummy Data ------------------ */
  useEffect(() => {
    // Replace this with real fetch later (from storage / backend / context)
    const data = generateDummyHistory();
    setHistory(data);
  }, []);

  /* ------------------ Filters ------------------ */
  const filteredHistory = useMemo(() => {
    if (activeRange === "All Time") return history;

    const daysLimit = activeRange === "Week" ? 7 : 30; // Month = 30-day rolling
    return history.filter((w) => diffInDaysFromToday(w.date) <= daysLimit - 1);
  }, [history, activeRange]);

  /* ------------------ Tab Change Handler ------------------ */
  const handleRangeChange = (newRange: HistoryRange) => {
    if (newRange === activeRange || isAnimating) return;
    setIsAnimating(true);
    // Light delay to show tab press feedback (mirrors Stats pattern)
    setTimeout(() => {
      setActiveRange(newRange);
      setExpandedId(null); // collapse when switching ranges
      setIsAnimating(false);
    }, 150);
  };

  /* ------------------ Expand toggle ------------------ */
  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  /* ------------------ Navigation ------------------ */
  const goToDetails = (workout: PastWorkout) => {
    // Serialize workout (string -> param)
    const payload = encodeURIComponent(JSON.stringify(workout));
    router.push({
      pathname: "/stats/workout-details",
      params: { workout: payload },
    });
  };

  /* ------------------ Derived empty states ------------------ */
  const hasAnyHistory = history.length > 0;
  const hasFilteredHistory = filteredHistory.length > 0;

  /* ------------------ Render ------------------ */
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <Header MText="Workout History" SText="Review your past workouts" />
          </View>
        </View>
      </SafeAreaView>

      {/* Tabs */}
      <View className="px-4 mt-2 mb-4">
        <Tabs<HistoryRange>
          tabs={["Week", "Month", "All Time"]}
          activeTab={activeRange}
          onTabChange={handleRangeChange}
          isAnimating={isAnimating}
          backgroundColor={primaryColor}
        />
      </View>

      {/* Body */}
      {!hasAnyHistory ? (
        <View className="flex-1 justify-center items-center px-4">
          <MaterialCommunityIcons name="history" size={64} color={primaryColor} />
          <Text className="text-white font-pmedium text-lg mt-4">
            No workout history yet
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            Complete a workout and it will appear here.
          </Text>
        </View>
      ) : !hasFilteredHistory ? (
        <View className="flex-1 justify-center items-center px-4">
          <MaterialCommunityIcons
            name="calendar-remove"
            size={64}
            color={primaryColor}
          />
          <Text className="text-white font-pmedium text-lg mt-4">
            No workouts in this range
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            Try switching tabs to see more dates.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-4 pb-6"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {filteredHistory.map((workout) => {
            const isExpanded = expandedId === workout.id;
            return (
              <View
                key={workout.id}
                className="rounded-xl overflow-hidden mb-4"
                style={{ backgroundColor: tertiaryColor }}
              >
                {/* Header Row (tap to expand) */}
                <TouchableOpacity
                  className="p-4 flex-row items-center justify-between"
                  onPress={() => toggleExpand(workout.id)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={22}
                      color={primaryColor}
                    />
                    <View className="ml-3">
                      <Text className="text-white font-psemibold text-lg">
                        {workout.name}
                      </Text>
                      <Text
                        className="font-pmedium text-gray-100"
                        style={{ color: secondaryColor }}
                      >
                        {formatDate(workout.date)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <View
                      className="px-3 py-1 rounded-lg mr-3"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Text className="text-white font-pmedium text-xs">
                        {workout.duration}
                      </Text>
                    </View>
                    <FontAwesome5
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#CDCDE0"
                    />
                  </View>
                </TouchableOpacity>

                {/* Expandable content (exercise list + View More) */}
                <ExpandableSection isExpanded={isExpanded}>
                  <View className="p-4 border-t border-black-200">
                    {workout.exercises.map((ex, idx) => (
                      <View
                        key={idx}
                        className="flex-row items-center mb-3 last:mb-0"
                      >
                        <FontAwesome5
                          name="angle-right"
                          size={14}
                          color={primaryColor}
                        />
                        <Text className="text-white font-pmedium ml-3">
                          {ex.name}
                        </Text>
                        <Text className="text-gray-100 ml-auto">
                          {ex.sets} × {ex.reps}
                        </Text>
                      </View>
                    ))}

                    {/* View More button */}
                    <TouchableOpacity
                      onPress={() => goToDetails(workout)}
                      activeOpacity={0.8}
                      className="mt-4 self-end px-4 py-2 rounded-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Text className="text-white font-pmedium text-sm">
                        View More
                      </Text>
                    </TouchableOpacity>
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
