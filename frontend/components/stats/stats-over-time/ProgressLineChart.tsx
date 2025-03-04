import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, ActivityIndicator, Animated } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// @ts-ignore - Ignoring type declarations for react-native-svg-charts
import { LineChart } from 'react-native-svg-charts';
// @ts-ignore
import * as shape from 'd3-shape';
// Import SVG components for data points
import Svg, { Circle } from 'react-native-svg';

export type DataPoint = {
  date: string;
  value: number;
};

export type MetricType = 'volume' | 'reps' | 'sets' | 'weight';

interface ProgressLineChartProps {
  chartData: DataPoint[];
  loading: boolean;
  activeMetric: MetricType;
}

// Format date string to display format
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ProgressLineChart: React.FC<ProgressLineChartProps> = ({
  chartData,
  loading,
  activeMetric,
}) => {
  // Animation values for points
  const [animatedPoints, setAnimatedPoints] = useState<any[]>([]);
  const [prevPoints, setPrevPoints] = useState<any[]>([]);
  const animationRef = useRef(new Animated.Value(0)).current;
  
  // Get the appropriate unit based on active metric
  const getMetricUnit = () => {
    switch(activeMetric) {
      case 'weight':
        return '(lbs)';
      case 'volume':
        return '(lbs)';
      case 'reps':
        return '(count)';
      case 'sets':
        return '(count)';
      default:
        return '';
    }
  };
  
  // Get min and max values for the Y axis
  const getYAxisBounds = () => {
    if (chartData.length === 0) return { min: 0, max: 100 };
    
    const values = chartData.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add 10% padding to the top and bottom
    const padding = (max - min) * 0.1;
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  };
  
  // Calculate positions for points
  const calculatePoints = () => {
    if (chartData.length === 0) return [];
    
    const bounds = getYAxisBounds();
    
    return chartData.map((point, index) => {
      const yRatio = (bounds.max - point.value) / (bounds.max - bounds.min);
      
      // Calculate position - adjust X to avoid edge cutoff
      // Use padding to avoid left/right edge cutoff
      const leftPadding = 5;
      const rightPadding = 5;
      const usableWidth = 100 - (leftPadding + rightPadding);
      const x = leftPadding + (index / (chartData.length - 1)) * usableWidth;
      
      // Y position with contentInset
      const y = 20 + yRatio * (250 - 40); 
      
      return { x, y, value: point.value };
    });
  };
  
  // Format y-axis values based on active metric
  const formatYAxis = (value: number) => {
    switch(activeMetric) {
      case 'weight':
        return `${Math.round(value)}`;
      case 'volume':
        return `${Math.round(value)}`;
      case 'reps':
        return `${Math.round(value)}`;
      case 'sets':
        return `${value.toFixed(1)}`;
      default:
        return `${Math.round(value)}`;
    }
  };

  // Animate points when data changes
  useEffect(() => {
    // Calculate new points
    const newPoints = calculatePoints();
    
    // If we have previous points, animate from those positions
    if (prevPoints.length > 0 && prevPoints.length === newPoints.length) {
      // Reset animation value
      animationRef.setValue(0);
      
      // Start animation
      Animated.timing(animationRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      // If first render or point count changed, set directly
      setAnimatedPoints(newPoints);
    }
    
    // Update previous points for next animation
    setPrevPoints(newPoints);
  }, [chartData, activeMetric]);

  // Update animated points on animation progress
  useEffect(() => {
    if (prevPoints.length > 0 && prevPoints.length === calculatePoints().length) {
      const newPoints = calculatePoints();
      
      // Create listener for animation value
      const listener = animationRef.addListener(({ value }) => {
        // Interpolate between old and new positions
        const interpolatedPoints = prevPoints.map((oldPoint, index) => {
          const newPoint = newPoints[index];
          return {
            x: oldPoint.x + (newPoint.x - oldPoint.x) * value,
            y: oldPoint.y + (newPoint.y - oldPoint.y) * value,
            value: oldPoint.value + (newPoint.value - oldPoint.value) * value,
          };
        });
        
        setAnimatedPoints(interpolatedPoints);
      });
      
      // Clean up listener
      return () => {
        animationRef.removeListener(listener);
      };
    }
  }, [prevPoints, animationRef]);

  return (
    <View className="bg-black-100 rounded-2xl p-4 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-psemibold">
          {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Progress {getMetricUnit()}
        </Text>
        <View className="bg-black-200 px-3 py-1 rounded-lg">
          <Text className="text-secondary-100 font-pmedium text-sm">
            {chartData.length > 0 ? 
              `${formatDisplayDate(chartData[0].date)} - ${formatDisplayDate(chartData[chartData.length-1].date)}` :
              'Last Workouts'
            }
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
          {chartData.length > 0 ? (
            <>
              {/* Chart Area with positioned elements */}
              <View className="flex-row mt-2">
                {/* Y-axis values on right side */}
                <View className="flex-1 relative">
                  <View className="absolute right-2 h-full justify-between py-5 z-10">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const bounds = getYAxisBounds();
                      const range = bounds.max - bounds.min;
                      const value = bounds.max - (range * i / 4);
                      return (
                        <Text key={i} className="text-gray-100 text-xs text-right">
                          {formatYAxis(value)}
                        </Text>
                      );
                    })}
                  </View>
                  
                  {/* Chart */}
                  <LineChart
                    style={{ height: 250, paddingRight: 35 }}
                    data={chartData.map(point => point.value)}
                    contentInset={{ top: 20, bottom: 20, left: 10, right: 40 }}
                    curve={shape.curveMonotoneX}
                    svg={{ 
                      stroke: '#A742FF',
                      strokeWidth: 3,
                    }}
                    yMin={getYAxisBounds().min}
                    yMax={getYAxisBounds().max}
                  />
                  
                  {/* Overlay grid lines */}
                  <View 
                    className="absolute h-full w-full"
                    style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <View 
                        key={i} 
                        className="border-t border-black-200" 
                        style={{ 
                          position: 'absolute', 
                          top: 20 + (i * 52.5), 
                          left: 0, 
                          right: 0,
                          borderStyle: 'dashed',
                          borderWidth: 0.5,
                          borderColor: '#232533',
                        }}
                      />
                    ))}
                  </View>
                  
                  {/* Render data points as circles - must be after grid lines to be on top */}
                  <Svg 
                    style={{ 
                      position: 'absolute', 
                      height: 250, 
                      width: '100%',
                      top: 0, 
                      paddingRight: 35,
                    }}
                  >
                    {animatedPoints.map((point, index) => (
                      <Circle
                        key={index}
                        cx={`${point.x}%`}
                        cy={point.y}
                        r="4"
                        fill="#A742FF"
                      />
                    ))}
                  </Svg>
                </View>
              </View>
              
              {/* X-axis labels */}
              <View className="flex-row mt-2">
                <View className="flex-1 pr-8">
                  {chartData.length > 0 && (
                    <View className="flex-row justify-between">
                      {chartData.filter((_, i) => 
                        i === 0 || 
                        i === Math.floor(chartData.length / 2) || 
                        i === chartData.length - 1
                      ).map((point, index) => (
                        <Text 
                          key={index} 
                          className="text-gray-100 text-xs"
                          style={{ 
                            textAlign: index === 0 ? 'left' : (index === 1 ? 'center' : 'right')
                          }}
                        >
                          {formatDisplayDate(point.date)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </>
          ) : (
            <View className="h-64 items-center justify-center">
              <FontAwesome5 name="chart-line" size={50} color="#A742FF" />
              <Text className="text-white font-pmedium text-center mt-4 text-lg">No Data Available</Text>
              <Text className="text-gray-100 text-center mt-2">Complete more workouts to see your progress.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ProgressLineChart;