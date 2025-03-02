import { 
  View, 
  StatusBar,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  FlatList
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import CustomButton from '@/components/CustomButton';
import Svg, { Polygon, Line, Circle, Text as SvgText, LinearGradient, Stop } from 'react-native-svg';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const Stats = () => {
  // Define types for our data structure
  type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core';
  
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
  type MetricType = 'volume' | 'reps' | 'sets' | 'weight';
  
  // State for active tab
  const [activeMetric, setActiveMetric] = useState<MetricType>('volume');
  
  // State for radar chart data based on metrics
  const [radarData] = useState<MetricData>({
    volume: {
      chest: 85,
      back: 70,
      shoulders: 60,
      biceps: 75,
      triceps: 65,
      legs: 90,
      core: 55
    },
    reps: {
      chest: 65,
      back: 80,
      shoulders: 75,
      biceps: 90,
      triceps: 60,
      legs: 55,
      core: 80
    },
    sets: {
      chest: 75,
      back: 65,
      shoulders: 80,
      biceps: 60,
      triceps: 85,
      legs: 75,
      core: 70
    },
    weight: {
      chest: 90,
      back: 75,
      shoulders: 60,
      biceps: 55,
      triceps: 70,
      legs: 95,
      core: 40
    }
  });

  // State for the current displayed data (for animation)
  const [displayData, setDisplayData] = useState<MuscleData>(radarData.volume);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle switching between metrics
  const handleMetricChange = (newMetric: MetricType) => {
    if (newMetric !== activeMetric && !isAnimating) {
      setIsAnimating(true);
      
      // Store the initial and target data
      const startData = { ...displayData };
      const targetData = radarData[newMetric];
      
      // Set the active metric immediately for the tabs UI
      setActiveMetric(newMetric);
      
      // Animation timing
      const duration = 500;
      const frames = 20; // Number of animation frames
      const frameTime = duration / frames;
      
      // Animate between the values
      let currentFrame = 0;
      
      const animateValues = () => {
        currentFrame++;
        const progress = currentFrame / frames;
        
        // Use an easing function (ease-out cubic)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        // Calculate interpolated values for each muscle group
        const interpolatedData: MuscleData = {} as MuscleData;
        
        (Object.keys(startData) as MuscleGroup[]).forEach(muscle => {
          interpolatedData[muscle] = startData[muscle] + 
            (targetData[muscle] - startData[muscle]) * easedProgress;
        });
        
        // Update the display data
        setDisplayData(interpolatedData);
        
        // Continue animation until we reach the end
        if (currentFrame < frames) {
          setTimeout(animateValues, frameTime);
        } else {
          // Animation complete
          setIsAnimating(false);
          // Set to exact final values
          setDisplayData(targetData);
        }
      };
      
      // Start the animation
      setTimeout(animateValues, 0);
    }
  };

  // Get screen width for responsive sizing
  const screenWidth = Dimensions.get('window').width;
  const chartSize = screenWidth * 0.85;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;
  const radius = chartSize * 0.4;
  
  // Function to calculate point coordinates on the radar chart
  const calculatePoint = (index: number, total: number, value: number): { x: number; y: number } => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const x = centerX + (radius * value / 100) * Math.cos(angle);
    const y = centerY + (radius * value / 100) * Math.sin(angle);
    return { x, y };
  };
  
  // Prepare data for the chart using the animated values
  const muscleGroups = Object.keys(displayData) as MuscleGroup[];
  const dataPoints = muscleGroups.map((muscle, index) => {
    return calculatePoint(index, muscleGroups.length, displayData[muscle]);
  });
  
  // Create the polygon string for the radar chart
  const polygonPoints = dataPoints.map(point => `${point.x},${point.y}`).join(' ');

  return (
    <SafeAreaView className="bg-primary flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      
      <View className="px-4 py-6">
        <TopBar subtext="Level 100" title="Your Stats" titleTop={true} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {/* Tabs for switching metrics */}
        <View className="flex-row justify-between bg-black-100 rounded-xl p-1 mb-6">
          {(['volume', 'reps', 'sets', 'weight'] as MetricType[]).map((metric) => (
            <TouchableOpacity 
              key={metric}
              onPress={() => handleMetricChange(metric)}
              className={`flex-1 py-3 rounded-lg ${activeMetric === metric ? 'bg-secondary' : ''}`}
              disabled={isAnimating}
            >
              <Text 
                className={`text-center text-base font-pmedium ${activeMetric === metric ? 'text-white' : 'text-gray-100'}`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Radar Chart */}
        <View className="items-center justify-center bg-black-100 rounded-2xl p-4 mb-6">
          <Text className="text-white text-xl font-psemibold mb-4">
            {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} by Muscle Group
          </Text>
          
          <View style={{ width: chartSize, height: chartSize }}>
            <Svg width={chartSize} height={chartSize}>
              {/* Background circles (30%, 60%, 90%) */}
              {[0.3, 0.6, 0.9].map((fraction, i) => (
                <Circle 
                  key={i}
                  cx={centerX}
                  cy={centerY}
                  r={radius * fraction}
                  fill="none"
                  stroke="#232533"
                  strokeWidth="1"
                />
              ))}
              
              {/* Spokes for each muscle group */}
              {muscleGroups.map((_, index) => {
                const angle = (Math.PI * 2 * index) / muscleGroups.length - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                
                return (
                  <Line
                    key={index}
                    x1={centerX}
                    y1={centerY}
                    x2={x}
                    y2={y}
                    stroke="#232533"
                    strokeWidth="1"
                  />
                );
              })}
              
              {/* Labels for muscle groups */}
              {muscleGroups.map((muscle, index) => {
                const angle = (Math.PI * 2 * index) / muscleGroups.length - Math.PI / 2;
                const labelDistance = radius * 1.15; // Position labels outside the chart
                const x = centerX + labelDistance * Math.cos(angle);
                const y = centerY + labelDistance * Math.sin(angle);
                
                return (
                  <SvgText
                    key={index}
                    x={x}
                    y={y}
                    fill="#CDCDE0"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </SvgText>
                );
              })}
              
              {/* Define gradient */}
              <LinearGradient
                id="grad"
                x1="0"
                y1="0"
                x2="0"
                y2={chartSize.toString()}
              >
                <Stop offset="0" stopColor="#A742FF" stopOpacity="0.8" />
                <Stop offset="1" stopColor="#A742FF" stopOpacity="0.2" />
              </LinearGradient>
              
              {/* Data polygon with gradient fill */}
              <Polygon
                points={polygonPoints}
                fill="url(#grad)"
                fillOpacity="0.6"
                stroke="#A742FF"
                strokeWidth="2"
              />
              
              {/* Data points */}
              {dataPoints.map((point, index) => (
                <Circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={5}
                  fill="#A742FF"
                  stroke="#fff"
                  strokeWidth="1"
                />
              ))}
            </Svg>
          </View>
        </View>
        
        {/* Section buttons in 2-column grid */}
        <View className="mb-8">
          <FlatList
            data={[
              { title: 'Personal Bests', icon: 'trophy', onPress: () => console.log('Navigate to Personal Bests') },
              { title: 'Workout History', icon: 'history', onPress: () => console.log('Navigate to Workout History') },
              { title: 'Stats Over Time', icon: 'chart-line', onPress: () => console.log('Navigate to Stats Over Time') },
              { title: 'Goals & Achievements', icon: 'medal', onPress: () => console.log('Navigate to Goals') }
            ]}
            numColumns={2}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => (
              <View className="flex-1 p-2">
                <TouchableOpacity 
                  onPress={item.onPress}
                  className="bg-black-100 rounded-xl h-[110px] justify-center items-center p-4"
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name={item.icon} size={28} color="#A742FF" />
                  <Text className="text-white font-pmedium text-center mt-3">{item.title}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Stats;