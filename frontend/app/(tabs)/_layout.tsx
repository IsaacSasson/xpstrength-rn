// Path: app/(tabs)/_layout.tsx
import { View } from "react-native";
import { Tabs, usePathname } from "expo-router";
import React, { useRef } from "react";
import TabTrailIndicator from "@/components/TabTrailIndicator";
import TabIcon from "@/components/TabIcon";
import { useThemeContext } from "@/context/ThemeContext";

export default function TabsLayout() {
  const { primaryColor } = useThemeContext();
  const activeColor      = primaryColor;
  const tabBarHeight     = 80;

  /* ---------- figure out which tab is active (for TabTrail) ---------- */
  const pathname        = usePathname();
  const lastTabIndexRef = useRef(0);

  const firstSeg = pathname.split("/")[1] || "";
  const indexBySeg: Record<string, number> = {
    profile: 0,
    friends: 1,
    home:    2,
    stats:   3,
    shop:    4,
  };
  const activeIndex =
    firstSeg in indexBySeg ? indexBySeg[firstSeg] : lastTabIndexRef.current;
  if (firstSeg in indexBySeg) lastTabIndexRef.current = activeIndex;

  return (
    <View className="flex-1 relative">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: "#B4B2C6",
          tabBarStyle: {
            backgroundColor: "#161622",
            borderTopWidth: 1,
            borderTopColor: "#232533",
            height: tabBarHeight,
          },
          tabBarItemStyle: { height: "100%" },
        }}
      >
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon="user-alt" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: "Friends",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon="user-friends" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="home" /* ← folder “home/” now */
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon="dumbbell" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats" /* ← folder “stats/” now */
          options={{
            title: "Stats",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon="graph-pie" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon="shopping-cart" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>

      <TabTrailIndicator
        activeIndex={activeIndex}
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
}
