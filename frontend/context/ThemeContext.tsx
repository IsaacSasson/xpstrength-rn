import React, { createContext, useContext, useState } from "react";

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: "#A742FF",
  setPrimaryColor: () => {},
  cycleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState("#A742FF");

  // Array of rainbow colors
  const colors = [
    "#A742FF", // Purple (default)
    "#FF0000", // Red
    "#FF7F00", // Orange
    "#FFFF00", // Yellow
    "#00FF00", // Green
    "#0000FF", // Blue
    "#4B0082", // Indigo
    "#8F00FF", // Violet
  ];

  const cycleTheme = () => {
    const currentIndex = colors.indexOf(primaryColor);
    const nextIndex = (currentIndex + 1) % colors.length;
    setPrimaryColor(colors[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeColors = () => useContext(ThemeContext);
