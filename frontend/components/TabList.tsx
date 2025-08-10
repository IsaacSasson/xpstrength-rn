// Path: /components/Tabs.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
  Easing,
  Platform,
} from 'react-native';

interface TabsProps<T> {
  tabs: T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  isAnimating?: boolean;
  backgroundColor?: string;
  tertiaryColor?: string;
}

function Tabs<T>({
  tabs,
  activeTab,
  onTabChange,
  isAnimating = false,
  backgroundColor,
  tertiaryColor,
}: TabsProps<T>) {
  // Defensive check: if tabs is undefined or not an array, do not render anything.
  if (!tabs || !Array.isArray(tabs)) {
    console.error('Tabs component requires a valid "tabs" array');
    return null;
  }

  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabPositions, setTabPositions] = useState<number[]>([]);

  // Find the index of the active tab
  const activeIndex = tabs.indexOf(activeTab);

  // Measure container width on layout
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const width = e?.nativeEvent?.layout?.width ?? 0;
    if (width > 0) {
      setContainerWidth(width);

      // Initialize with default equal widths (first layout only)
      if (tabWidths.length === 0) {
        const equal = width / Math.max(tabs.length, 1);
        setTabWidths(new Array(tabs.length).fill(equal));
        setTabPositions(new Array(tabs.length).fill(0).map((_, i) => i * equal));
      }
    }
  };

  // Measure each tab separately
  const measureTab = (index: number, e: LayoutChangeEvent) => {
    const { width, x } = e.nativeEvent.layout;

    setTabWidths((prev) => {
      const next = prev.slice();
      next[index] = width;
      return next;
    });

    setTabPositions((prev) => {
      const next = prev.slice();
      next[index] = x;
      return next;
    });
  };

  useEffect(() => {
    // Only animate once we have a container, a valid active index,
    // and positions measured for all tabs.
    const hasAllPositions =
      tabPositions.length === tabs.length && tabPositions.every((p) => Number.isFinite(p));

    if (containerWidth > 0 && activeIndex >= 0 && hasAllPositions) {
      Animated.timing(translateX, {
        toValue: tabPositions[activeIndex],
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [activeIndex, containerWidth, tabPositions, translateX, tabs.length]);

  // Compute current indicator width safely
  const indicatorWidth =
    activeIndex >= 0 && tabWidths[activeIndex]
      ? tabWidths[activeIndex]
      : containerWidth / Math.max(tabs.length, 1);

  const hasMeasurements =
    containerWidth > 0 &&
    tabWidths.length === tabs.length &&
    tabPositions.length === tabs.length;

  return (
    <View
      onLayout={onContainerLayout}
      className="flex-row justify-between rounded-xl p-1 mb-6 relative"
      style={{
        backgroundColor: tertiaryColor,
      }}
    >
      {/* Animated selection background */}
      {hasMeasurements && activeIndex >= 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            width: indicatorWidth,
            height:
              Platform.OS === 'ios' || Platform.OS === 'android' ? '100%' : '84%',
            backgroundColor: backgroundColor || '#A742FF',
            borderRadius: 8,
            top: '7%',
            left: 0,
            transform: [{ translateX }],
          }}
        />
      )}

      {/* Render tab buttons */}
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={String(tab)}
          onLayout={(e) => measureTab(index, e)}
          onPress={() => onTabChange(tab)}
          className="flex-1 py-3 px-2 items-center justify-center rounded-lg z-10"
          disabled={isAnimating}
        >
          <Text
            className={`text-center text-base font-pmedium ${
              activeTab === tab ? 'text-white' : 'text-gray-100'
            }`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {String(tab).charAt(0).toUpperCase() + String(tab).slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default Tabs;
