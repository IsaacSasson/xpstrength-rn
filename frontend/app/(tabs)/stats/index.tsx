// Path: /app/(tabs)/stats.tsx
import { View, StatusBar, ScrollView, Text } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "@/components/TopBar";
import Tabs from "@/components/TabList";
import RadarChart from "@/components/stats/RadarChart";
import StatButtons from "@/components/stats/StatButtons";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserProgress } from "@/context/UserProvider";
import { useStats, MetricType, MuscleGroup } from "@/hooks/useStats"; // Import our custom hook

const Stats = () => {
  // Get theme and user level from contexts
  const { primaryColor, tertiaryColor } = useThemeContext();
  const { level } = useUserProgress();

  // Use our custom hook for stats data
  const { getRadarData, loading, error } = useStats();

  const [activeMetric, setActiveMetric] = useState<MetricType>("volume");
  const [displayData, setDisplayData] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Update display data when active metric changes or when loading completes
  useEffect(() => {
    if (!loading) {
      const radarData = getRadarData(activeMetric);
      if (radarData) {
        setDisplayData(radarData);
      }
    }
  }, [activeMetric, loading]);

  const handleMetricChange = (newMetric: MetricType) => {
    if (newMetric !== activeMetric && !isAnimating) {
      setIsAnimating(true);

      const startData = { ...displayData };
      const targetData = getRadarData(newMetric);

      setActiveMetric(newMetric);

      const duration = 500;
      const frames = 20;
      const frameTime = duration / frames;

      let currentFrame = 0;

      const animateValues = () => {
        currentFrame++;
        const progress = currentFrame / frames;
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const interpolatedData: any = {};
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

  // If loading or error, show appropriate UI
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F0E1A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text className="text-white font-pmedium">Loading your stats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0F0E1A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text className="text-white font-pmedium">{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar subtext={`Level ${level}`} title="Your Stats" titleTop={true} />

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

        {displayData && (
          <RadarChart
            activeMetric={activeMetric}
            displayData={displayData}
            color={primaryColor}
          />
        )}

        <StatButtons color={primaryColor} tertiaryColor={tertiaryColor} />
      </ScrollView>
    </View>
  );
};

export default Stats;
