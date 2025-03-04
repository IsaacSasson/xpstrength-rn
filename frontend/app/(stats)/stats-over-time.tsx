import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StatusBar, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LineChart } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import Tabs from '@/components/TabList';

// Mock data for progress over time
const generateMockData = (metric: string, weeks: number = 12) => {
  let baseValue: number;
  let growth: number;
  let variation: number;

  // Set different starting points and growth rates based on metric
  switch(metric) {
    case 'strength':
      baseValue = 100;
      growth = 3;
      variation = 5;
      break;
    case 'volume':
      baseValue = 1500;
      growth = 50;
      variation = 100;
      break;
    case 'workouts':
      baseValue = 3;
      growth = 0.1;
      variation = 0.5;
      break;
    case 'weight':
      baseValue = 185;
      growth = 0.5;
      variation = 1.5;
      break;
    default:
      baseValue = 100;
      growth = 2;
      variation = 10;
  }

  return Array.from({ length: weeks }).map((_, index) => {
    // Add some randomness to simulate real data
    const randomFactor = Math.random() * variation * 2 - variation;
    // Smooth upward progression with random variations
    const value = baseValue + (growth * index) + randomFactor;
    // Ensure values are positive
    return Math.max(0, value);
  });
};

// Generate labels for the X-axis (weeks)
const generateWeekLabels = (weeks: number = 12) => {
  return Array.from({ length: weeks }).map((_, index) => `Week ${index + 1}`);
};

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

