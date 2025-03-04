import React from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// Import SVG components for custom chart rendering
import Svg, { Circle, Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

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

  // Create a custom chart implementation that doesn't rely on react-native-svg-charts
  const renderCustomChart = () => {
    const { min, max } = getYAxisBounds();
    const chartHeight = 250;
    const chartWidth = Platform.OS === 'web' ? 350 : 320;
    const paddingLeft = 20;
    const paddingRight = 50;
    const paddingTop = 20;
    const paddingBottom = 20;
    
    // Calculate the drawing area
    const width = chartWidth - paddingLeft - paddingRight;
    const height = chartHeight - paddingTop - paddingBottom;
    
    // Function to map data point value to Y position
    const getY = (value: number) => {
      return paddingTop + height - (((value - min) / (max - min)) * height);
    };
    
    // Function to map data point index to X position
    const getX = (index: number) => {
      return paddingLeft + (index * (width / (chartData.length - 1)));
    };
    
    // Create the SVG path for the line with monotone curve interpolation
    // This mimics the d3.curveMonotoneX behavior for very smooth curves
    let path = '';
    
    if (chartData.length > 0) {
      const points = chartData.map((point, index) => ({
        x: getX(index),
        y: getY(point.value)
      }));
      
      // First point
      path = `M ${points[0].x} ${points[0].y}`;
      
      // Handle curves for multiple points
      if (points.length > 1) {
        // Calculate tangents for each point
        const tangents: {x: number, y: number}[] = [];
        
        for (let i = 0; i < points.length; i++) {
          if (i === 0) {
            // For first point, use direction to next point
            const dx = points[1].x - points[0].x;
            const dy = points[1].y - points[0].y;
            tangents.push({ x: dx, y: dy });
          } 
          else if (i === points.length - 1) {
            // For last point, use direction from previous point
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            tangents.push({ x: dx, y: dy });
          } 
          else {
            // For middle points, average directions to adjacent points
            const dx = (points[i+1].x - points[i-1].x) / 2;
            const dy = (points[i+1].y - points[i-1].y) / 2;
            tangents.push({ x: dx, y: dy });
          }
        }
        
        // Create bezier curves between each pair of points
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i+1];
          
          // Use tangents to calculate control points
          // Scale the tangent vectors for smoother curves
          const t0 = tangents[i];
          const t1 = tangents[i+1];
          const scale = 0.33; // Control smoothness (lower = smoother)
          
          const cp1x = p0.x + t0.x * scale;
          const cp1y = p0.y + t0.y * scale;
          const cp2x = p1.x - t1.x * scale;
          const cp2y = p1.y - t1.y * scale;
          
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
        }
      }
    }
    
    return (
      <View style={{ position: 'relative', height: chartHeight, marginRight: Platform.OS === 'web' ? 10 : 35 }}>
        <Svg height={chartHeight} width={chartWidth}>
          {/* Define gradient for the line */}
          <Defs>
            <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#A742FF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#A742FF" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const yPos = paddingTop + ((height / 4) * i);
            return (
              <Line
                key={`grid-${i}`}
                x1={paddingLeft}
                y1={yPos}
                x2={width + paddingLeft}
                y2={yPos}
                stroke="#232533"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            );
          })}
          
          {/* The main line */}
          <Path
            d={path}
            stroke="#A742FF"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points - outer glow effect */}
          {chartData.map((point, index) => (
            <Circle
              key={`glow-${index}`}
              cx={getX(index)}
              cy={getY(point.value)}
              r="6"
              fill="#A742FF"
              opacity="0.3"
            />
          ))}
          
          {/* Data points */}
          {chartData.map((point, index) => (
            <Circle
              key={`point-${index}`}
              cx={getX(index)}
              cy={getY(point.value)}
              r="4"
              fill="#A742FF"
            />
          ))}
        </Svg>
        
        {/* Y-axis labels */}
        <View style={{ 
          position: 'absolute', 
          right: 5, 
          top: 0, 
          height: chartHeight, 
          width: 40,
          paddingTop: paddingTop,
          paddingBottom: paddingBottom,
          justifyContent: 'space-between',
        }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const bounds = getYAxisBounds();
            const range = bounds.max - bounds.min;
            const value = bounds.max - (range * i / 4);
            
            return (
              <View key={`y-label-container-${i}`} style={{
                position: 'absolute',
                right: 0,
                top: paddingTop + ((height / 4) * i) - 10,
              }}>
                <Text
                  style={{
                    color: '#CDCDE0',
                    fontSize: 11,
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
              {/* Custom chart implementation */}
              {renderCustomChart()}
              
              {/* X-axis labels */}
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
                            textAlign: index === 0 ? 'left' : (index === 1 ? 'center' : 'right')
                          }}
                        >
                          {formatDisplayDate(point.date)}
                        </Text>
                      ))
                    }
                  </View>
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