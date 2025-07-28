import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import pfptest from "@/assets/images/favicon.png";

/* ------------------------------------------------------------------ */
/*                           Types & Helpers                          */
/* ------------------------------------------------------------------ */
interface SetSummary {
  reps: number;
  lbs: number;
  isPR?: boolean;
}
interface ExerciseSummary {
  id: string;
  name: string;
  sets: SetSummary[];
}

const formatTime = (sec: number) => `${Math.floor(sec / 60)}m ${sec % 60}s`;

const ProgressBar: React.FC<{
  progress: number;
  total: number;
  color: string;
}> = ({ progress, total, color }) => {
  const ratio = Math.min(progress / total, 1);
  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <View
        className="h-full"
        style={{ width: `${ratio * 100}%`, backgroundColor: color }}
      />
    </View>
  );
};

/* ------------------------------------------------------------------ */
/*                           Main Screen                              */
/* ------------------------------------------------------------------ */
const FinishedWorkout = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const insets = useSafeAreaInsets();

  /* ------------------- params (mock fallback) ------------------- */
  const {
    volume = "8500", // in lbs
    elapsed = "780", // seconds
    xpGained = "120",
    level = "12",
    xp = "2863",
    xpNext = "5000",
    /* achievements prog example: [{id:'streak',title:'7-Day Streak',icon:'fire',prev:3,now:4}] */
    ach = "[]",
    ex = "[]", // exercises JSON
  } = useLocalSearchParams<{
    volume?: string;
    elapsed?: string;
    xpGained?: string;
    level?: string;
    xp?: string;
    xpNext?: string;
    ach?: string;
    ex?: string;
  }>();

  /* parse */
  const levelNum = Number(level);
  const xpNum = Number(xp);
  const xpNextNum = Number(xpNext);
  const xpGainNum = Number(xpGained);
  const volumeNum = Number(volume);
  const elapsedNum = Number(elapsed);
  const achievements: {
    id: string;
    title: string;
    icon: string;
    prev: number;
    now: number;
    target?: number;
  }[] = JSON.parse(ach as string);
  const exercises: ExerciseSummary[] = JSON.parse(ex as string);

  /* ---------------------------------------------------------------- */

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <View className="px-4 pb-4">
        {/* ---------- Summary Card ---------- */}
        <View
          className="rounded-2xl p-5 mt-20 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-center mb-4">
            <Image
              source={pfptest}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                marginRight: 12,
              }}
            />
            <View>
              <Text
                className="text-white font-psemibold text-lg"
                style={{ color: primaryColor }}
              >
                Workout Complete!
              </Text>
              <Text className="text-gray-100 text-xs">
                Great job — keep the streak alive!
              </Text>
            </View>
          </View>

          {/* quick stats */}
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <MaterialCommunityIcons
                name="weight-lifter"
                size={22}
                color={primaryColor}
              />
              <Text className="text-white mt-1 font-pmedium">
                {volumeNum.toLocaleString()} lbs
              </Text>
              <Text className="text-gray-100 text-xs">Total Volume</Text>
            </View>
            <View className="items-center flex-1">
              <FontAwesome5 name="stopwatch" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">
                {formatTime(elapsedNum)}
              </Text>
              <Text className="text-gray-100 text-xs">Time</Text>
            </View>
            <View className="items-center flex-1">
              <FontAwesome5 name="star" size={20} color={primaryColor} />
              <Text className="text-white mt-1 font-pmedium">{xpGainNum}</Text>
              <Text className="text-gray-100 text-xs">XP Gained</Text>
            </View>
          </View>

          {/* XP bar to next level */}
          <View className="mt-4 w-full">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white">Level {levelNum}</Text>
              <Text className="text-gray-100">
                {xpNum + xpGainNum}/{xpNextNum} XP
              </Text>
            </View>
            <ProgressBar
              progress={xpNum + xpGainNum}
              total={xpNextNum}
              color={primaryColor}
            />
          </View>
        </View>

        {/* ---------- Achievement Progress ---------- */}
        {achievements.length > 0 && (
          <>
            <Text className="text-white font-psemibold text-lg mb-3">
              Achievement Progress
            </Text>
            <View
              className="rounded-2xl p-4 mb-6"
              style={{ backgroundColor: tertiaryColor }}
            >
              {achievements.map((a) => {
                const prog = a.target ? Math.min(a.now / a.target, 1) : 1;
                return (
                  <View key={a.id} className="mb-4 last:mb-0">
                    <View className="flex-row items-center mb-1">
                      <FontAwesome5
                        name={a.icon as any}
                        size={18}
                        color={primaryColor}
                      />
                      <Text className="text-white ml-2 font-pmedium">
                        {a.title}
                      </Text>
                      <Text className="text-gray-100 ml-auto text-xs">
                        {a.now}/{a.target ?? "-"}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={a.now}
                      total={a.target ?? a.now}
                      color={primaryColor}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        >
          {/* ---------- Exercise Breakdown ---------- */}
          <Text className="text-white font-psemibold text-lg mb-3">
            Exercise Breakdown
          </Text>
          {exercises.map((ex) => (
            <View
              key={ex.id}
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: tertiaryColor }}
            >
              <Text
                className="font-pbold text-center text-xl mb-4"
                style={{ color: secondaryColor }}
              >
                {ex.name}
              </Text>

              {ex.sets.map((set, idx) => (
                <View
                  key={idx}
                  className="flex-row justify-between py-1 border-b border-black-200 last:border-0"
                >
                  <Text className="text-gray-100">Set {idx + 1}</Text>
                  <Text className="text-gray-100">{set.reps} reps</Text>
                  <Text className="text-gray-100">{set.lbs} lbs</Text>
                  {set.isPR && (
                    <FontAwesome5
                      name="trophy"
                      size={14}
                      color={primaryColor}
                    />
                  )}
                </View>
              ))}
            </View>
          ))}

          {/* ---------- Footer Buttons ---------- */}
          <View className="mb-10 mx-28 mt-4 flex-row justify-between">
            <TouchableOpacity
              onPress={() => router.replace("/home")}
              className="flex-1 mx-50 ml-2 py-4 rounded-xl items-center"
              style={{
                backgroundColor: primaryColor,
                shadowColor: primaryColor,
                shadowOpacity: 0.4,
                shadowRadius: 13,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text className="text-white font-pbold text-lg">Continue</Text>
            </TouchableOpacity>
          </View>

          {/* extra spacer so you can scroll past the button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </View>
  );
};

export default FinishedWorkout;
