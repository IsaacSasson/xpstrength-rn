// Path: /app/(tabs)/history.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
  Image,
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
  date: string; // YYYY-MM-DD (LOCAL date string)
  name: string;
  duration: string;
  exercises: ExerciseSummary[];
}

type HistoryRange = "Week" | "Month" | "All Time";
type ViewMode = "list" | "calendar";

/* ------------------------------------------------------------------
 * Local-date utilities (avoid UTC parsing entirely)
 * ------------------------------------------------------------------ */
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Format a Date (already local) to YYYY-MM-DD */
const toISODateLocal = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Parse "YYYY-MM-DD" as a LOCAL date (NOT UTC) */
const parseISOAsLocal = (iso: string) => {
  const [y, m, dd] = iso.split("-").map((v) => parseInt(v, 10));
  return new Date(y, (m || 1) - 1, dd || 1, 0, 0, 0, 0);
};

const formatDate = (iso: string) =>
  parseISOAsLocal(iso).toLocaleDateString("en-US", {
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
  const d = parseISOAsLocal(iso);
  d.setHours(0, 0, 0, 0);
  const t = todayDateOnly().getTime();
  const diffMs = t - d.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/** Safe date-time for screens that do `new Date(str)` (prevents UTC shift) */
const toLocalSafeDateTime = (isoDate: string) => `${isoDate}T12:00:00`;

/* ------------------------------------------------------------------
 * Dummy History Data Generator
 * ------------------------------------------------------------------ */
const EXERCISE_LIBRARY: ExerciseSummary[] = [
  { name: "Bench Press", sets: 4, reps: "8" },
  { name: "Incline DB Press", sets: 3, reps: "10" },
  { name: "Shoulder Press", sets: 3, reps: "10" },
  { name: "Tricep Extensions", sets: 3, reps: "12" },
  { name: "Push-ups", sets: 3, reps: "AMRAP" },
  { name: "Deadlifts", sets: 4, reps: "5" },
  { name: "Pull-ups", sets: 3, reps: "8" },
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
    picks: [
      "Bench Press",
      "Incline DB Press",
      "Shoulder Press",
      "Tricep Extensions",
    ],
  },
  {
    name: "Pull Day",
    picks: ["Deadlifts", "Pull-ups", "Barbell Rows", "Bicep Curls"],
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
    picks: ["Bench Press", "Pull-ups", "Shoulder Press", "Bicep Curls"],
  },
  {
    name: "HIIT Circuit",
    picks: ["Burpees", "Push-ups", "Crunches", "Planks"],
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

/** Generate dummy PastWorkout array (~120 days) */
const generateDummyHistory = (): PastWorkout[] => {
  const out: PastWorkout[] = [];
  const today = todayDateOnly();
  const daysBack = 120;

  let idCounter = 1;

  for (let i = 0; i <= daysBack; i++) {
    const hasWorkout = Math.random() < 0.57; // ~4/week
    if (!hasWorkout) continue;

    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = toISODateLocal(d); // LOCAL ISO

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

  // Ensure some recent workouts exist:
  if (!out.some((w) => diffInDaysFromToday(w.date) <= 6)) {
    const iso = toISODateLocal(today);
    const tmpl = WORKOUT_TEMPLATES[0];
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
    const d = new Date(today);
    d.setDate(today.getDate() - 10);
    const iso = toISODateLocal(d);
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

  out.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  return out;
};

/* ------------------------------------------------------------------
 * Calendar (FlatList 6x7)
 * ------------------------------------------------------------------ */
interface CalendarProps {
  workouts: PastWorkout[];
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  onSelectWorkout: (workout: PastWorkout) => void;
}

type CalendarCell =
  | {
      key: string;
      type: "day";
      day: number;
      dateStr: string; // YYYY-MM-DD (LOCAL)
      workouts: PastWorkout[];
    }
  | { key: string; type: "empty" };

const CELL_HEIGHT = 52;
const COLS = 7;
const TOTAL_CELLS = 6 * COLS;

const buildMonthMatrix = (
  currentDate: Date,
  workoutsByDate: Record<string, PastWorkout[]>
): CalendarCell[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstDayWeekday = firstDayOfMonth.getDay(); // 0..6
  const daysInMonth = lastDayOfMonth.getDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDayWeekday; i++) {
    cells.push({ key: `e-${i}`, type: "empty" });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    cells.push({
      key: `d-${dateStr}`,
      type: "day",
      day,
      dateStr,
      workouts: workoutsByDate[dateStr] || [],
    });
  }

  while (cells.length < TOTAL_CELLS) {
    cells.push({ key: `t-${cells.length}`, type: "empty" });
  }

  return cells;
};

const Calendar: React.FC<CalendarProps> = ({
  workouts,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  onSelectWorkout,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  // Prevent future navigation
  const today = todayDateOnly();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  // Group workouts by date for *current* month using LOCAL parsing
  const workoutsByDate = useMemo(() => {
    const map: Record<string, PastWorkout[]> = {};
    const cm = currentDate.getMonth();
    const cy = currentDate.getFullYear();
    for (const w of workouts) {
      const d = parseISOAsLocal(w.date); // LOCAL
      if (d.getMonth() === cm && d.getFullYear() === cy) {
        if (!map[w.date]) map[w.date] = [];
        map[w.date].push(w);
      }
    }
    return map;
  }, [workouts, currentDate]);

  const matrix = useMemo(
    () => buildMonthMatrix(currentDate, workoutsByDate),
    [currentDate, workoutsByDate]
  );

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "next" && isCurrentMonth) return;
    const nd = new Date(currentDate);
    nd.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(nd);
  };

  const renderItem: ListRenderItem<CalendarCell> = ({ item }) => {
    const colWidth = `${100 / COLS}%`;

    if (item.type === "empty") {
      return (
        <View
          style={{
            width: colWidth,
            height: CELL_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      );
    }

    const hasWorkouts = item.workouts.length > 0;

    return (
      <TouchableOpacity
        onPress={() => {
          if (hasWorkouts) onSelectWorkout(item.workouts[0]);
        }}
        disabled={!hasWorkouts}
        activeOpacity={hasWorkouts ? 0.8 : 1}
        style={{
          width: colWidth,
          height: CELL_HEIGHT,
          paddingVertical: 4,
          paddingHorizontal: 4,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "transparent",
          }}
        >
          {hasWorkouts ? (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: primaryColor,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins-SemiBold",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                {item.day}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontFamily: "Poppins-Medium",
                fontSize: 14,
                color: "#9CA3AF", // gray-400
              }}
            >
              {item.day}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="px-4">
      {/* Month Navigation */}
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity
          onPress={() => navigateMonth("prev")}
          className="p-3 rounded-full"
          style={{ backgroundColor: tertiaryColor }}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="chevron-left" size={16} color={primaryColor} />
        </TouchableOpacity>

        <Text className="text-white font-psemibold text-xl">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <TouchableOpacity
          onPress={() => navigateMonth("next")}
          className="p-3 rounded-full"
          style={{
            backgroundColor: isCurrentMonth ? "#2A2A2A" : tertiaryColor,
          }}
          activeOpacity={isCurrentMonth ? 1 : 0.7}
          disabled={isCurrentMonth}
        >
          <FontAwesome5
            name="chevron-right"
            size={16}
            color={isCurrentMonth ? "#666" : primaryColor}
          />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View className="flex-row mb-2">
        {dayNames.map((d, i) => (
          <View
            key={`${d}-${i}`}
            style={{
              width: `${100 / COLS}%`,
              height: 22,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="text-gray-400 font-pmedium text-xs">{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid — background removed, bordered in primaryColor */}
      <View
        style={{
          borderRadius: 18,
          padding: 6,
          borderWidth: 1,
          borderColor: primaryColor,
          backgroundColor: "transparent",
        }}
      >
        <FlatList
          data={matrix}
          keyExtractor={(item) => item.key}
          numColumns={COLS}
          renderItem={renderItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingVertical: 4 }}
        />
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------
 * Main Component
 * ------------------------------------------------------------------ */
const WorkoutHistory: React.FC = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  const [history, setHistory] = useState<PastWorkout[]>([]);
  const [activeRange, setActiveRange] = useState<HistoryRange>("Week");
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedWorkout, setSelectedWorkout] = useState<PastWorkout | null>(
    null
  );

  useEffect(() => {
    const data = generateDummyHistory();
    setHistory(data);
  }, []);

  const filteredHistory = useMemo(() => {
    if (activeRange === "All Time") return history;
    const daysLimit = activeRange === "Week" ? 7 : 30;
    return history.filter((w) => diffInDaysFromToday(w.date) <= daysLimit - 1);
  }, [history, activeRange]);

  const handleRangeChange = (newRange: HistoryRange) => {
    if (newRange === activeRange || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveRange(newRange);
      setIsAnimating(false);
    }, 150);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "calendar" : "list");
  };

  /** IMPORTANT: pass a "safe" date string to avoid off-by-one in details screen */
  const goToDetails = (workout: PastWorkout) => {
    const safePayload: any = {
      ...workout,
      dateOriginal: workout.date,
      date: toLocalSafeDateTime(workout.date), // prevents UTC shift on parse
    };
    const payload = encodeURIComponent(JSON.stringify(safePayload));
    router.push({
      pathname: "/stats/workout-details",
      params: { workout: payload },
    });
  };

  const hasAnyHistory = history.length > 0;
  const hasFilteredHistory = filteredHistory.length > 0;

  // Small helpers for the summary card
  const totalSetsFor = (w: PastWorkout | null) =>
    !w ? 0 : w.exercises.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <Header MText="Workout History" SText="Review your past workouts" />
            <TouchableOpacity
              onPress={toggleViewMode}
              className="p-2 rounded-lg"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={
                  viewMode === "list"
                    ? "calendar-month"
                    : "format-list-bulleted"
                }
                size={24}
                color={primaryColor}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Tabs */}
      {viewMode === "list" && (
        <View className="px-4 mt-2 mb-4">
          <Tabs<HistoryRange>
            tabs={["Week", "Month", "All Time"]}
            activeTab={activeRange}
            onTabChange={handleRangeChange}
            isAnimating={isAnimating}
            backgroundColor={primaryColor}
          />
        </View>
      )}

      {/* Body */}
      {!hasAnyHistory ? (
        <View className="flex-1 justify-center items-center px-4">
          <MaterialCommunityIcons
            name="history"
            size={64}
            color={primaryColor}
          />
          <Text className="text-white font-pmedium text-lg mt-4">
            No workout history yet
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            Complete a workout and it will appear here.
          </Text>
        </View>
      ) : viewMode === "calendar" ? (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <Calendar
            workouts={history}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            tertiaryColor={tertiaryColor}
            onSelectWorkout={(w) => setSelectedWorkout(w)}
          />

          {/* Summary panel replaces legend */}
          <View className="px-4">
            {!selectedWorkout ? (
              <View className="items-center mt-10">
                <Text className="text-gray-100">
                  Tap a date with a dot to preview that workout.
                </Text>
              </View>
            ) : (
              <View
                className="rounded-2xl p-5 mt-10 mb-8"
                style={{ backgroundColor: tertiaryColor }}
              >
                {/* Header row (no image) */}
                <View className="flex-row items-center mb-4">
                  <View className="flex-1">
                    <Text
                      className="text-white font-psemibold text-lg"
                      style={{ color: primaryColor }}
                      numberOfLines={1}
                    >
                      {selectedWorkout.name}
                    </Text>
                    <Text className="text-gray-100 text-xs">
                      {formatDate(selectedWorkout.date)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => goToDetails(selectedWorkout)}
                    className="px-3 py-2 rounded-lg"
                    style={{ backgroundColor: primaryColor }}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white font-pmedium text-xs">
                      View more
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Metrics row (compact) */}
                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <FontAwesome5
                      name="stopwatch"
                      size={18}
                      color={primaryColor}
                    />
                    <Text className="text-white mt-1 font-pmedium">
                      {selectedWorkout.duration}
                    </Text>
                    <Text className="text-gray-100 text-2xs">Time</Text>
                  </View>

                  <View className="items-center flex-1">
                    <MaterialCommunityIcons
                      name="format-list-numbered"
                      size={20}
                      color={primaryColor}
                    />
                    <Text className="text-white mt-1 font-pmedium">
                      {totalSetsFor(selectedWorkout)}
                    </Text>
                    <Text className="text-gray-100 text-2xs">Total Sets</Text>
                  </View>

                  <View className="items-center flex-1">
                    <FontAwesome5
                      name="dumbbell"
                      size={18}
                      color={primaryColor}
                    />
                    <Text className="text-white mt-1 font-pmedium">
                      {selectedWorkout.exercises.length}
                    </Text>
                    <Text className="text-gray-100 text-2xs">Exercises</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
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
          {filteredHistory.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              className="rounded-xl overflow-hidden mb-4 p-4 flex-row items-center justify-between"
              style={{ backgroundColor: tertiaryColor }}
              onPress={() => goToDetails(workout)}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center flex-1">
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={22}
                  color={primaryColor}
                />
                <View className="ml-3 flex-1">
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
                <FontAwesome5 name="chevron-right" size={14} color="#CDCDE0" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default WorkoutHistory;
