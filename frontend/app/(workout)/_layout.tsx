import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const WorkoutLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen 
          name="weekly-plan" 
          options={{ 
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="edit-workout" 
          options={{ 
            headerShown: false 
          }}
        />

        {/* <Stack.Screen 
          name="workout-details" 
          options={{ 
            headerShown: false 
          }}
        />
         */}
         
      </Stack>

      <StatusBar 
        backgroundColor="#161622"
        style="light"
      />
    </>
  );
};

export default WorkoutLayout;