import React, { useMemo } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import type { PastWorkout } from "./workout-history";
import pfptest from "@/assets/images/favicon.png";
import Header from "@/components/Header";

/* ------------------------------------------------------------------ */
/*                               Helpers                               */
/* ------------------------------------------------------------------ */
interface SetSummary {
  reps: number;
  lbs: number;
  isPR?: boolean;
}
interface ExerciseDetailed {
  id?: string;
  name: string;
  sets: SetSummary[];
}

const decodeWorkoutParam = (raw: unknown): PastWorkout | null => {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as PastWorkout;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.date === "string" &&
      typeof parsed.duration === "string" &&
      Array.isArray(parsed.exercises)
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatTimeFromSeconds = (sec: number) =>
  `${Math.floor(sec / 60)}m ${sec % 60}s`;

const ProgressBar: React.FC<{
  progress: number;
  total: number;
  color: string;
}> = ({ progress, total, color }) => {
  const ratio = Math.min(progress / (total || 1), 1);
  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <View
        className="h-full"
        style={{ width: `${ratio * 100}%`, backgroundColor: color }}
      />
    </View>
  );
};

const normalizeExercises = (exs: any[]): ExerciseDetailed[] => {
  return exs.map((ex, i) => {
    if (Array.isArray(ex.sets) && typeof ex.sets[0] === "object") {
      return ex as ExerciseDetailed;
    }
    const count = Number(ex.sets) || 0;
    const repsEach = Number(ex.reps) || 0;
    const lbsEach = Number(ex.lbs) || 0;

    return {
      id: String(i),
      name: ex.name ?? `Exercise ${i + 1}`,
      sets: Array.from({ length: count }).map(() => ({
        reps: repsEach,
        lbs: lbsEach,
      })),
    };
  });
};

const calcTotals = (exs: ExerciseDetailed[]) => {
  let sets = 0;
  let volume = 0;
  exs.forEach((ex) => {
    ex.sets.forEach((s) => {
      sets += 1;
      volume += (s.lbs || 0) * (s.reps || 0); // lbs * reps
    });
  });
  return { sets, volume }; // volume in lbs
};

/* ------------------------------------------------------------------ */
/*                             Main Screen                             */
/* ------------------------------------------------------------------ */
const WorkoutDetails: React.FC = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const { convertWeight, formatWeight, unitSystem } = useWorkouts();
  const params = useLocalSearchParams<{ workout?: string }>();

  const workout = useMemo(() => decodeWorkoutParam(params.workout), [params]);

  if (!workout) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F0E1A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <Text className="text-white font-pmedium mb-4">
          Workout data not found.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Text className="text-white font-pmedium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const detailedExercises = normalizeExercises(workout.exercises);
  const { sets: totalSets, volume: totalVolumeLbs } =
    calcTotals(detailedExercises);

  // Consistent display for total volume
  const formattedTotalVolume = formatWeight(
    convertWeight(totalVolumeLbs, "imperial", unitSystem),
    unitSystem
  );

  const durationMatch = workout.duration.match(/(\d+)m\s*(\d+)s/i);
  const durationSeconds = durationMatch
    ? Number(durationMatch[1]) * 60 + Number(durationMatch[2])
    : NaN;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <Header MText={workout.name} SText="" />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pb-8">
        {/* ---------- Summary Card ---------- */}
        <View
          className="rounded-2xl p-5 mt-2 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
            <View className="mb-4 flex-row justify-between items-center">
            <Text
              className="text-white font-psemibold text-lg"
              style={{ color: primaryColor }}
            >
              Workout Summary
            </Text>
            <Text className="text-gray-100 text-xs">
              {formatDate(workout.date)}
            </Text>
            </View>

          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <MaterialCommunityIcons
                name="weight-lifter"
                size={22}
                color={primaryColor}
              />
              <Text className="text-white mt-1 font-pmedium">
                {formattedTotalVolume}
              </Text>
              <Text className="text-gray-100 text-xs">Total Volume</Text>
            </View>

            <View className="items-center flex-1">
              <FontAwesome5 name="stopwatch" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">
                {Number.isNaN(durationSeconds)
                  ? workout.duration
                  : formatTimeFromSeconds(durationSeconds)}
              </Text>
              <Text className="text-gray-100 text-xs">Time</Text>
            </View>

            <View className="items-center flex-1">
              <FontAwesome5 name="dumbbell" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">{totalSets}</Text>
              <Text className="text-gray-100 text-xs">Total Sets</Text>
            </View>
          </View>
        </View>

        {/* ---------- Exercise Breakdown ---------- */}
        <Text className="text-white font-psemibold text-lg mb-3">
          Exercise Breakdown
        </Text>

        {detailedExercises.map((ex, i) => (
          <View
            key={`${workout.id}_ex_${i}`}
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: tertiaryColor }}
          >
            <Text
              className="font-pbold text-center text-xl mb-4"
              style={{ color: secondaryColor }}
            >
              {ex.name}
            </Text>

            {ex.sets.map((set, idx) => {
              const convertedWeight = convertWeight(
                set.lbs,
                "imperial",
                unitSystem
              );
              const formattedWeight =
                unitSystem === "metric"
                  ? `${convertedWeight.toFixed(1)} kg`
                  : `${Math.round(convertedWeight)} lbs`;

              return (
                <View
                  key={idx}
                  className="flex-row justify-between py-1 border-b border-black-200 last:border-0"
                >
                  <Text className="text-gray-100">Set {idx + 1}</Text>
                  <Text className="text-gray-100">{set.reps} reps</Text>
                  <Text className="text-gray-100">{formattedWeight}</Text>
                  {set.isPR && (
                    <FontAwesome5
                      name="trophy"
                      size={14}
                      color={primaryColor}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default WorkoutDetails;
