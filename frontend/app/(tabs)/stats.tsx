import { 
  View, 
  StatusBar,
  ScrollView
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/TopBar';
import MetricTabs from '@/components/stats/MetricTabs';
import RadarChart from '@/components/stats/RadarChart';
import StatButtons from '@/components/stats/StatButtons';

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

  // Define buttons for StatButtons component
  const statButtons = [
    { title: 'Personal Bests', icon: 'trophy', onPress: () => console.log('Navigate to Personal Bests') },
    { title: 'Workout History', icon: 'history', onPress: () => console.log('Navigate to Workout History') },
    { title: 'Stats Over Time', icon: 'chart-line', onPress: () => console.log('Navigate to Stats Over Time') },
    { title: 'Goals & Achievements', icon: 'medal', onPress: () => console.log('Navigate to Goals') }
  ];

  return (
    <SafeAreaView className="bg-primary flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      
      <View className="px-4 pt-6">
        <TopBar subtext="Level 100" title="Your Stats" titleTop={true} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {/* Tabs for switching metrics */}
        <MetricTabs 
          activeMetric={activeMetric} 
          onMetricChange={handleMetricChange} 
          isAnimating={isAnimating} 
        />
        
        {/* Radar Chart */}
        <RadarChart 
          activeMetric={activeMetric} 
          displayData={displayData} 
        />
        
        {/* Stat Buttons */}
        <StatButtons buttons={statButtons} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Stats;