const StatsOverTime = () => {
  const [activeMetric, setActiveMetric] = useState<string>('strength');
  const [activeMuscle, setActiveMuscle] = useState<string>('All Muscles');
  const [graphData, setGraphData] = useState<number[]>([]);
  const [weekLabels, setWeekLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Screen dimensions for responsive sizing
  const screenWidth = Dimensions.get('window').width;
  
  // Update graph data when metrics or muscle selection changes
  useEffect(() => {
    setLoading(true);
    
    // Simulate API request delay
    setTimeout(() => {
      const data = generateMockData(activeMetric);
      const labels = generateWeekLabels();
      
      setGraphData(data);
      setWeekLabels(labels);
      setLoading(false);
    }, 500);
    
    // In a real implementation, you would fetch actual data from your backend:
    /*
    try {
      const response = await fetch('your-api-endpoint');
      const data = await response.json();
      setGraphData(data.values);
      setWeekLabels(data.labels);
    } catch (error) {
      console.error('Error fetching stats data:', error);
    } finally {
      setLoading(false);
    }
    */
  }, [activeMetric, activeMuscle]);
  
  // Handle going back
  const goBack = () => {
    router.back();
  };
  
  // Handle metric tab change
  const handleMetricChange = (metric: string) => {
    setActiveMetric(metric);
  };
  
  // Handle muscle group selection
  const handleMuscleChange = (muscle: string) => {
    setActiveMuscle(muscle);
  };
  
  // Format y-axis values based on active metric
  const formatYAxis = (value: number) => {
    switch(activeMetric) {
      case 'strength':
        return `${Math.round(value)}`;
      case 'volume':
        return `${Math.round(value)}`;
      case 'workouts':
        return `${value.toFixed(1)}`;
      case 'weight':
        return `${Math.round(value)}`;
      default:
        return `${Math.round(value)}`;
    }
  };
  
  // Get the appropriate y-axis label based on active metric
  const getYAxisLabel = () => {
    switch(activeMetric) {
      case 'strength':
        return 'Strength (1RM)';
      case 'volume':
        return 'Volume (lbs)';
      case 'workouts':
        return 'Workouts/Week';
      case 'weight':
        return 'Weight (lbs)';
      default:
        return 'Value';
    }
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
          tabs={['strength', 'volume', 'workouts', 'weight']}
          activeTab={activeMetric}
          onTabChange={handleMetricChange}
        />
        
        {/* Muscle Group Selection */}
        <View className="mb-6">
          <Text className="text-white font-pmedium mb-3">Muscle Group</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {muscleGroups.map((muscle) => (
              <TouchableOpacity
                key={muscle}
                onPress={() => handleMuscleChange(muscle)}
                className={`px-4 py-2 mr-2 rounded-full ${
                  activeMuscle === muscle ? 'bg-secondary' : 'bg-black-100'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-pmedium ${
                    activeMuscle === muscle ? 'text-white' : 'text-gray-100'
                  }`}
                >
                  {muscle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Chart */}
        <View className="bg-black-100 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-psemibold">
              {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Progress
            </Text>
            <View className="bg-black-200 px-3 py-1 rounded-lg">
              <Text className="text-secondary-100 font-pmedium text-sm">
                Last 12 weeks
              </Text>
            </View>
          </View>
          
          {loading ? (
            <View className="h-64 items-center justify-center">
              <ActivityIndicator size="large" color="#A742FF" />
              <Text className="text-gray-100 mt-2">Loading data...</Text>
            </View>
          ) : (
            <View>
              {/* Y-axis label */}
              <View className="absolute left-0 h-full justify-center z-10">
                <View className="rotate-270 mb-20">
                  <Text className="text-gray-100 text-xs">{getYAxisLabel()}</Text>
                </View>
              </View>
              
              {/* Chart */}
              <View className="ml-8">
                <LineChart
                  style={{ height: 250 }}
                  data={graphData}
                  contentInset={{ top: 20, bottom: 20, left: 10, right: 10 }}
                  curve={shape.curveLinear}
                  svg={{ 
                    stroke: '#A742FF',
                    strokeWidth: 3,
                  }}
                />
                
                {/* Overlay line for grid lines */}
                <View 
                  className="absolute h-full w-full"
                  style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View 
                      key={i} 
                      className="border-t border-black-200 border-dashed" 
                      style={{ 
                        position: 'absolute', 
                        top: `${20 + (i * 52.5)}px`, 
                        left: 0, 
                        right: 0 
                      }}
                    />
                  ))}
                </View>
                
                {/* Y-axis values */}
                <View className="absolute left-0 h-full justify-between py-5">
                  {graphData.length > 0 && 
                    [0, 1, 2, 3, 4].map((i) => {
                      const min = Math.min(...graphData);
                      const max = Math.max(...graphData);
                      const range = max - min;
                      const value = max - (range * i / 4);
                      return (
                        <Text key={i} className="text-gray-100 text-xs">
                          {formatYAxis(value)}
                        </Text>
                      );
                    })
                  }
                </View>
              </View>
              
              {/* X-axis labels */}
              <View className="flex-row justify-between mt-2 pl-8">
                {weekLabels.filter((_, i) => i % 3 === 0 || i === weekLabels.length - 1).map((label, index, filteredArr) => (
                  <Text key={index} className="text-gray-100 text-xs" style={{ width: screenWidth / (filteredArr.length + 1), textAlign: 'center' }}>
                    {label.replace('Week ', 'W')}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>
        
        {/* Key Stats Section */}
        <Text className="text-white text-xl font-psemibold mb-4">
          Key Stats
        </Text>
        <View className="flex-row flex-wrap">
          <StatCard 
            title="Increase" 
            value={graphData.length > 0 ? `${((graphData[graphData.length - 1] - graphData[0]) / graphData[0] * 100).toFixed(1)}%` : '0%'} 
            icon="chart-line"
            description="Overall" 
          />
          <StatCard 
            title="Best Week" 
            value={graphData.length > 0 ? `Week ${graphData.indexOf(Math.max(...graphData)) + 1}` : '-'} 
            icon="trophy"
            description="Peak Performance" 
          />
          <StatCard 
            title="Consistency" 
            value={`${Math.round(Math.random() * 40 + 60)}%`} 
            icon="calendar-check"
            description="Training" 
          />
          <StatCard 
            title="Current Trend" 
            value={graphData.length > 0 && graphData[graphData.length - 1] > graphData[graphData.length - 2] ? 'Upward' : 'Stable'} 
            icon={graphData.length > 0 && graphData[graphData.length - 1] > graphData[graphData.length - 2] ? 'arrow-up' : 'arrows-alt-h'}
            description="Last 2 weeks" 
          />
        </View>
        
        {/* Suggestions Section */}
        <Text className="text-white text-xl font-psemibold mt-6 mb-4">
          Suggestions
        </Text>
        <View className="bg-black-100 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start mb-4">
            <View className="bg-secondary h-10 w-10 rounded-full items-center justify-center mr-3">
              <FontAwesome5 name="lightbulb" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-pmedium">Increase Training Frequency</Text>
              <Text className="text-gray-100">Add one more training day per week to accelerate your {activeMetric} gains.</Text>
            </View>
          </View>
          
          <View className="flex-row items-start">
            <View className="bg-black-200 h-10 w-10 rounded-full items-center justify-center mr-3">
              <FontAwesome5 name="dumbbell" size={18} color="#A742FF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-pmedium">Progressive Overload</Text>
              <Text className="text-gray-100">Try increasing weights by 5% next week to challenge your {activeMuscle.toLowerCase()} muscles.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon,
  description 
}) => {
  return (
    <View className="w-1/2 p-2">
      <View className="bg-black-100 rounded-xl p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-100 font-pmedium">{title}</Text>
          <FontAwesome5 name={icon} size={16} color="#A742FF" />
        </View>
        <Text className="text-white text-xl font-psemibold mb-1">{value}</Text>
        <Text className="text-gray-100 text-xs">{description}</Text>
      </View>
    </View>
  );
};

export default StatsOverTime;