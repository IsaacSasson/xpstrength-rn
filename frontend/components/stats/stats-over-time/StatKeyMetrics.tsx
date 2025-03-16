import React from "react";
import { View, Text } from "react-native";
import StatCard from "./StatCard";
import { DataPoint } from "./ProgressLineChart";

// Format date string to display format
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface StatKeyMetricsProps {
  chartData: DataPoint[];
  color?: string;
  colorTwo?: string;
}

const StatKeyMetrics: React.FC<StatKeyMetricsProps> = ({
  chartData,
  color,
  colorTwo,
}) => {
  // Calculate key stats
  const calculateStats = () => {
    if (chartData.length === 0) return null;

    const values = chartData.map((point) => point.value);
    const first = values[0];
    const last = values[values.length - 1];
    const percentChange = ((last - first) / first) * 100;

    // Find max value and its index
    const maxValue = Math.max(...values);
    const maxIndex = values.indexOf(maxValue);
    const bestDate = chartData[maxIndex]?.date;

    // Check if the last two values indicate an upward trend
    const trend =
      values.length > 1 && values[values.length - 1] > values[values.length - 2]
        ? "Upward"
        : "Stable";

    // Calculate consistency (how often the value increased workout-to-workout)
    let increases = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increases++;
    }
    const consistency =
      values.length > 1
        ? Math.round((increases / (values.length - 1)) * 100)
        : 100;

    return {
      percentChange,
      bestDate: bestDate ? formatDisplayDate(bestDate) : "-",
      consistency,
      trend,
    };
  };

  // Get stats for display
  const stats = calculateStats();

  if (!stats) return null;

  return (
    <>
      <Text className="text-white text-xl font-psemibold mb-4">Key Stats</Text>
      <View className="flex-row flex-wrap">
        <StatCard
          title="Increase"
          value={`${stats.percentChange.toFixed(1)}%`}
          icon="chart-line"
          description="Overall Growth"
          color={color}
          colorTwo={colorTwo}
        />
        <StatCard
          title="Best Result"
          value={stats.bestDate}
          icon="trophy"
          description="Peak Performance"
          color={color}
          colorTwo={colorTwo}
        />
        <StatCard
          title="Consistency"
          value={`${stats.consistency}%`}
          icon="calendar-check"
          description="Improvement Rate"
          color={color}
          colorTwo={colorTwo}
        />
        <StatCard
          title="Current Trend"
          value={stats.trend}
          icon={stats.trend === "Upward" ? "arrow-up" : "arrows-alt-h"}
          description="Last 2 workouts"
          color={color}
          colorTwo={colorTwo}
        />
      </View>
    </>
  );
};

export default StatKeyMetrics;
