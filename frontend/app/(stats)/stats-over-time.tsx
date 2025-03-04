import React, { useState, useEffect } from 'react';
import { View, StatusBar, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Tabs from '@/components/TabList';

// Import our custom components
import ProgressLineChart, { MetricType, DataPoint } from '@/components/stats/stats-over-time/ProgressLineChart';
import StatKeyMetrics from '@/components/stats/stats-over-time/StatKeyMetrics';
import WorkoutSuggestions from '@/components/stats/stats-over-time/WorkoutSuggestions';
import MuscleGroupSelector from '@/components/stats/stats-over-time/MuscleGroupSelector';
import DataPointSelector from '@/components/stats/stats-over-time/DataPointSelector';
import { generateMockData, WorkoutData } from '@/components/stats/stats-over-time/StatsDataService';

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
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  
  // Generate mock data on component mount
  useEffect(() => {
    setLoading(true);
    // Simulate API request delay
    setTimeout(() => {
      const data = generateMockData();
      setWorkoutData(data);
      setLoading(false);
    }, 500);
  }, []);
  
  // Update chart data when workout data, active metric, or number of data points changes
  useEffect(() => {
    if (workoutData) {
      const metricData = workoutData[activeMetric];
      
      // Get the most recent X data points
      const numPoints = Math.min(dataPoints, metricData.length);
      const recentData = metricData.slice(-numPoints);
      
      setChartData(recentData);
    }
  }, [workoutData, activeMetric, dataPoints]);
  
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
        />
        
        {/* Muscle Group Selection */}
        <MuscleGroupSelector 
          activeMuscle={activeMuscle}
          handleMuscleChange={handleMuscleChange}
          muscleGroups={muscleGroups}
        />
        
        {/* Data Points Selector */}
        <DataPointSelector 
          dataPoints={dataPoints}
          handleDataPointsChange={handleDataPointsChange}
        />
        
        {/* Progress Chart */}
        <ProgressLineChart 
          chartData={chartData}
          loading={loading}
          activeMetric={activeMetric}
        />
        
        {/* Key Stats Section */}
        <StatKeyMetrics chartData={chartData} />
        
        {/* Suggestions Section */}
        <WorkoutSuggestions 
          activeMetric={activeMetric}
          activeMuscle={activeMuscle}
        />
      </ScrollView>
    </View>
  );
};

export default StatsOverTime;