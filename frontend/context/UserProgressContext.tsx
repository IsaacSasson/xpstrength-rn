// Path: /context/UserProgressContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserProgressContextType = {
  currency: number;
  experience: number;
  level: number;
  addCurrency: (amount: number) => void;
  addExperience: (amount: number) => void;
};

const UserProgressContext = createContext<UserProgressContextType>({
  currency: 0,
  experience: 0,
  level: 1,
  addCurrency: () => {},
  addExperience: () => {},
});

export const UserProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // User progression states
  const [currency, setCurrency] = useState(1000);
  const [experience, setExperience] = useState(0);
  const [level, setLevel] = useState(1);

  // Load saved progression data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCurrency = await AsyncStorage.getItem("userCurrency");
        const savedExperience = await AsyncStorage.getItem("userExperience");
        const savedLevel = await AsyncStorage.getItem("userLevel");

        if (savedCurrency) setCurrency(JSON.parse(savedCurrency));
        if (savedExperience) setExperience(JSON.parse(savedExperience));
        if (savedLevel) setLevel(JSON.parse(savedLevel));
      } catch (error) {
        console.error("Error loading user progress data:", error);
      }
    };

    loadData();
  }, []);

  // Save progression data when it changes
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      const saveData = async () => {
        try {
          await AsyncStorage.setItem("userCurrency", JSON.stringify(currency));
          await AsyncStorage.setItem("userExperience", JSON.stringify(experience));
          await AsyncStorage.setItem("userLevel", JSON.stringify(level));
        } catch (error) {
          console.error("Error saving user progress data:", error);
        }
      };
      saveData();
    }, 500); // Debounce writes to storage

    return () => clearTimeout(saveTimer);
  }, [currency, experience, level]);

  // Calculate required XP for next level
  const calculateRequiredXP = (currentLevel: number) => {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
  };

  // Function to add currency (StrengthCoins)
  const addCurrency = (amount: number) => {
    setCurrency(prev => prev + amount);
  };

  // Function to add experience and handle level ups
  const addExperience = (amount: number) => {
    const newExp = experience + amount;
    const requiredXP = calculateRequiredXP(level);
    
    if (newExp >= requiredXP) {
      // Level up
      const remainingXP = newExp - requiredXP;
      setLevel(prev => prev + 1);
      setExperience(remainingXP);
      
      // Reward for leveling up (currency bonus)
      const levelUpBonus = level * 50;
      addCurrency(levelUpBonus);
    } else {
      setExperience(newExp);
    }
  };

  return (
    <UserProgressContext.Provider
      value={{
        currency,
        experience,
        level,
        addCurrency,
        addExperience,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = () => useContext(UserProgressContext);