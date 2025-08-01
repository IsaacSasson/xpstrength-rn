// Path: /hooks/useShop.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProgress } from '@/context/UserProvider';
import { SHOP_THEMES } from '@/context/constants/themeConstants';

export const useShop = () => {
  const { currency, addCurrency, addExperience } = useUserProgress();
  const [ownedThemes, setOwnedThemes] = useState<string[]>(['purple_default']);
  const [loading, setLoading] = useState(true);

  // Load owned themes from storage on mount
  useEffect(() => {
    const loadOwnedItems = async () => {
      try {
        setLoading(true);
        const savedThemes = await AsyncStorage.getItem('ownedThemes');
        if (savedThemes) {
          setOwnedThemes(JSON.parse(savedThemes));
        }
      } catch (error) {
        console.error('Error loading owned themes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOwnedItems();
  }, []);

  // Save owned themes when they change
  useEffect(() => {
    const saveOwnedItems = async () => {
      try {
        await AsyncStorage.setItem('ownedThemes', JSON.stringify(ownedThemes));
      } catch (error) {
        console.error('Error saving owned themes:', error);
      }
    };

    saveOwnedItems();
  }, [ownedThemes]);

  // Function to buy a new theme
  const buyTheme = (themeId: string): boolean => {
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

  return {
    loading,
    ownedThemes,
    buyTheme
  };
};