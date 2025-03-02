import { View, StatusBar, ScrollView, Platform } from "react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import TopBar from "@/components/TopBar";
import Tabs from "@/components/TabList"; // Updated import
import RadarChart from "@/components/stats/RadarChart";
import StatButtons from "@/components/stats/StatButtons";

const Stats = () => {
  // Get safe area insets to calculate proper padding
  const insets = useSafeAreaInsets();

  // Define types for our data structure
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

  // Define type for our metrics
  type MetricType = "volume" | "reps" | "sets" | "weight";

  // State for active metric
  const [activeMetric, setActiveMetric] = useState<MetricType>("volume");

  // State for radar chart data based on metrics
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

  // State for the current displayed data (for animation)
  const [displayData, setDisplayData] = useState<MuscleData>(radarData.volume);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle switching between metrics
  const handleMetricChange = (newMetric: MetricType) => {
    if (newMetric !== activeMetric && !isAnimating) {
      setIsAnimating(true);

      const startData = { ...displayData };
      const targetData = radarData[newMetric];

      // Update active metric for UI
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

  const statButtons = [
    {
      title: "Personal Bests",
      icon: "trophy",
      onPress: () => console.log("Navigate to Personal Bests"),
    },
    {
      title: "Workout History",
      icon: "history",
      onPress: () => console.log("Navigate to Workout History"),
    },
    {
      title: "Stats Over Time",
      icon: "chart-line",
      onPress: () => console.log("Navigate to Stats Over Time"),
    },
    {
      title: "Goals & Achievements",
      icon: "medal",
      onPress: () => console.log("Navigate to Goals"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <TopBar subtext="Level 100" title="Your Stats" titleTop={true} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{
          paddingBottom: 10,
        }}
      >
        {/* Use the generic Tabs component with MetricType */}
        <Tabs<MetricType>
          tabs={["volume", "reps", "sets", "weight"]}
          activeTab={activeMetric}
          onTabChange={handleMetricChange}
          isAnimating={isAnimating}
        />

        <RadarChart activeMetric={activeMetric} displayData={displayData} />

        <StatButtons buttons={statButtons} />
      </ScrollView>
    </View>
  );
};

export default Stats;
