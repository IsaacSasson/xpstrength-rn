import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const AppraiseLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="appraise"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
};

export default AppraiseLayout;