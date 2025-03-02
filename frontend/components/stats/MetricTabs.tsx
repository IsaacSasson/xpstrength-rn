import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  LayoutChangeEvent, 
  Easing,
  Platform 
} from 'react-native';

type MetricType = 'volume' | 'reps' | 'sets' | 'weight';

interface MetricTabsProps {
  activeMetric: MetricType;
  onMetricChange: (metric: MetricType) => void;
  isAnimating: boolean;
}

const MetricTabs: React.FC<MetricTabsProps> = ({ 
  activeMetric, 
  onMetricChange, 
  isAnimating 
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = React.useState(0);
  const containerRef = useRef<View>(null);
  const metrics: MetricType[] = ['volume', 'reps', 'sets', 'weight'];
  
  // Get the index of the active metric
  const activeIndex = metrics.indexOf(activeMetric);

  // Handle container layout to get its width
  const onContainerLayout = (e: LayoutChangeEvent) => {
    if (e?.nativeEvent?.layout?.width) {
      setContainerWidth(e.nativeEvent.layout.width);
    }
  };

  // Calculate the position to move the background to
  useEffect(() => {
    if (containerWidth > 0) {
      const tabWidth = containerWidth / metrics.length;
      const position = tabWidth * activeIndex;
      
      Animated.timing(translateX, {
        toValue: position,
        useNativeDriver: false,
        duration: 250,
        easing: Easing.inOut(Easing.ease)
      }).start();
    }
  }, [activeIndex, containerWidth]);

  return (
    <View 
      ref={containerRef}
      className="flex-row justify-between bg-black-100 rounded-xl p-1 mb-6 relative"
      onLayout={onContainerLayout}
    >
      {/* Animated background */}
      {containerWidth > 0 && (
        <Animated.View 
          style={{
            position: 'absolute',
            width: containerWidth / metrics.length - 8, // Subtract padding to match button size
            height: Platform.OS === 'ios' || Platform.OS === 'android' ? '100%' : '84%',
            backgroundColor: '#A742FF',
            borderRadius: 8,
            left: 4, // Add a small padding on the left
            top: '8%', // Center vertically
            transform: [{ translateX }]
          }}
        />
      )}
      
      {/* Tab buttons */}
      {metrics.map((metric) => (
        <TouchableOpacity 
          key={metric}
          onPress={() => onMetricChange(metric)}
          className="flex-1 py-3 rounded-lg z-10"
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
  );
};

export default MetricTabs;
