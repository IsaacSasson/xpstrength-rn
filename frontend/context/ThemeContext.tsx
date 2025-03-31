// Path: /context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES } from "./constants/themeConstants";

type ThemeContextType = {
  activeThemeId: string;
  setActiveThemeId: (themeId: string) => void;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  cycleTheme: (availableThemeIds: string[]) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  activeThemeId: "purple_default",
  setActiveThemeId: () => {},
  primaryColor: "#A742FF",
  secondaryColor: "#BD7AFF",
  tertiaryColor: "#D1B3FF",
  cycleTheme: () => {},
});

export const ThemeProvider: React.FC<{ 
  children: React.ReactNode;
}> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<string>("purple_default");

  // Calculate derived state
  const theme = THEMES[activeThemeId] || THEMES.purple_default;
  const primaryColor = theme.colors.primary;
  const secondaryColor = theme.colors.secondary;
  const tertiaryColor = theme.colors.tertiary;

  // Load saved theme from AsyncStorage
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedThemeId = await AsyncStorage.getItem("activeThemeId");
        if (savedThemeId && THEMES[savedThemeId]) {
          setActiveThemeId(savedThemeId);
        }
      } catch (error) {
        console.error("Error loading saved theme:", error);
      }
    };

    loadSavedTheme();
  }, []);

  // Save theme to AsyncStorage when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem("activeThemeId", activeThemeId);
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    };

    saveTheme();
  }, [activeThemeId]);

  // Function to cycle through themes (for demo/test button)
  const cycleTheme = (availableThemeIds: string[]) => {
    const themeIds = availableThemeIds.filter(id => THEMES[id]);
    const currentIndex = themeIds.indexOf(activeThemeId);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    setActiveThemeId(themeIds[nextIndex]);
  };

  return (
    <ThemeContext.Provider
      value={{
        activeThemeId,
        setActiveThemeId,
        primaryColor,
        secondaryColor,
        tertiaryColor,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);