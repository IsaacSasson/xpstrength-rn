// Path: /app/(tabs)/_layout.tsx
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { usePathname } from 'expo-router';
import TabTrailIndicator from '@/components/TabTrailIndicator';
import TabIcon from '@/components/TabIcon';
import { useThemeContext } from '@/context/ThemeContext';

const TabsLayout = () => {
  // Only need theme context
  const { primaryColor } = useThemeContext();
  const activeColor = primaryColor;
  const tabBarHeight = 100;

  // Get the current pathname
  const pathname = usePathname();
  const lastTabIndex = useRef(0); // remember previous tab index

  const getTabIndex = (firstSeg: string) => {
    switch (firstSeg) {
      case 'profile':  return 0;
      case 'friends':  return 1;
      case 'home':     return 2;
      case 'stats':    return 3;
      case 'shop':     return 4;
      default:         return lastTabIndex.current; // stay where we were
    }
  };

  const firstSegment = pathname.split('/')[1] || '';
  const activeTabIndex = getTabIndex(firstSegment);

  // Determine the active tab index based on the URL
  if (firstSegment === 'profile'   ||
      firstSegment === 'friends'   ||
      firstSegment === 'home'      ||
      firstSegment === 'stats'     ||
      firstSegment === 'shop') {
    lastTabIndex.current = activeTabIndex;
  }

  return (
    <View className="flex-1 relative">
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveBackgroundColor: '#CDCE0',
          tabBarStyle: {
            backgroundColor: '#161622',
            borderTopWidth: 1,
            borderTopColor: '#232533',
            height: tabBarHeight,
          },
          tabBarItemStyle: {
            height: '100%',
            paddingTop: 0,
            paddingBottom: 0,
          },
        }}
      >

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                icon="user-alt"
                color={color}
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="friends"
          options={{
            title: "Friends",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                icon="user-friends"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                icon="dumbbell"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                icon="graph-pie"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                icon="shopping-cart"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>

      {/* Heart rate trail indicator */}
      {activeTabIndex > -1 && (
        <TabTrailIndicator
          activeIndex={activeTabIndex}
          numTabs={5}
          color={activeColor}
          dotSize={8}
          tabBarHeight={tabBarHeight}
          animationDuration={300}
          fadeOutDuration={800}
          maxTrailLength={50}
        />
      )}
    </View>
  );
};

export default TabsLayout;