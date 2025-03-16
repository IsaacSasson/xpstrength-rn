// Path: /components/stats/RadarChart.tsx
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, LinearGradient, Stop } from 'react-native-svg';
import { useThemeContext } from '@/context/ThemeContext';

type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core';

type MuscleData = {
  [key in MuscleGroup]: number;
};

interface RadarChartProps {
  activeMetric: string;
  displayData: MuscleData;
  color?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ activeMetric, displayData, color }) => {
  // Use our new theme context
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  
  // Use passed color or fall back to primary color from theme
  const chartColor = color || primaryColor;
  
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
    <View className="items-center justify-center bg-black-100 rounded-2xl p-4 mb-6"
    style={{
        backgroundColor: tertiaryColor,
    }}
    >
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
            <Stop offset="0" stopColor={chartColor} stopOpacity="0.8" />
            <Stop offset="1" stopColor={chartColor} stopOpacity="0.2" />
          </LinearGradient>
          
          {/* Data polygon with gradient fill */}
          <Polygon
            points={polygonPoints}
            fill="url(#grad)"
            fillOpacity="0.6"
            stroke={chartColor}
            strokeWidth="2"
          />
          
          {/* Data points */}
          {dataPoints.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={5}
              fill={chartColor}
              stroke="#fff"
              strokeWidth="1"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
};

export default RadarChart;