import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const StatsLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen 
          name="stats-over-time" 
          options={{ 
            headerShown: false 
          }}
        />
        {/* Add other stats-related screens here */}
      </Stack>

      <StatusBar 
        backgroundColor="#161622"
        style="light"
      />
    </>
  );
};

export default StatsLayout;