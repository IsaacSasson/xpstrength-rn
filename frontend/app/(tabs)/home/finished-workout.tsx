// Path: /app/(tabs)/finished-workout.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
  LayoutChangeEvent,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import { useUser } from "@/context/UserProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { totalXpForUserLevel } from "@/utils/xpUtils";

/* ------------------------------------------------------------------ */
/*                           Types & Helpers                          */
/* ------------------------------------------------------------------ */
type MuscleCategory =
  | "chest"
  | "legs"
  | "back"
  | "core"
  | "biceps"
  | "triceps"
  | "shoulders";

interface WorkoutEvent {
  id: number | string;
  type:
    | "userLevelUp"
    | "muscleLevelUp"
    | "firstTimeCompletingExercise"
    | "newPersonalBest";
  payload: any;
  createdAt: string;
}

const CATEGORY_LABEL: Record<MuscleCategory, string> = {
  chest: "Chest",
  legs: "Legs",
  back: "Back",
  core: "Core",
  biceps: "Biceps",
  triceps: "Triceps",
  shoulders: "Shoulders",
};

const formatTime = (sec: number) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

/* ----------------------------- Haptics ----------------------------- */
const hapticFeedback = async (type: "light" | "medium" | "heavy" | "success") => {
  try {
    if (Platform.OS === "android") {
      const patterns: Record<string, number[]> = {
        light: [0, 50],
        medium: [0, 100],
        heavy: [0, 200],
        success: [0, 50, 50, 50, 100],
      };
      Vibration.vibrate(patterns[type] || [0, 50]);
    } else {
      if (type === "success") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const impacts: Record<string, Haptics.ImpactFeedbackStyle> = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        await Haptics.impactAsync(impacts[type] || Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  } catch {}
};

/* ------------------------ Calendar Component ------------------------ */
const WorkoutCalendar: React.FC<{
  completedDates: Date[];
  primaryColor: string;
  tertiaryColor: string;
}> = ({ completedDates, primaryColor }) => {
  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const completedSet = useMemo(() => new Set(completedDates.map(dateKey)), [completedDates]);

  const today = new Date();
  const sunday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay()
  );

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [sunday]);

  const renderDay = (date: Date) => {
    const key = dateKey(date);
    const isToday = key === dateKey(today);
    const isCompleted = completedSet.has(key);

    let circleStyle = { backgroundColor: "#2c2b37" };
    let textStyle: { color?: string } = { color: "#ffffff" };

    if (isToday) {
      circleStyle.backgroundColor = primaryColor;
      textStyle.color = "#0F0E1A";
    } else if (isCompleted) {
      circleStyle.backgroundColor = (primaryColor || "#6C5CE7") + "60";
      textStyle.color = "#ffffff";
    }

    return (
      <View key={key} style={{ alignItems: "center", width: 40 }}>
        <View
          style={[
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            },
            circleStyle,
          ]}
        >
          <Text style={[{ fontSize: 16 }, textStyle]}>{date.getDate()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Text className="text-white font-psemibold text-lg text-center mb-4">
        This Week's Progress
      </Text>

      {/* Weekday letters */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "90%",
          alignSelf: "center",
          marginBottom: 8,
        }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((l, i) => (
          <Text
            key={`${l}-${i}`}
            style={{
              color: "#9e9e9e",
              fontSize: 14,
              width: 40,
              textAlign: "center",
            }}
          >
            {l}
          </Text>
        ))}
      </View>

      {/* Day circles */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "90%",
          alignSelf: "center",
        }}
      >
        {weekDates.map(renderDay)}
      </View>
    </View>
  );
};

/* ----------------------------- Level Math ----------------------------- */
const levelFromXp = (xp: number): number => {
  let level = 1;
  while (level < 9999 && totalXpForUserLevel(level + 1) <= xp) {
    level++;
  }
  return level;
};

