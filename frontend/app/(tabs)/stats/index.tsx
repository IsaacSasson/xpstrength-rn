import { View, StatusBar, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import Tabs from "@/components/TabList";
import RadarChart from "@/components/stats/RadarChart";
import StatButtons from "@/components/stats/StatButtons";
import Recovery from "@/components/stats/Recovery";
import { useThemeContext } from "@/context/ThemeContext";
import { useUserProgress } from "@/context/UserProvider";
import { useStats, MetricType, MuscleGroup } from "@/hooks/useStats";

type PageType = "overview" | "recovery";

const Stats = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const { level } = useUserProgress();
  const { getRadarData } = useStats();

  const [activePage, setActivePage] = useState<PageType>("overview");
  const [isPageAnimating, setIsPageAnimating] = useState(false);

  const [activeMetric, setActiveMetric] = useState<MetricType>("volume");
  const [displayData, setDisplayData] = useState<any>(null);
  const [isMetricAnimating, setIsMetricAnimating] = useState(false);

useEffect(() => {
  if (activePage === "overview" && !isMetricAnimating) {
    const radarData = getRadarData(activeMetric);
    if (radarData) setDisplayData(radarData);
  }
}, [activeMetric, activePage, isMetricAnimating]);

  const handlePageChange = (newPage: PageType) => {
    if (newPage !== activePage && !isPageAnimating) {
      setIsPageAnimating(true);
      setActivePage(newPage);
      setTimeout(() => setIsPageAnimating(false), 300);
    }
  };

  const handleMetricChange = (newMetric: MetricType) => {
  if (
    newMetric !== activeMetric &&
    !isMetricAnimating &&
    activePage === "overview"
  ) {
    setIsMetricAnimating(true);
    
    // Get the current data (what's currently displayed)
    const startData = { ...displayData };
    
    // Get the target data for the new metric
    const targetData = getRadarData(newMetric);
    
    // Set activeMetric immediately so tab selection updates right away
    setActiveMetric(newMetric);
    
    const duration = 200;
    const frames = 30; // Increased frames for smoother animation
    const frameTime = duration / frames;
    let currentFrame = 0;

    const animateValues = () => {
      currentFrame++;
      const progress = currentFrame / frames;
      
      // Use a smoother easing function
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const interpolated: any = {};
      if (startData && targetData) {
        (Object.keys(startData) as MuscleGroup[]).forEach((m) => {
          interpolated[m] = startData[m] + (targetData[m] - startData[m]) * eased;
        });
      }

      // Update display data with interpolated values
      setDisplayData(interpolated);

      if (currentFrame < frames) {
        // Use requestAnimationFrame for smoother animation
        requestAnimationFrame(() => setTimeout(animateValues, frameTime));
      } else {
        // Animation complete - set final data and clear animation state
        setDisplayData(targetData);
        setIsMetricAnimating(false);
      }
    };

    // Start animation immediately
    animateValues();
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      <TopBar subtext={`Level ${level}`} title="Your Stats" titleTop />

      {/* Page tabs (Overview / Recovery) */}
      <View className="px-4">
        <Tabs<PageType>
          tabs={["overview", "recovery"]}
          activeTab={activePage}
          onTabChange={handlePageChange}
          isAnimating={isPageAnimating}
          backgroundColor={primaryColor}
        />
      </View>

      {/* Content area */}
      {activePage === "overview" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-4"
          contentContainerStyle={{ paddingBottom: 10 }}
          style={{ flex: 1 }}
        >
          <Tabs<MetricType>
            tabs={["volume", "reps", "sets", "weight"]}
            activeTab={activeMetric}
            onTabChange={handleMetricChange}
            isAnimating={isMetricAnimating}
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
      ) : (
        // Recovery: full-screen (no scroll)
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 10 }}>
          <Recovery color={primaryColor} tertiaryColor={tertiaryColor} />
        </View>
      )}
    </View>
  );
};

export default Stats;
