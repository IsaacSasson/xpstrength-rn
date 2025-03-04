import React, { createContext, useContext, useState } from "react";

type ThemeContextType = {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setTertiaryColor: (color: string) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: "#A742FF",
  secondaryColor: "#A66DFF",
  tertiaryColor: "#D1B3FF",
  setPrimaryColor: () => {},
  setSecondaryColor: () => {},
  setTertiaryColor: () => {},
  cycleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState("#A742FF");
  const [secondaryColor, setSecondaryColor] = useState("#BD7AFF");
  const [tertiaryColor, setTertiaryColor] = useState("#D1B3FF");

  // Define arrays for primary, secondary, and tertiary colors.
  const primaryColors = [
    "#A742FF", // Purple (default)
    "#FF0000", // Red
    "#FF7F00", // Orange
    "#FFFF00", // Yellow
    "#00FF00", // Green
    "#0000FF", // Blue
    "#4B0082", // Indigo
    "#8F00FF", // Violet
  ];

  const secondaryColors = [
    "#BD7AFF", // Lighter Purple
    "#FF4D4D", // Lighter Red
    "#FF9933", // Lighter Orange
    "#FFFF99", // Lighter Yellow
    "#66FF66", // Lighter Green
    "#4D4DFF", // Lighter Blue
    "#6A5ACD", // Lighter Indigo
    "#A066FF", // Lighter Violet
  ];

  const tertiaryColors = [
    "#D1B3FF", // Tertiary for Purple
    "#FF9999", // Tertiary for Red
    "#FFCC99", // Tertiary for Orange
    "#FFFFCC", // Tertiary for Yellow
    "#CCFFCC", // Tertiary for Green
    "#9999FF", // Tertiary for Blue
    "#B19CD9", // Tertiary for Indigo
    "#D9B3FF", // Tertiary for Violet
  ];

  const cycleTheme = () => {
    const currentIndex = primaryColors.indexOf(primaryColor);
    const nextIndex = (currentIndex + 1) % primaryColors.length;
    setPrimaryColor(primaryColors[nextIndex]);
    setSecondaryColor(secondaryColors[nextIndex]);
    setTertiaryColor(tertiaryColors[nextIndex]);
  };

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        secondaryColor,
        tertiaryColor,
        setPrimaryColor,
        setSecondaryColor,
        setTertiaryColor,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeColors = () => useContext(ThemeContext);
