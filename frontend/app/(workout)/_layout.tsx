// Path: /app/(workout)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const WorkoutLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="weekly-plan"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="edit-workout"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="create-workout"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="active-workout"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="exercise-list"
          options={{
            headerShown: false,
          }}
        />
        {/* Additional screens as needed */}
      </Stack>

      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
};

export default WorkoutLayout;