const levelProgress = (level: number, totalXp: number) => {
  const floor = totalXpForUserLevel(level);
  const next = totalXpForUserLevel(level + 1);
  const inLevel = Math.max(0, totalXp - floor);
  const needed = Math.max(1, next - floor);
  const ratio = Math.max(0, Math.min(1, inLevel / needed));
  return { current: inLevel, needed, ratio };
};

const xpNeededForLevel = (level: number) =>
  Math.max(1, totalXpForUserLevel(level + 1) - totalXpForUserLevel(level));

/* ----------------------- LevelProgress (bar+counter) ----------------------- */
const LevelProgress: React.FC<{
  color: string;
  startLevel: number;
  endLevel: number;
  startProg: { current: number; needed: number; ratio: number };
  endProg: { current: number; needed: number; ratio: number };
  duration?: number;
}> = ({ color, startLevel, endLevel, startProg, endProg, duration = 1500 }) => {
  const barRatio = useRef(new Animated.Value(startProg.ratio)).current;
  const xpValue = useRef(new Animated.Value(startProg.current)).current;
  const levelScale = useRef(new Animated.Value(1)).current;

  const [displayLevel, setDisplayLevel] = useState(startLevel);
  const [displayNeeded, setDisplayNeeded] = useState(startProg.needed);
  const [displayXP, setDisplayXP] = useState(Math.round(startProg.current));
  const [hasAnimated, setHasAnimated] = useState(false);

  const [containerW, setContainerW] = useState(0);
  const onBarLayout = (e: LayoutChangeEvent) => setContainerW(Math.max(0, e.nativeEvent.layout.width));

  const animatedWidth = Animated.multiply(barRatio, containerW);
  const levelUps = Math.max(0, endLevel - startLevel);

  useEffect(() => {
    const id = xpValue.addListener(({ value }) => setDisplayXP(Math.round(value)));
    return () => {
      xpValue.removeListener(id);
    };
  }, [xpValue]);

  useEffect(() => {
    if (hasAnimated || containerW <= 0) return;
    setHasAnimated(true);

    const totalDistance =
      levelUps === 0
        ? Math.abs(endProg.ratio - startProg.ratio)
        : (1 - startProg.ratio) + Math.max(0, levelUps - 1) * 1 + endProg.ratio;

    const baseDur = Math.max(300, duration);
    const durFor = (dist: number) =>
      totalDistance === 0 ? 0 : Math.max(150, Math.round((dist / totalDistance) * baseDur));

    const runSegment = (toRatio: number, toXP: number, ms: number) =>
      new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(barRatio, { toValue: toRatio, duration: ms, useNativeDriver: false }),
          Animated.timing(xpValue, { toValue: toXP, duration: ms, useNativeDriver: false }),
        ]).start(() => resolve());
      });

    const onLevelUp = async () => {
      setDisplayLevel((prev) => prev + 1);
      await hapticFeedback("success");
      await new Promise<void>((resolve) => {
        Animated.sequence([
          Animated.spring(levelScale, { toValue: 1.12, friction: 3, useNativeDriver: true }),
          Animated.spring(levelScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start(() => resolve());
      });
    };

    (async () => {
      if (levelUps === 0) {
        await runSegment(endProg.ratio, endProg.current, durFor(Math.abs(endProg.ratio - startProg.ratio)));
        setDisplayNeeded(endProg.needed);
        return;
      }

      const startToFullDist = 1 - startProg.ratio;
      await runSegment(1, startProg.needed, durFor(startToFullDist));
      await onLevelUp();

      for (let lv = startLevel + 1; lv < endLevel; lv++) {
        barRatio.setValue(0);
        xpValue.setValue(0);
        setDisplayNeeded(xpNeededForLevel(lv));
        await runSegment(1, xpNeededForLevel(lv), durFor(1));
        await onLevelUp();
      }

      barRatio.setValue(0);
      xpValue.setValue(0);
      setDisplayNeeded(endProg.needed);
      await runSegment(endProg.ratio, endProg.current, durFor(endProg.ratio));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerW]);

  return (
    <View className="w-full">
      <View className="flex-row items-center justify-between mb-3">
        <Animated.Text
          className="text-white font-pbold text-lg"
          style={{ transform: [{ scale: levelScale }] }}
        >
          Level {displayLevel}
        </Animated.Text>

        <Text className="text-gray-100">
          {displayXP}/{displayNeeded} XP
        </Text>
      </View>

      <View
        onLayout={onBarLayout}
        style={{
          height: 12,
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            height: "100%",
            width: animatedWidth as unknown as number,
            backgroundColor: color,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
};

/* ------------------------- Exercise Breakdown ------------------------- */
const ExerciseBreakdown: React.FC<{
  primaryColor: string;
  tertiaryColor: string;
  convertWeight: (weight: number, from: "imperial" | "metric", to: "imperial" | "metric") => number;
  unitSystem: "imperial" | "metric";
}> = ({ primaryColor, tertiaryColor, convertWeight, unitSystem }) => {
  const { exerciseBreakdown = "[]" } = useLocalSearchParams<{ exerciseBreakdown?: string }>();

  const exercises = useMemo(() => {
    try {
      return JSON.parse(String(exerciseBreakdown) || "[]");
    } catch {
      return [];
    }
  }, [exerciseBreakdown]);

  if (exercises.length === 0) {
    return null;
  }

  return (
    <View
      className="rounded-2xl p-5 mb-6"
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        borderWidth: 1,
        borderColor: primaryColor + "40",
        shadowColor: primaryColor,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      }}
    >
      <Text className="text-white font-psemibold text-base mb-5 text-center">
        Exercise Breakdown
      </Text>

      {exercises.map((exercise: any, index: number) => {
        const completedSets = exercise.sets.filter((set: any) => set.completed);
        const totalSets = exercise.sets.length;
        const isLast = index === exercises.length - 1;

        return (
          <View
            key={exercise.name + index}
            className="last:mb-0"
            style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 3,
              marginBottom: isLast ? 0 : 24,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-pmedium text-base flex-1" numberOfLines={1}>
                {exercise.name}
              </Text>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="check-circle" size={16} color={primaryColor} />
                <Text className="text-white ml-1.5 font-pmedium text-xs">
                  {completedSets.length}/{totalSets}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap">
              {exercise.sets.map((set: any, setIndex: number) => (
                <View
                  key={setIndex}
                  className="mr-2 mb-2"
                  style={{
                    backgroundColor: set.completed
                      ? primaryColor + "22"
                      : "rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderWidth: 1,
                    borderColor: set.completed
                      ? primaryColor + "55"
                      : "rgba(255,255,255,0.2)",
                    shadowColor: set.completed ? primaryColor : "#000",
                    shadowOpacity: set.completed ? 0.25 : 0.08,
                    shadowRadius: set.completed ? 3 : 2,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: set.completed ? 2 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: set.completed ? primaryColor : "#CDCDE0",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {set.reps} × {convertWeight(Number(set.lbs) || 0, "imperial", unitSystem).toFixed(0)}
                    {unitSystem === "metric" ? "kg" : "lbs"}
                  </Text>
                </View>
              ))}
            </View>

            {completedSets.length > 0 && (
              <View
                className="mt-3 pt-3"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.1)",
                }}
              >
                <Text className="text-gray-100 text-xs font-pmedium">
                  Volume:{" "}
                  {completedSets
                    .reduce((total: number, set: any) => {
                      const weight = convertWeight(Number(set.lbs) || 0, "imperial", unitSystem);
                      return total + weight * (Number(set.reps) || 0);
                    }, 0)
                    .toFixed(0)}{" "}
                  {unitSystem === "metric" ? "kg" : "lbs"}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

/* ------------------------ Achievements Consolidation ----------------------- */
// Helper to read rewards from either the correct key or the legacy 'reards' key.
const readRewards = (e: WorkoutEvent) => {
  return e?.payload?.rewards ?? e?.payload?.reards ?? {};
};

const consolidateLevelUps = (events: WorkoutEvent[]): WorkoutEvent[] => {
  const userLevel = events.filter((e) => e.type === "userLevelUp");
  const muscleLevels = events.filter((e) => e.type === "muscleLevelUp");
  const others = events.filter((e) => e.type !== "userLevelUp" && e.type !== "muscleLevelUp");

  const consolidated: WorkoutEvent[] = [];

  // ---- Consolidate USER level-ups into a single range ----
  if (userLevel.length > 0) {
    const newLevels = userLevel
      .map((e) => Number(e.payload?.newLevel))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);

    if (newLevels.length > 0) {
      const minNew = newLevels[0];
      const maxNew = newLevels[newLevels.length - 1];
      const fromLevel = Math.max(0, minNew - 1);

      // coins can be scattered; sum across both rewards/reards
      const totalCoins = userLevel.reduce((sum, e) => sum + (Number(readRewards(e).coins) || 0), 0);

      // XP equivalent to traverse from -> to using your XP table
      const xpEquivalent = Math.max(
        0,
        totalXpForUserLevel(maxNew) - totalXpForUserLevel(fromLevel)
      );

      consolidated.push({
        id: `user-${fromLevel}-${maxNew}`,
        type: "userLevelUp",
        createdAt: userLevel[userLevel.length - 1]?.createdAt || new Date().toISOString(),
        payload: {
          fromLevel,
          newLevel: maxNew,
          rewards: { coins: totalCoins },
          xpEquivalent,
          consolidated: true,
        },
      });
    }
  }

  // ---- Consolidate MUSCLE level-ups per muscle (case-insensitive) ----
  const byMuscle: Record<string, WorkoutEvent[]> = {};
  for (const e of muscleLevels) {
    const rawMuscle =
      e?.payload?.type ??
      e?.payload?.muscle ??
      e?.payload?.muscleGroup ??
      "";
    const key = String(rawMuscle).toLowerCase().trim(); // normalize
    if (!byMuscle[key]) byMuscle[key] = [];
    byMuscle[key].push(e);
  }

  Object.entries(byMuscle).forEach(([key, group]) => {
    const levels = group
      .map((e) => Number(e.payload?.newLevel))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .sort((a, b) => a - b);

    if (levels.length === 0) return;

    const minNew = levels[0];
    const maxNew = levels[levels.length - 1];
    const fromLevel = Math.max(0, minNew - 1);

    // Sum XP from rewards (support both rewards/reards and userXP/userXp)
    const totalUserXp = group.reduce((sum, e) => {
      const r = readRewards(e);
      const xp = Number(r.userXP ?? r.userXp ?? r.xp ?? 0);
      return sum + (Number.isFinite(xp) ? xp : 0);
    }, 0);

    const sample = group[group.length - 1];
    consolidated.push({
      id: `muscle-${key}-${fromLevel}-${maxNew}`,
      type: "muscleLevelUp",
      createdAt: sample?.createdAt || new Date().toISOString(),
      payload: {
        type: key as MuscleCategory, // we’ll prettify label later
        fromLevel,
        newLevel: maxNew,
        rewards: { userXp: totalUserXp }, // keep camel for downstream UI
        consolidated: true,
      },
    });
  });

  // Only return consolidated level-ups + all *non-level* events
  // (original raw level-up events are intentionally excluded)
  return [...consolidated, ...others];
};

/* ---------------------------- Achievement Card ---------------------------- */
const AchievementCard: React.FC<{
  event: WorkoutEvent;
  primaryColor: string;
  tertiaryColor: string;
  index: number;
  getExerciseName: (id: number | string) => string;
  convertWeight: (weight: number, from: "imperial" | "metric", to: "imperial" | "metric") => number;
  unitSystem: "imperial" | "metric";
}> = ({
  event,
  primaryColor,
  tertiaryColor,
  index,
  getExerciseName,
  convertWeight,
  unitSystem,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = index * 200;
    const t = setTimeout(() => {
      hapticFeedback("light");
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [index]);

  const getEventIcon = () => {
    switch (event.type) {
      case "userLevelUp":
        return "trophy";
      case "muscleLevelUp":
        return "medal";
      case "firstTimeCompletingExercise":
        return "star";
      case "newPersonalBest":
        return "crown";
      default:
        return "award";
    }
  };

  const getEventColor = () => {
    switch (event.type) {
      case "userLevelUp":
        return "#FFD700";
      case "muscleLevelUp":
        return primaryColor;
      case "firstTimeCompletingExercise":
        return "#10B981";
      case "newPersonalBest":
        return "#F59E0B";
      default:
        return primaryColor;
    }
  };

  const prettyMuscle = (k: string) => {
    const norm = String(k || "").toLowerCase();
    return CATEGORY_LABEL[(norm as MuscleCategory) || "core"] || (norm.charAt(0).toUpperCase() + norm.slice(1));
  };

  const getEventTitle = () => {
    switch (event.type) {
      case "userLevelUp":
        return "Level Up!";
      case "muscleLevelUp":
        return `${prettyMuscle(event.payload?.type)} Level Up!`;
      case "firstTimeCompletingExercise":
        return "First Achievement!";
      case "newPersonalBest":
        return "Personal Best!";
      default:
        return "Achievement!";
    }
  };

  const getEventDescription = () => {
    switch (event.type) {
      case "userLevelUp": {
        const from = event.payload?.fromLevel;
        const to = event.payload?.newLevel;
        if (Number.isFinite(from) && Number.isFinite(to)) {
          return `Level ${from} → ${to}`;
        }
        return `Reached level ${event.payload?.newLevel}`;
      }
      case "muscleLevelUp": {
        const from = event.payload?.fromLevel;
        const to = event.payload?.newLevel;
        const label = prettyMuscle(event.payload?.type);
        if (Number.isFinite(from) && Number.isFinite(to)) {
          return `${label} level ${from} → ${to}`;
        }
        return `${label} reached level ${event.payload?.newLevel}`;
      }
      case "firstTimeCompletingExercise":
        return `Completed ${getExerciseName(event.payload.exerciseId)} for the first time`;
      case "newPersonalBest": {
        const exerciseName = getExerciseName(event.payload.exerciseId);
        const newWeight = convertWeight(event.payload.newWeight, "imperial", unitSystem);
        const unit = unitSystem === "metric" ? "kg" : "lbs";
        return `New record: ${exerciseName} - ${newWeight.toFixed(1)} ${unit}`;
      }
      default:
        return "Great job!";
    }
  };

  const getReward = () => {
    switch (event.type) {
      case "userLevelUp": {
        const xpEq = Number(event.payload?.xpEquivalent) || 0;
        const coins = Number(event.payload?.rewards?.coins) || 0;
        const xpPart = xpEq > 0 ? `+${xpEq} XP` : "";
        const coinPart = coins > 0 ? `+${coins} coins` : "";
        return [xpPart, coinPart].filter(Boolean).join(" • ");
      }
      case "muscleLevelUp": {
        const r = event.payload?.rewards ?? event.payload?.reards ?? {};
        const totalXp = Number(r.userXP ?? r.userXp ?? r.xp ?? 0) || 0;
        return totalXp > 0 ? `+${totalXp} XP` : "";
      }
      case "firstTimeCompletingExercise":
        return `+${event.payload?.rewards?.userXp || 0} XP`;
      case "newPersonalBest":
        return `+${event.payload?.rewards?.userXp || 0} XP`;
      default:
        return "";
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        backgroundColor: tertiaryColor,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: getEventColor(),
      }}
    >
      <View className="flex-row items-center">
        <View
          style={{
            backgroundColor: getEventColor() + "20",
            borderRadius: 24,
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <FontAwesome5 name={getEventIcon()} size={20} color={getEventColor()} />
        </View>

        <View className="flex-1">
          <Text className="text-white font-psemibold text-lg">{getEventTitle()}</Text>
          <Text className="text-gray-100 text-sm mt-1">{getEventDescription()}</Text>
          {getReward() && (
            <Text style={{ color: getEventColor() }} className="font-pmedium text-sm mt-2">
              {getReward()}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

/* ------------------------------------------------------------------ */
/*                           Main Screen                              */
/* ------------------------------------------------------------------ */
const FinishedWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const { convertWeight, formatWeight, unitSystem, getExerciseMeta } = useWorkouts();
  const { profile, addExperience, addCurrency } = useUser();
  const insets = useSafeAreaInsets();

  const {
    volume = "0",
    elapsed = "0",
    xpGained = "0",
    events = "[]",
    muscleCategoryXP = "{}",
  } = useLocalSearchParams<{
    volume?: string;
    elapsed?: string;
    xpGained?: string;
    events?: string;
    muscleCategoryXP?: string;
  }>();

  const volumeNum = Number(volume) || 0;
  const elapsedNum = Number(elapsed) || 0;
  const xpGainNum = Number(xpGained) || 0;

  const workoutEvents: WorkoutEvent[] = useMemo(() => {
    try {
      return JSON.parse(String(events) || "[]");
    } catch {
      return [];
    }
  }, [events]);

  // 🔧 Consolidate level-up spam into single per-group entries
  const consolidatedEvents = useMemo(
    () => consolidateLevelUps(workoutEvents),
    [workoutEvents]
  );

  const convertedVolume = convertWeight(volumeNum, "imperial", unitSystem);
  const formattedVolume = formatWeight(convertedVolume, unitSystem);

  // Capture pre-gain XP once for stable animation
  const initialXpRef = useRef<number | null>(null);
  if (initialXpRef.current === null) {
    initialXpRef.current = profile?.xp ?? 0;
  }

  const xpData = useMemo(() => {
    const startTotalXP = initialXpRef.current ?? 0;
    const endTotalXP = startTotalXP + Math.max(0, xpGainNum);

    const startLevel = levelFromXp(startTotalXP);
    const endLevel = levelFromXp(endTotalXP);

    const startProg = levelProgress(startLevel, startTotalXP);
    const endProg = levelProgress(endLevel, endTotalXP);

    return {
      startLevel,
      endLevel,
      startProg,
      endProg,
      levelUps: Math.max(0, endLevel - startLevel),
      leveledUp: endLevel > startLevel,
    };
  }, [xpGainNum]);

  // Apply rewards once
  const [hasProcessedRewards, setHasProcessedRewards] = useState(false);
  useEffect(() => {
    if (!hasProcessedRewards && xpGainNum > 0) {
      setHasProcessedRewards(true);
      addExperience(xpGainNum, true);

      // Sum coins across both rewards & reards for robustness
      const totalCoins = workoutEvents
        .filter((e) => e.type === "userLevelUp")
        .reduce((sum, e) => sum + (Number(readRewards(e).coins) || 0), 0);

      if (totalCoins > 0) {
        addCurrency(totalCoins);
      }
    }
  }, [xpGainNum, workoutEvents, addExperience, addCurrency, hasProcessedRewards]);

  const getExerciseName = useCallback(
    (id: number | string): string => {
      const meta = getExerciseMeta(id);
      return meta?.name || `Exercise ${id}`;
    },
    [getExerciseMeta]
  );

  const completedWorkoutDates = useMemo(() => {
    const today = new Date();
    const dates = [today];
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    dates.push(twoDaysAgo);
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);
    dates.push(fiveDaysAgo);
    return dates;
  }, []);

  /* ---------------------------------------------------------------
   * ABSOLUTE TOP OVERLAY
   * - Change OVERLAY_MODE to "custom" and set CUSTOM_OVERLAY_HEIGHT
   *   if you want a fixed height.
   * - Default "statusBar" uses the safe-area top inset (iPhone notch).
   * --------------------------------------------------------------- */
  const OVERLAY_MODE: "statusBar" | "custom" = "statusBar";
  const CUSTOM_OVERLAY_HEIGHT = 54; // only used when OVERLAY_MODE === "custom"
  const topOverlayHeight =
    OVERLAY_MODE === "statusBar" ? insets.top : CUSTOM_OVERLAY_HEIGHT;

  // tweak the color/opacity here
  const topOverlayColor = "#0F0E1A"; // ~15% opacity

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      {/* Absolute top overlay above everything in this screen */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: topOverlayHeight,
          backgroundColor: topOverlayColor,
          zIndex: 9999,
          elevation: 9999,
        }}
      />

      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingTop: 20 + insets.top,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center my-8">
          <Text className="text-3xl font-pbold text-center" style={{ color: primaryColor }}>
            Workout Complete!
          </Text>
          <Text className="text-gray-100 text-center mt-2 text-lg">
            Excellent work! You're getting stronger every day.
          </Text>
        </View>

        {/* Calendar */}
        <WorkoutCalendar
          completedDates={completedWorkoutDates}
          primaryColor={primaryColor}
          tertiaryColor={tertiaryColor}
        />

        {/* Workout Summary */}
        <View
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: tertiaryColor,
            borderWidth: 1,
            borderColor: primaryColor + "20",
          }}
        >
          <Text className="text-white font-psemibold text-xl mb-6 text-center">
            Workout Summary
          </Text>

          <View className="flex-row justify-between mb-6">
            <View className="items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: primaryColor + "20" }}
              >
                <MaterialCommunityIcons name="weight-lifter" size={28} color={primaryColor} />
              </View>
              <Text className="text-white text-xl font-pbold">{formattedVolume}</Text>
              <Text className="text-gray-100 text-sm">Total Volume</Text>
            </View>

            <View className="items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: secondaryColor + "20" }}
              >
                <FontAwesome5 name="stopwatch" size={24} color={secondaryColor} />
              </View>
              <Text className="text-white text-xl font-pbold">{formatTime(elapsedNum)}</Text>
              <Text className="text-gray-100 text-sm">Duration</Text>
            </View>

            <View className="items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: "#FFD700" + "20" }}
              >
                <FontAwesome5 name="star" size={24} color="#FFD700" />
              </View>
              <Text className="text-white text-xl font-pbold">{xpGainNum}</Text>
              <Text className="text-gray-100 text-sm">XP Earned</Text>
            </View>
          </View>

          {/* XP Progress */}
          <LevelProgress
            color={primaryColor}
            startLevel={xpData.startLevel}
            endLevel={xpData.endLevel}
            startProg={xpData.startProg}
            endProg={xpData.endProg}
            duration={1500}
          />

          {xpData.leveledUp && (
            <Text className="text-center mt-3 font-pbold" style={{ color: primaryColor }}>
              🎉 Congratulations! You reached level {xpData.endLevel}!
            </Text>
          )}
        </View>

        {/* Exercise Breakdown */}
        <ExerciseBreakdown
          primaryColor={primaryColor}
          tertiaryColor={tertiaryColor}
          convertWeight={convertWeight}
          unitSystem={unitSystem}
        />

        {/* Achievements (consolidated) */}
        {consolidatedEvents.length > 0 && (
          <View className="mb-6">
            <Text className="text-white font-pbold text-2xl mb-6 text-center">🏆 Achievements Unlocked</Text>
            {consolidatedEvents.map((event, index) => (
              <AchievementCard
                key={`${event.type}-${event.payload?.type ?? "user"}-${event.payload?.fromLevel ?? "?"}-${event.payload?.newLevel ?? "?"}-${index}`}
                event={event}
                primaryColor={primaryColor}
                tertiaryColor={tertiaryColor}
                index={index}
                getExerciseName={getExerciseName}
                convertWeight={convertWeight}
                unitSystem={unitSystem}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View
        className="absolute bottom-0 left-0 right-0 p-4"
        style={{
          backgroundColor: "#0F0E1A",
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.1)",
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          className="w-full py-4 rounded-xl items-center"
          style={{
            backgroundColor: primaryColor,
            shadowColor: primaryColor,
            shadowOpacity: 0.4,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <Text className="text-white font-pbold text-lg">Continue to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FinishedWorkout;
