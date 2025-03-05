// Path: /app/(stats)/stats-over-time.tsx
import React, { useState, useEffect } from 'react';
import { View, StatusBar, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import Tabs from '@/components/TabList';
import ProgressLineChart, { MetricType, DataPoint } from '@/components/stats/stats-over-time/ProgressLineChart';
import StatKeyMetrics from '@/components/stats/stats-over-time/StatKeyMetrics';
import WorkoutSuggestions from '@/components/stats/stats-over-time/WorkoutSuggestions';
import MuscleGroupSelector from '@/components/stats/stats-over-time/MuscleGroupSelector';
import DataPointSelector from '@/components/stats/stats-over-time/DataPointSelector';

import { useThemeContext } from '@/context/ThemeContext';
import { useStats } from '@/hooks/useStats';

// Mock data for muscle groups
const muscleGroups = [
  'All Muscles',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core'
];

const StatsOverTime: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('volume');
  const [activeMuscle, setActiveMuscle] = useState<string>('All Muscles');
  const [dataPoints, setDataPoints] = useState<number>(10);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  
  const { primaryColor, secondaryColor } = useThemeContext();
  const { getProgressData, loading } = useStats();
  
  // Update chart data when active metric, data points or loading state changes
  useEffect(() => {
    if (!loading) {
      // Get the time series data for the selected metric and number of points
      const data = getProgressData(activeMetric, dataPoints);
      setChartData(data);
    }
  }, [activeMetric, dataPoints, loading]);
  
  // Handle going back
  const goBack = () => {
    router.back();
  };
  
  // Handle metric tab change
  const handleMetricChange = (metric: string) => {
    setActiveMetric(metric as MetricType);
  };
  
  // Handle muscle group selection
  const handleMuscleChange = (muscle: string) => {
    setActiveMuscle(muscle);
  };
  
  // Handle number of data points change
  const handleDataPointsChange = (points: number) => {
    setDataPoints(points);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={goBack} className="mr-4">
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-psemibold text-white">
                Stats Over Time
              </Text>
              <Text className="font-pmedium text-sm text-gray-100">
                Track your progress
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4 pt-2 pb-6"
      >
        {/* Metric Tabs */}
        <Tabs
          tabs={['volume', 'reps', 'sets', 'weight']}
          activeTab={activeMetric}
          onTabChange={handleMetricChange}
          backgroundColor={primaryColor}
        />
        
        {/* Muscle Group Selection */}
        <MuscleGroupSelector 
          activeMuscle={activeMuscle}
          handleMuscleChange={handleMuscleChange}
          muscleGroups={muscleGroups}
          backgroundColor={primaryColor}
        />
        
        {/* Data Points Selector */}
        <DataPointSelector 
          dataPoints={dataPoints}
          handleDataPointsChange={handleDataPointsChange}
          backgroundColor={primaryColor}
        />
        
        {/* Progress Chart */}
        <ProgressLineChart 
          chartData={chartData}
          loading={loading}
          activeMetric={activeMetric}
          color={primaryColor}
          colorTwo={secondaryColor}
        />
        
        {/* Key Stats Section */}
        <StatKeyMetrics chartData={chartData} color={primaryColor}/>
        
        {/* Suggestions Section */}
        <WorkoutSuggestions 
          activeMetric={activeMetric}
          activeMuscle={activeMuscle}
          color={primaryColor}
        />
      </ScrollView>
    </View>
  );
};

export default StatsOverTime;