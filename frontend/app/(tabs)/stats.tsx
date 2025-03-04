// Path: /app/(tabs)/stats.tsx
import { View, StatusBar, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "@/components/TopBar";
import Tabs from "@/components/TabList";
import RadarChart from "@/components/stats/RadarChart";
import StatButtons from "@/components/stats/StatButtons";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserProgress } from "@/context/UserProgressContext";

const Stats = () => {
  // Only need theme and user level from contexts
  const { primaryColor, secondaryColor } = useThemeContext();
  const { level } = useUserProgress();
  
  type MuscleGroup =
    | "chest"
    | "back"
    | "shoulders"
    | "biceps"
    | "triceps"
    | "legs"
    | "core";

  type MuscleData = {
    [key in MuscleGroup]: number;
  };

  type MetricData = {
    volume: MuscleData;
    reps: MuscleData;
    sets: MuscleData;
    weight: MuscleData;
  };

  type MetricType = "volume" | "reps" | "sets" | "weight";

  const [activeMetric, setActiveMetric] = useState<MetricType>("volume");

  const [radarData] = useState<MetricData>({
    volume: {
      chest: 85,
      back: 70,
      shoulders: 60,
      biceps: 75,
      triceps: 65,
      legs: 90,
      core: 55,
    },
    reps: {
      chest: 65,
      back: 80,
      shoulders: 75,
      biceps: 90,
      triceps: 60,
      legs: 55,
      core: 80,
    },
    sets: {
      chest: 75,
      back: 65,
      shoulders: 80,
      biceps: 60,
      triceps: 85,
      legs: 75,
      core: 70,
    },
    weight: {
      chest: 90,
      back: 75,
      shoulders: 60,
      biceps: 55,
      triceps: 70,
      legs: 95,
      core: 40,
    },
  });

  const [displayData, setDisplayData] = useState<MuscleData>(radarData.volume);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMetricChange = (newMetric: MetricType) => {
    if (newMetric !== activeMetric && !isAnimating) {
      setIsAnimating(true);

      const startData = { ...displayData };
      const targetData = radarData[newMetric];

      setActiveMetric(newMetric);

      const duration = 500;
      const frames = 20;
      const frameTime = duration / frames;

      let currentFrame = 0;

      const animateValues = () => {
        currentFrame++;
        const progress = currentFrame / frames;
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const interpolatedData: MuscleData = {} as MuscleData;
        (Object.keys(startData) as MuscleGroup[]).forEach((muscle) => {
          interpolatedData[muscle] =
            startData[muscle] +
            (targetData[muscle] - startData[muscle]) * easedProgress;
        });

        setDisplayData(interpolatedData);

        if (currentFrame < frames) {
          setTimeout(animateValues, frameTime);
        } else {
          setIsAnimating(false);
          setDisplayData(targetData);
        }
      };

      setTimeout(animateValues, 0);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <TopBar subtext={`Level ${level}`} title="Your Stats" titleTop={true} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{
          paddingBottom: 10,
        }}
      >
        <Tabs<MetricType>
          tabs={["volume", "reps", "sets", "weight"]}
          activeTab={activeMetric}
          onTabChange={handleMetricChange}
          isAnimating={isAnimating}
          backgroundColor={primaryColor}
        />

        <RadarChart activeMetric={activeMetric} displayData={displayData} color={primaryColor} />

        <StatButtons color={primaryColor}/>
      </ScrollView>
    </View>
  );
};

export default Stats;