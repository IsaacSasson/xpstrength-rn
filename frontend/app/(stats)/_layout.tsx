import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const StatsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="stats-over-time"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="workout-history"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="personal-bests"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            headerShown: false,
          }}
        />
        //add more screens to remove header
      </Stack>

      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
};

export default StatsLayout;
