// Path: /app/(tabs)/_layout.tsx
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import React from 'react';
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

  // Determine the active tab index based on the URL
  let activeTabIndex = 0;
  if (pathname.includes('/friends')) {
    activeTabIndex = 1;
  } else if (pathname.includes('/home')) {
    activeTabIndex = 2;
  } else if (pathname.includes('/stats')) {
    activeTabIndex = 3;
  } else if (pathname.includes('/shop')) {
    activeTabIndex = 4;
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
    </View>
  );
};

export default TabsLayout;