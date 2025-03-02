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
}

function Tabs<T>({ tabs, activeTab, onTabChange, isAnimating = false }: TabsProps<T>) {
  // Defensive check: if tabs is undefined or not an array, do not render anything.
  if (!tabs || !Array.isArray(tabs)) {
    console.error('Tabs component requires a valid "tabs" array');
    return null;
  }

  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [tabsRefs] = useState<Array<View | null>>(new Array(tabs.length).fill(null));
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabPositions, setTabPositions] = useState<number[]>([]);
  
  // Find the index of the active tab
  const activeIndex = tabs.indexOf(activeTab);

  // Measure container width on layout
  const onContainerLayout = (e: LayoutChangeEvent) => {
    if (e?.nativeEvent?.layout?.width) {
      setContainerWidth(e.nativeEvent.layout.width);
      
      // Initialize with default equal widths
      if (tabWidths.length === 0) {
        setTabWidths(new Array(tabs.length).fill(e.nativeEvent.layout.width / tabs.length));
        setTabPositions(
          new Array(tabs.length).fill(0).map((_, i) => i * (e.nativeEvent.layout.width / tabs.length))
        );
      }
    }
  };

  // Measure each tab separately
  const measureTab = (index: number, e: LayoutChangeEvent) => {
    const { width, x } = e.nativeEvent.layout;
    
    setTabWidths(prev => {
      const newWidths = [...prev];
      newWidths[index] = width;
      return newWidths;
    });
    
    setTabPositions(prev => {
      const newPositions = [...prev];
      newPositions[index] = x;
      return newPositions;
    });
  };

  useEffect(() => {
    if (containerWidth > 0 && activeIndex >= 0 && tabPositions.length > 0) {
      // Animate to the position of the active tab
      Animated.timing(translateX, {
        toValue: tabPositions[activeIndex],
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [activeIndex, containerWidth, tabPositions, translateX]);

  return (
    <View
      onLayout={onContainerLayout}
      className="flex-row justify-between bg-black-100 rounded-xl p-1 mb-6 relative"
    >
      {/* Animated background */}
      {containerWidth > 0 && tabWidths.length > 0 && activeIndex >= 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            width: tabWidths[activeIndex] || containerWidth / tabs.length,
            height: Platform.OS === 'ios' || Platform.OS === 'android' ? '86%' : '84%',
            backgroundColor: '#A742FF',
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
          ref={ref => tabsRefs[index] = ref}
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