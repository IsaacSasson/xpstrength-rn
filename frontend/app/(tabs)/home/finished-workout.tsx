// Path: /app/(tabs)/finished-workout.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
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

type MuscleXpByExercise = Record<string, Partial<Record<MuscleCategory, number>>>;

interface WorkoutEvent {
  id: number;
  type:
    | "userLevelUp"
    | "muscleLevelUp"
    | "firstTimeCompletingExercise"
    | "newPersonalBest";
  payload: any;
  createdAt: string;
}

const CATEGORY_ORDER: MuscleCategory[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "core",
  "legs",
];

const CATEGORY_LABEL: Record<MuscleCategory, string> = {
  chest: "Chest",
  legs: "Legs",
  back: "Back",
  core: "Core",
  biceps: "Biceps",
  triceps: "Triceps",
  shoulders: "Shoulders",
};

const MUSCLE_EMOJIS: Partial<Record<MuscleCategory, string>> = {
  chest: "💪",
  legs: "🦵",
  back: "🏋️",
  core: "🔥",
  biceps: "💪",
  triceps: "💪",
  shoulders: "🏋️",
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

/* --------------------- Basic non-animated bar ---------------------- */
const ProgressBar: React.FC<{
  ratio: number; // 0..1
  color: string;
}> = ({ ratio, color }) => {
  const clamped = Math.max(0, Math.min(1, ratio || 0));
  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <View
        className="h-full"
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

/* ------------------------ Animated progress bar ------------------------ */
const AnimatedProgressBar: React.FC<{
  progress: Animated.AnimatedInterpolation<string | number>;
  color: string;
}> = ({ progress, color }) => {
  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <Animated.View
        className="h-full"
        style={{
          width: progress,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

/* ----------------------------- Level math ----------------------------- */
// Returns the level for a given total XP.
const levelFromXp = (xp: number): number => {
  let level = 1;
  while (level <= 1000 && totalXpForUserLevel(level + 1) <= xp) {
    level++;
  }
  return level;
};

// Returns progress info for a given level and total XP.
const levelProgress = (level: number, totalXp: number) => {
  const floor = totalXpForUserLevel(level);
  const next = totalXpForUserLevel(level + 1);
  const inLevel = Math.max(0, totalXp - floor);
  const needed = Math.max(1, next - floor);
  const ratio = Math.max(0, Math.min(1, inLevel / needed));
  return { current: inLevel, needed, ratio };
};

/* ---------------------------- Event Card ---------------------------- */
const EventCard: React.FC<{
  event: WorkoutEvent;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  index: number;
  convertWeight: (
    weight: number,
    from: "imperial" | "metric",
    to: "imperial" | "metric"
  ) => number;
  unitSystem: "imperial" | "metric";
  getExerciseName: (id: number | string) => string;
}> = ({
  event,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  index,
  convertWeight,
  unitSystem,
  getExerciseName,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const delay = index * 600;
    const t = setTimeout(() => {
      hapticFeedback("medium");
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(t);
  }, [index]);

  const renderEventContent = () => {
    switch (event.type) {
      case "userLevelUp":
        return (
          <View className="items-center p-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: primaryColor }}
            >
              <FontAwesome5 name="trophy" size={32} color="#FFF" />
            </View>
            <Text className="text-white font-pbold text-2xl mb-2">Level Up!</Text>
            <Text className="text-gray-100 text-center mb-4 text-lg">
              Congratulations! You reached level {event.payload.newLevel}
            </Text>
            <View className="flex-row items-center bg-yellow-500/20 px-4 py-2 rounded-xl">
              <FontAwesome5 name="coins" size={20} color="#FFD700" />
              <Text className="text-yellow-400 ml-3 font-pbold text-lg">
                +{event.payload.rewards.coins} coins earned
              </Text>
            </View>
          </View>
        );

      case "muscleLevelUp": {
        const muscle = (event.payload?.type || "") as MuscleCategory;
        return (
          <View className="items-center p-6">
            <Text className="text-5xl mb-4">{MUSCLE_EMOJIS[muscle] || "💪"}</Text>
            <Text className="text-white font-pbold text-xl mb-2">
              {CATEGORY_LABEL[muscle] || "Muscle"} Level Up!
            </Text>
            <Text className="text-gray-100 text-center mb-4 text-lg">
              Your {CATEGORY_LABEL[muscle]?.toLowerCase()} reached level {event.payload.newLevel}
            </Text>
            <View className="flex-row items-center bg-purple-500/20 px-4 py-2 rounded-xl">
              <FontAwesome5 name="star" size={18} color={primaryColor} />
              <Text className="ml-3 font-pbold text-lg" style={{ color: primaryColor }}>
                +{event.payload.rewards.userXP} XP bonus
              </Text>
            </View>
          </View>
        );
      }

      case "firstTimeCompletingExercise": {
        const exerciseName = getExerciseName(event.payload.exerciseId);
        return (
          <View className="items-center p-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#10B981" }}
            >
              <FontAwesome5 name="medal" size={32} color="#FFF" />
            </View>
            <Text className="text-white font-pbold text-xl mb-2">First Achievement!</Text>
            <Text className="text-gray-100 text-center mb-4 text-lg">
              You completed <Text className="font-pbold text-white">{exerciseName}</Text> for the first time
            </Text>
            <View className="flex-row items-center bg-green-500/20 px-4 py-2 rounded-xl">
              <FontAwesome5 name="star" size={18} color="#10B981" />
              <Text className="text-green-400 ml-3 font-pbold text-lg">
                +{event.payload.rewards.userXp} XP earned
              </Text>
            </View>
          </View>
        );
      }

      case "newPersonalBest": {
        const exerciseName = getExerciseName(event.payload.exerciseId);
        const oldWeight = convertWeight(event.payload.oldWeight, "imperial", unitSystem);
        const newWeight = convertWeight(event.payload.newWeight, "imperial", unitSystem);
        const unit = unitSystem === "metric" ? "kg" : "lbs";
        return (
          <View className="items-center p-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#F59E0B" }}
            >
              <FontAwesome5 name="crown" size={32} color="#FFF" />
            </View>
            <Text className="text-white font-pbold text-xl mb-2">Personal Best!</Text>
            <Text className="text-gray-100 text-center mb-4 text-lg">
              New record for <Text className="font-pbold text-white">{exerciseName}</Text>
            </Text>
            <View className="flex-row items-center mb-4 bg-orange-500/20 px-4 py-2 rounded-xl">
              <Text className="text-gray-100 text-lg">
                {oldWeight.toFixed(1)} {unit}
              </Text>
              <FontAwesome5
                name="arrow-right"
                size={20}
                color={primaryColor}
                style={{ marginHorizontal: 12 }}
              />
              <Text className="text-white font-pbold text-lg">
                {newWeight.toFixed(1)} {unit}
              </Text>
            </View>
            <View className="flex-row items-center">
              <FontAwesome5 name="star" size={18} color="#F59E0B" />
              <Text className="text-yellow-400 ml-3 font-pbold text-lg">
                +{event.payload.rewards.userXp} XP earned
              </Text>
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 20,
      }}
    >
      <View
        className="rounded-2xl"
        style={{
          backgroundColor: tertiaryColor,
          borderWidth: 2,
          borderColor: primaryColor,
          shadowColor: primaryColor,
          shadowOpacity: 0.3,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {renderEventContent()}
      </View>
    </Animated.View>
  );
};

/* ------------------------------------------------------------------ */
/*                           Main Screen                              */
/* ------------------------------------------------------------------ */
const FinishedWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const { convertWeight, formatWeight, unitSystem, getExerciseMeta } = useWorkouts(); // single destructure here
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

  const volumeNum = Number(volume);
  const elapsedNum = Number(elapsed);
  const xpGainNum = Number(xpGained);

  const workoutEvents: WorkoutEvent[] = useMemo(() => {
    try {
      return JSON.parse(String(events) || "[]");
    } catch {
      return [];
    }
  }, [events]);

  const muscleCategoryGains: MuscleXpByExercise = useMemo(() => {
    try {
      const parsed = JSON.parse(String(muscleCategoryXP) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, [muscleCategoryXP]);

  const convertedVolume = convertWeight(volumeNum, "imperial", unitSystem);
  const formattedVolume = formatWeight(convertedVolume, unitSystem);

  /* ------------------ Build animation phases from XP ------------------ */
  const startTotalXP = profile?.xp ?? 0;
  const endTotalXP = startTotalXP + Math.max(0, xpGainNum);

  const startLevel = levelFromXp(startTotalXP);
  const endLevel = levelFromXp(endTotalXP);

  const startProg = levelProgress(startLevel, startTotalXP);
  const endProg = levelProgress(endLevel, endTotalXP);

  type Phase = {
    level: number;
    fromRatio: number;
    toRatio: number;
    needed: number;
  };

  const buildPhases = (): Phase[] => {
    const phases: Phase[] = [];
    if (xpGainNum <= 0) {
      phases.push({
        level: startLevel,
        fromRatio: startProg.ratio,
        toRatio: startProg.ratio,
        needed: startProg.needed,
      });
      return phases;
    }

    if (startLevel === endLevel) {
      phases.push({
        level: startLevel,
        fromRatio: startProg.ratio,
        toRatio: endProg.ratio,
        needed: startProg.needed,
      });
      return phases;
    }

    // Phase 1: finish current level
    phases.push({
      level: startLevel,
      fromRatio: startProg.ratio,
      toRatio: 1,
      needed: startProg.needed,
    });

    // Any full intermediate levels
    for (let L = startLevel + 1; L < endLevel; L++) {
      const needed = levelProgress(L, totalXpForUserLevel(L)).needed;
      phases.push({
        level: L,
        fromRatio: 0,
        toRatio: 1,
        needed,
      });
    }

    // Final partial
    phases.push({
      level: endLevel,
      fromRatio: 0,
      toRatio: endProg.ratio,
      needed: endProg.needed,
    });

    return phases;
  };

  const phases = useMemo(
    buildPhases,
    [startLevel, endLevel, startProg.needed, startProg.ratio, endProg.ratio, endProg.needed, xpGainNum]
  );

  /* ---------------------- Animation state/values ---------------------- */
  const [showEvents, setShowEvents] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(startLevel);
  const [displayNeeded, setDisplayNeeded] = useState(startProg.needed);
  const [displayXP, setDisplayXP] = useState(Math.round(startProg.ratio * startProg.needed));
  const [xpBarAnimated, setXpBarAnimated] = useState(false);

  const progress = useRef(new Animated.Value(phases[0]?.fromRatio ?? 0)).current;
  const widthInterpolation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  useEffect(() => {
    let isCancelled = false;

    const runPhase = (i: number) => {
      if (isCancelled || i >= phases.length) {
        if (xpGainNum > 0) addExperience(xpGainNum, true);

        const totalCoins =
          workoutEvents
            .filter((e) => e.type === "userLevelUp")
            .reduce((sum, e) => sum + (e.payload?.rewards?.coins || 0), 0) || 0;
        if (totalCoins > 0) addCurrency(totalCoins);

        setShowEvents(true);
        return;
      }

      const phase = phases[i];

      setDisplayLevel(phase.level);
      setDisplayNeeded(phase.needed);
      progress.setValue(phase.fromRatio);

      const sub = progress.addListener(({ value }) => {
        setDisplayXP(Math.round(value * phase.needed));
      });

      const distance = Math.max(0, phase.toRatio - phase.fromRatio);
      const base = 900;
      const duration = Math.max(250, base + distance * 1100);

      const willFinishALevel = phase.toRatio === 1 && distance > 0;
      if (willFinishALevel) hapticFeedback("success");

      Animated.timing(progress, {
        toValue: phase.toRatio,
        duration,
        useNativeDriver: false,
      }).start(() => {
        progress.removeListener(sub);
        setTimeout(() => runPhase(i + 1), 300);
      });
    };

    setXpBarAnimated(true);
    setTimeout(() => runPhase(0), 600);

    return () => {
      isCancelled = true;
    };
  }, [phases, xpGainNum, addExperience, addCurrency, workoutEvents, progress]);

  /* ----------------------- Exercise name helper ----------------------- */
  const getExerciseName = (id: number | string): string => {
    const meta = getExerciseMeta(id);
    return meta?.name || `Exercise ${id}`;
  };

  /* ------------------------------- UI -------------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingTop: 20 + insets.top,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-4xl mb-3">🎉</Text>
          <Text className="text-3xl font-pbold text-center" style={{ color: primaryColor }}>
            Workout Complete!
          </Text>
          <Text className="text-gray-100 text-center mt-2 text-lg">
            Amazing work! Keep building those gains.
          </Text>
        </View>

        {/* Summary */}
        <View
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: tertiaryColor,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <View className="flex-row justify-between mb-8">
            <View className="items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <MaterialCommunityIcons name="weight-lifter" size={28} color={primaryColor} />
              </View>
              <Text className="text-white text-xl font-pbold">{formattedVolume}</Text>
              <Text className="text-gray-100 text-sm">Total Volume</Text>
            </View>

            <View className="items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${secondaryColor}20` }}
              >
                <FontAwesome5 name="stopwatch" size={24} color={secondaryColor} />
              </View>
              <Text className="text-white text-xl font-pbold">{formatTime(elapsedNum)}</Text>
              <Text className="text-gray-100 text-sm">Duration</Text>
            </View>

            <View className="items-center flex-1">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <FontAwesome5 name="star" size={24} color={primaryColor} />
              </View>
              <Text className="text-white text-xl font-pbold">{xpGainNum}</Text>
              <Text className="text-gray-100 text-sm">XP Earned</Text>
            </View>
          </View>

          {/* XP Progress */}
          <View className="w-full">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-pbold text-lg">Level {displayLevel}</Text>
              <Text className="text-gray-100">
                {Math.round(displayXP)}/{Math.round(displayNeeded)} XP
              </Text>
            </View>

            {xpBarAnimated ? (
              <AnimatedProgressBar progress={widthInterpolation} color={primaryColor} />
            ) : (
              <ProgressBar ratio={startProg.ratio} color={primaryColor} />
            )}

            {endLevel > startLevel && xpBarAnimated && displayLevel === endLevel && (
              <Text className="text-center mt-3 font-pbold" style={{ color: primaryColor }}>
                🎉 Level Up! Welcome to level {endLevel}!
              </Text>
            )}
          </View>
        </View>

        {/* Muscle Group Gains */}
        {Object.keys(muscleCategoryGains).length > 0 && (
          <View
            className="rounded-2xl p-5 mb-6"
            style={{
              backgroundColor: tertiaryColor,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <Text className="text-white font-pbold text-xl mb-4">💪 Muscle Group Progress</Text>

            {Object.entries(muscleCategoryGains).map(([exerciseId, gains]) => {
              const exerciseName = getExerciseName(exerciseId);
              const ordered = CATEGORY_ORDER.filter((cat) => (gains?.[cat] || 0) > 0);
              if (ordered.length === 0) return null;

              return (
                <View key={exerciseId} className="mb-4 last:mb-0">
                  <Text className="text-white font-pmedium mb-3 text-lg">{exerciseName}</Text>
                  {ordered.map((cat) => (
                    <View
                      key={`${exerciseId}-${cat}`}
                      className="flex-row justify-between items-center py-3 px-4 mb-2 rounded-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">{MUSCLE_EMOJIS[cat] || "💪"}</Text>
                        <Text className="text-gray-100 font-pmedium">{CATEGORY_LABEL[cat]}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <FontAwesome5 name="star" size={14} color={primaryColor} />
                        <Text className="ml-2 font-pbold" style={{ color: primaryColor }}>
                          +{Math.round(gains?.[cat] || 0)} XP
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Events */}
        {showEvents && workoutEvents.length > 0 && (
          <View className="mb-6">
            <Text className="text-white font-pbold text-2xl mb-6 text-center">🏆 Achievements Unlocked!</Text>
            {workoutEvents.map((event, index) => (
              <EventCard
                key={`${event.type}-${event.id}-${index}`}
                event={event}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                tertiaryColor={tertiaryColor}
                index={index}
                convertWeight={convertWeight}
                unitSystem={unitSystem}
                getExerciseName={getExerciseName}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Continue */}
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