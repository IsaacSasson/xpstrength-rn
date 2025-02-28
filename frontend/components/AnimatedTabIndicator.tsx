import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet } from 'react-native';

interface AnimatedTabIndicatorProps {
  activeIndex: number;
  numTabs: number;
  color: string;
  dotSize?: number;
  tabBarHeight?: number;
}

const { width } = Dimensions.get('window');

const AnimatedTabIndicator: React.FC<AnimatedTabIndicatorProps> = ({
  activeIndex,
  numTabs,
  color,
  dotSize = 2,
  tabBarHeight = 80,
}) => {
  // Create an animated value for the dot position
  const dotPosition = useRef(new Animated.Value(0)).current;

  // Calculate tab width based on screen width and number of tabs
  const tabWidth = width / numTabs;

  // Update the animated value when active tab changes
  useEffect(() => {
    Animated.timing(dotPosition, {
      toValue: activeIndex * tabWidth + (tabWidth / 2) - (dotSize / 2),
      duration: 300,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [activeIndex, tabWidth, dotSize]);

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          bottom: tabBarHeight - 2, // Position it 2px above the tab bar
          transform: [{ translateX: dotPosition }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    left: 0,
    zIndex: 100,
    bottom: 0,
  },
});

export default AnimatedTabIndicator;