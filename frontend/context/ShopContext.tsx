// Path: /context/ShopContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserProgress } from "./UserProgressContext";
import { SHOP_THEMES, ShopItem } from "./constants/themeConstants";

type ShopContextType = {
  ownedThemes: string[];
  purchaseTheme: (themeId: string) => boolean;
  getShopItem: (themeId: string) => ShopItem;
  getAllShopItems: () => ShopItem[];
};

const ShopContext = createContext<ShopContextType>({
  ownedThemes: ["purple_default"],
  purchaseTheme: () => false,
  getShopItem: () => SHOP_THEMES.purple_default,
  getAllShopItems: () => Object.values(SHOP_THEMES),
});

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currency, addCurrency, addExperience } = useUserProgress();
  const [ownedThemes, setOwnedThemes] = useState<string[]>(["purple_default"]);

  // Load owned themes from storage
  useEffect(() => {
    const loadOwnedItems = async () => {
      try {
        const savedThemes = await AsyncStorage.getItem("ownedThemes");
        if (savedThemes) {
          setOwnedThemes(JSON.parse(savedThemes));
        }
      } catch (error) {
        console.error("Error loading owned themes:", error);
      }
    };

    loadOwnedItems();
  }, []);

  // Save owned themes when they change
  useEffect(() => {
    const saveOwnedItems = async () => {
      try {
        await AsyncStorage.setItem("ownedThemes", JSON.stringify(ownedThemes));
      } catch (error) {
        console.error("Error saving owned themes:", error);
      }
    };

    saveOwnedItems();
  }, [ownedThemes]);

  // Function to purchase a theme
  const purchaseTheme = (themeId: string): boolean => {
    // Don't allow purchase if already owned
    if (ownedThemes.includes(themeId)) {
      return true;
    }

    const item = SHOP_THEMES[themeId];
    if (!item) return false;

    // Check if user has enough currency
    if (currency >= item.price) {
      // Deduct currency
      addCurrency(-item.price);

      // Add theme to owned themes
      setOwnedThemes((prev) => [...prev, themeId]);

      // Add experience for the purchase
      addExperience(item.price / 10); // 10% of price as XP

      return true;
    }

    return false;
  };

  // Helper functions to access shop items
  const getShopItem = (themeId: string): ShopItem => {
    return SHOP_THEMES[themeId] || SHOP_THEMES.purple_default;
  };

  const getAllShopItems = (): ShopItem[] => {
    return Object.values(SHOP_THEMES);
  };

  return (
    <ShopContext.Provider
      value={{
        ownedThemes,
        purchaseTheme,
        getShopItem,
        getAllShopItems,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShopContext = () => useContext(ShopContext);
export { ShopContext };