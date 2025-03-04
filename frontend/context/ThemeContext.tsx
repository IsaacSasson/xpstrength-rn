import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeContextType = {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setTertiaryColor: (color: string) => void;
  cycleTheme: () => void;
  // New properties for the shop system
  userCurrency: number;
  userExperience: number;
  userLevel: number;
  ownedThemes: string[];
  addCurrency: (amount: number) => void;
  addExperience: (amount: number) => void;
  purchaseTheme: (themeId: string, price: number) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: "#A742FF",
  secondaryColor: "#BD7AFF",
  tertiaryColor: "#D1B3FF",
  setPrimaryColor: () => {},
  setSecondaryColor: () => {},
  setTertiaryColor: () => {},
  cycleTheme: () => {},
  // Default values for the new properties
  userCurrency: 0,
  userExperience: 0,
  userLevel: 1,
  ownedThemes: ["purple_default"],
  addCurrency: () => {},
  addExperience: () => {},
  purchaseTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme color states
  const [primaryColor, setPrimaryColor] = useState("#A742FF");
  const [secondaryColor, setSecondaryColor] = useState("#BD7AFF");
  const [tertiaryColor, setTertiaryColor] = useState("#D1B3FF");

  // User currency and progression states
  const [userCurrency, setUserCurrency] = useState(1000); // Starting currency
  const [userExperience, setUserExperience] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [ownedThemes, setOwnedThemes] = useState<string[]>(["purple_default"]); // Default theme is owned

  // Load saved data from AsyncStorage on app start
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedCurrency = await AsyncStorage.getItem("userCurrency");
        const savedExperience = await AsyncStorage.getItem("userExperience");
        const savedLevel = await AsyncStorage.getItem("userLevel");
        const savedThemes = await AsyncStorage.getItem("ownedThemes");
        const savedPrimaryColor = await AsyncStorage.getItem("primaryColor");
        const savedSecondaryColor = await AsyncStorage.getItem("secondaryColor");
        const savedTertiaryColor = await AsyncStorage.getItem("tertiaryColor");

        if (savedCurrency) setUserCurrency(JSON.parse(savedCurrency));
        if (savedExperience) setUserExperience(JSON.parse(savedExperience));
        if (savedLevel) setUserLevel(JSON.parse(savedLevel));
        if (savedThemes) setOwnedThemes(JSON.parse(savedThemes));
        if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
        if (savedSecondaryColor) setSecondaryColor(savedSecondaryColor);
        if (savedTertiaryColor) setTertiaryColor(savedTertiaryColor);
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    };

    loadSavedData();
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("userCurrency", JSON.stringify(userCurrency));
        await AsyncStorage.setItem("userExperience", JSON.stringify(userExperience));
        await AsyncStorage.setItem("userLevel", JSON.stringify(userLevel));
        await AsyncStorage.setItem("ownedThemes", JSON.stringify(ownedThemes));
        await AsyncStorage.setItem("primaryColor", primaryColor);
        await AsyncStorage.setItem("secondaryColor", secondaryColor);
        await AsyncStorage.setItem("tertiaryColor", tertiaryColor);
      } catch (error) {
        console.error("Error saving data:", error);
      }
    };

    saveData();
  }, [userCurrency, userExperience, userLevel, ownedThemes, primaryColor, secondaryColor, tertiaryColor]);

  // Define arrays for primary, secondary, and tertiary colors (for the cycle function)
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

  // Calculate required XP for next level
  const calculateRequiredXP = (level: number) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  // Function to add currency (StrengthCoins)
  const addCurrency = (amount: number) => {
    setUserCurrency(prev => prev + amount);
  };

  // Function to add experience and handle level ups
  const addExperience = (amount: number) => {
    const newExp = userExperience + amount;
    const requiredXP = calculateRequiredXP(userLevel);
    
    if (newExp >= requiredXP) {
      // Level up
      const remainingXP = newExp - requiredXP;
      setUserLevel(prev => prev + 1);
      setUserExperience(remainingXP);
      
      // Reward for leveling up (currency bonus)
      const levelUpBonus = userLevel * 50;
      addCurrency(levelUpBonus);
    } else {
      setUserExperience(newExp);
    }
  };

  // Function to purchase a theme
  const purchaseTheme = (themeId: string, price: number) => {
    // Check if user has enough currency and doesn't already own the theme
    if (userCurrency >= price && !ownedThemes.includes(themeId)) {
      // Deduct currency
      setUserCurrency(prev => prev - price);
      
      // Add theme to owned themes
      setOwnedThemes(prev => [...prev, themeId]);
      
      // Add experience for the purchase
      addExperience(price / 10); // 10% of price as XP
      
      return true;
    }
    return false;
  };

  // Function to cycle through themes (for demo/test button)
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
        // New values
        userCurrency,
        userExperience,
        userLevel,
        ownedThemes,
        addCurrency,
        addExperience,
        purchaseTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeColors = () => useContext(ThemeContext);