import { View } from 'react-native';
import { Tabs } from 'expo-router';
import React from 'react';
import { usePathname } from 'expo-router';
import TabTrailIndicator from '@/components/TabTrailIndicator';
import TabIcon from '@/components/TabIcon';

const TabsLayout = () => {
  const activeColor = '#A742FF';
  const tabBarHeight = 100;

  // Get the current pathname
  const pathname = usePathname();

  // Determine the active tab index based on the URL
  let activeTabIndex = 0;
  if (pathname.includes('/home')) {
    activeTabIndex = 1;
  } else if (pathname.includes('/stats')) {
    activeTabIndex = 2;
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
      </Tabs>

      {/* Heart rate trail indicator */}
      <TabTrailIndicator
        activeIndex={activeTabIndex}
        numTabs={3}
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
