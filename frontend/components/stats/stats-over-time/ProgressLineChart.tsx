// File: ProgressLineChart.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// @ts-ignore - Ignoring type declarations for react-native-svg-charts
import { LineChart } from 'react-native-svg-charts';
// @ts-ignore
import * as shape from 'd3-shape';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Easing } from 'react-native-reanimated';
import { svgPathProperties } from 'svg-path-properties';

// Create an Animated version of the SVG Path and Circle
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  // Animation value for the entire chart (also used to animate the line draw)
  const animatedValue = useRef(new Animated.Value(0)).current;
  const prevDataRef = useRef<DataPoint[]>([]);
  const prevMetricRef = useRef<MetricType>(activeMetric);

  // Get the appropriate unit based on active metric
  const getMetricUnit = () => {
    switch(activeMetric) {
      case 'weight':
      case 'volume':
        return '(lbs)';
      case 'reps':
      case 'sets':
        return '(count)';
      default:
        return '';
    }
  };

  // Get min and max values for the Y axis with proper padding
  const getYAxisBounds = () => {
    if (chartData.length === 0) return { min: 0, max: 100 };

    const values = chartData.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Add padding to the top and bottom (20%)
    const padding = (max - min) * 0.2;
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  };

  // Format y-axis values based on active metric
  const formatYAxis = (value: number) => {
    switch(activeMetric) {
      case 'weight':
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

  // Animation effect when data or metric changes
  useEffect(() => {
    // If we have data and the metric or data changed
    if (
      chartData.length > 0 && 
      (prevMetricRef.current !== activeMetric || 
       JSON.stringify(prevDataRef.current) !== JSON.stringify(chartData))
    ) {
      // To prevent flickering when switching metrics, immediately reset the animation value
      animatedValue.setValue(0);

      // Start animation
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }).start();

      // Store current data and metric for next comparison
      prevDataRef.current = [...chartData];
      prevMetricRef.current = activeMetric;
    }
  }, [chartData, activeMetric, animatedValue]);

  // Create custom decorator for the data points that appears gradually with the line
  const Decorator = ({ x, y, data }: any) => {
    return (
      <>
        {data.map((value: number, index: number) => {
          // Calculate when each dot should appear based on its position in the line
          const dotPosition = index / (data.length - 1);
          
          // Special handling for the last dot to ensure it appears exactly when the line reaches the end
          const isLastDot = index === data.length - 1;
          
          // For regular dots: appear slightly after the line passes their position
          // For the last dot: appear exactly when the line reaches the end (animation value = 1)
          const dotOpacity = animatedValue.interpolate({
            inputRange: isLastDot 
              ? [0.95, 1] 
              : [dotPosition, Math.min(0.98, dotPosition + 0.05)],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          });
          
          // Add a "pop" scale effect when dots appear
          // For the last dot, start the pop right at the end of the animation
          const dotScale = animatedValue.interpolate({
            inputRange: isLastDot
              ? [0.95, 1, 1.001] // The 1.001 is a trick to make the last keyframe work
              : [dotPosition, Math.min(0.98, dotPosition + 0.05), Math.min(1, dotPosition + 0.15)],
            outputRange: [0.5, 1.5, 1],
            extrapolate: 'clamp',
          });
          
          return (
            <AnimatedCircle
              key={index}
              cx={x(index)}
              cy={y(value)}
              r={4}
              fill="#A742FF"
              opacity={dotOpacity}
              scale={dotScale}
              origin={`${x(index)}, ${y(value)}`}
            />
          );
        })}
      </>
    );
  };

  // Create custom gradient for line
  const GradientLine = () => {
    return (
      <Defs>
        <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#A742FF" stopOpacity={1} />
          <Stop offset="100%" stopColor="#A742FF" stopOpacity={0.2} />
        </LinearGradient>
      </Defs>
    );
  };

  // Custom animated line component
  const CustomLine = ({ line }: { line: string }) => {
    const [lineLength, setLineLength] = useState(0);

    // Measure the path length whenever the line changes
    useEffect(() => {
      const properties = new svgPathProperties(line);
      setLineLength(properties.getTotalLength());
    }, [line]);

    // strokeDashoffset goes from the entire length down to 0
    const strokeDashoffset = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [lineLength, 0],
      extrapolate: 'clamp',
    });

    // Custom line visibility to prevent flicker when switching metrics
    const lineOpacity = animatedValue.interpolate({
      inputRange: [0, 0.01],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <AnimatedPath
        d={line}
        stroke="#A742FF"
        strokeWidth={3}
        fill="none"
        strokeDasharray={lineLength}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={lineOpacity}
      />
    );
  };

  return (
    <View className="bg-black-100 rounded-2xl p-4 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-white text-lg font-psemibold">
          {activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} Progress {getMetricUnit()}
        </Text>
        <View className="bg-black-200 px-3 py-1 rounded-lg">
          <Text className="text-secondary-100 font-pmedium text-sm">
            {chartData.length > 0
              ? `${formatDisplayDate(chartData[0].date)} - ${formatDisplayDate(chartData[chartData.length - 1].date)}`
              : 'Last Workouts'}
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
            <Animated.View
              style={{
                opacity: animatedValue.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0.6, 0.8, 1],
                }),
                transform: [
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              }}
            >
              {/* Main chart with y-axis labels */}
              <View style={{ position: 'relative' }}>
                {/* Main chart (disable built-in animation to use our custom line animation) */}
                <View style={{ marginRight: 35 }}>
                  <LineChart
                    style={{ height: 250 }}
                    data={chartData.map(point => point.value)}
                    contentInset={{ top: 20, bottom: 20, left: 10, right: 10 }}
                    curve={shape.curveMonotoneX}
                    svg={{ stroke: 'transparent' }} // Make the default line transparent
                    yMin={getYAxisBounds().min}
                    yMax={getYAxisBounds().max}
                    animate={false} // Disable default animation
                  >
                    <GradientLine />
                    <CustomLine line={''} />
                    <Decorator />
                  </LineChart>
                </View>

                {/* Y-axis labels and grid lines (overlaid) - Always visible */}
                <View
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    height: 250,
                    width: '100%',
                    paddingTop: 20,
                    paddingBottom: 20,
                    justifyContent: 'space-between',
                  }}
                >
                  {[0, 1, 2, 3, 4].map((i) => {
                    const bounds = getYAxisBounds();
                    const range = bounds.max - bounds.min;
                    const value = bounds.max - (range * i) / 4;

                    return (
                      <View
                        key={i}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        {/* Dotted line */}
                        <View
                          style={{
                            flex: 1,
                            height: 1,
                            borderBottomWidth: 1,
                            borderBottomColor: '#232533',
                            borderStyle: 'dotted',
                            marginRight: 5,
                          }}
                        />

                        {/* Y-axis label */}
                        <Text
                          style={{
                            color: '#CDCDE0',
                            fontSize: 11,
                            width: 30,
                            textAlign: 'right',
                          }}
                        >
                          {formatYAxis(value)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* X-axis labels - Always visible */}
              <View className="flex-row mt-4 px-4">
                <View className="flex-1">
                  <View className="flex-row justify-between">
                    {chartData
                      .filter((_, i) => i === 0 || i === Math.floor(chartData.length / 2) || i === chartData.length - 1)
                      .map((point, index) => (
                        <Text
                          key={index}
                          className="text-gray-100 text-xs"
                          style={{
                            width: '33%',
                            textAlign:
                              index === 0
                                ? 'left'
                                : index === 1
                                ? 'center'
                                : 'right',
                          }}
                        >
                          {formatDisplayDate(point.date)}
                        </Text>
                      ))}
                  </View>
                </View>
              </View>
            </Animated.View>
          ) : (
            <View className="h-64 items-center justify-center">
              <FontAwesome5 name="chart-line" size={50} color="#A742FF" />
              <Text className="text-white font-pmedium text-center mt-4 text-lg">
                No Data Available
              </Text>
              <Text className="text-gray-100 text-center mt-2">
                Complete more workouts to see your progress.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ProgressLineChart;