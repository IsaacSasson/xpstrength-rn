import React, { useRef, useEffect } from 'react';
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
  const [containerWidth, setContainerWidth] = React.useState(0);

  // Find the index of the active tab
  const activeIndex = tabs.indexOf(activeTab);

  // Measure container width on layout
  const onContainerLayout = (e: LayoutChangeEvent) => {
    if (e?.nativeEvent?.layout?.width) {
      setContainerWidth(e.nativeEvent.layout.width);
    }
  };

  useEffect(() => {
    if (containerWidth > 0 && activeIndex >= 0) {
      const tabWidth = containerWidth / tabs.length;
      const position = tabWidth * activeIndex;

      Animated.timing(translateX, {
        toValue: position,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [activeIndex, containerWidth, tabs.length, translateX]);

  return (
    <View
      onLayout={onContainerLayout}
      className="flex-row justify-between bg-black-100 rounded-xl p-1 mb-6 relative"
    >
      {/* Animated background */}
      {containerWidth > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            width: containerWidth / tabs.length - 8, // Adjust for padding
            height: Platform.OS === 'ios' || Platform.OS === 'android' ? '100%' : '84%',
            backgroundColor: '#A742FF',
            borderRadius: 8,
            left: 4,
            top: '8%',
            transform: [{ translateX }],
          }}
        />
      )}

      {/* Render tab buttons */}
      {tabs.map((tab) => (
        <TouchableOpacity
          key={String(tab)}
          onPress={() => onTabChange(tab)}
          className="flex-1 py-3 rounded-lg z-10"
          disabled={isAnimating}
        >
          <Text
            className={`text-center text-base font-pmedium ${
              activeTab === tab ? 'text-white' : 'text-gray-100'
            }`}
          >
            {String(tab).charAt(0).toUpperCase() + String(tab).slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default Tabs;
