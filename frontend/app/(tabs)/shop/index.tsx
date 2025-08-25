// Path: /app/(tabs)/shop.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { useThemeContext } from "@/context/ThemeContext";
import { useUserProgress } from "@/context/UserProvider"; // level only
import { useShop } from "@/hooks/useShop";
import { SHOP_THEMES } from "@/context/constants/themeConstants";
import ThemeCard from "@/components/shop/ThemeCard";

const DEFAULT_FREE_THEME_ID = "purple_default";

/* ------------------------------ Top Bar ------------------------------ */
const ShopTopBar = ({ coins }: { coins: number | null }) => {
  const { primaryColor } = useThemeContext();
  const { level } = useUserProgress();

  return (
    <View className="justify-between items-start flex-row mb-6">
      <View>
        <Text className="text-2xl font-psemibold text-white">Theme Shop</Text>
        <Text className="font-psemibold text-sm text-gray-100">Customize Your App</Text>
      </View>
      <View className="flex-row items-center">
        <View className="mr-3 flex-row items-center">
          <FontAwesome5 name="bolt" size={16} color={primaryColor} />
          <Text className="text-white font-pmedium ml-1">Lvl {level}</Text>
        </View>
        <View className="flex-row items-center">
          <FontAwesome5 name="coins" size={16} color={primaryColor} />
          <Text className="text-white font-pmedium ml-1">{coins ?? "…"}</Text>
        </View>
      </View>
    </View>
  );
};

/* -------------------------------- Screen ----------------------------- */
const Shop = () => {
  const { primaryColor, setActiveThemeId, activeThemeId } = useThemeContext();
  const { coins, ownedThemes, buyTheme, grantCoins, loading, error } = useShop();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const availableThemes = Object.values(SHOP_THEMES);

  const handleThemeAction = async (themeId: string) => {
    const isOwned = ownedThemes.includes(themeId);
    const isActive = activeThemeId === themeId;

    // Determine price (default theme is free)
    const base = SHOP_THEMES[themeId];
    const price = themeId === DEFAULT_FREE_THEME_ID ? 0 : Number(base?.price ?? 0);
    const currentCoins = coins ?? 0;

    // Already active → ignore
    if (isActive) return;

    // Owned → apply (allow highlight)
    if (isOwned) {
      setSelectedTheme(themeId);
      setActiveThemeId(themeId);
      Alert.alert("Theme Applied", `${SHOP_THEMES[themeId].name} theme has been applied!`);
      return;
    }

    // Not owned: pre-check (UI guard), but still rely on server for truth
    if (price > currentCoins) {
      Alert.alert(
        "Insufficient StrengthCoins",
        `You need ${price - currentCoins} more StrengthCoins to purchase ${SHOP_THEMES[themeId].name}.`
      );
      // IMPORTANT: do NOT setSelectedTheme → no highlight
      return;
    }

    try {
      await buyTheme(themeId);
      setSelectedTheme(themeId); // highlight only after successful purchase
      setActiveThemeId(themeId);
      Alert.alert(
        "Purchase Successful",
        `You've purchased ${SHOP_THEMES[themeId].name} for ${price} StrengthCoins. The theme has been applied.`
      );
    } catch (e: any) {
      const code = (e && (e as any).code) || "";
      if (code === "INSUFFICIENT_FUNDS") {
        Alert.alert("Insufficient StrengthCoins", e.message || "You don't have enough coins.");
      } else {
        Alert.alert("Purchase Failed", e?.message || "Unable to complete purchase.");
      }
      // No highlight on failure
    }
  };

  const handleGet500 = async () => {
    try {
      await grantCoins(500); // requires backend route
      Alert.alert("Coins Added", "You received 500 StrengthCoins!");
    } catch (e: any) {
      // If the endpoint doesn't exist yet, tell you exactly what to add
      const msg =
        e?.message ||
        "Failed to grant coins. Add POST /api/v1/shop/grant-coins { data: { amount } } on the backend.";
      Alert.alert(
        "Grant Coins Unavailable",
        `${msg}\n\nProposed route:\nPOST /api/v1/shop/grant-coins\n{ data: { amount: 500 } }\n→ return new total in data/coins/amount`
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <ShopTopBar coins={coins} />
        </View>
      </SafeAreaView>
      
      {!!error && (
        <View className="px-4 py-2 bg-red-900/40">
          <Text className="text-red-200 font-pmedium">Shop error: {error}</Text>
        </View>
      )}

      <ScrollView className="px-4 py-4">
        <Text className="text-white font-psemibold text-xl mb-4">Available Themes</Text>

        {/* Owned section */}
        {ownedThemes.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-100 font-pmedium mb-3">Your Themes</Text>
            {availableThemes
              .filter((theme) => ownedThemes.includes(theme.id))
              .map((theme) => {
                const injected =
                  theme.id === DEFAULT_FREE_THEME_ID ? { ...theme, price: 0 } : theme;
                return (
                  <ThemeCard
                    key={theme.id}
                    theme={injected}
                    isActive={activeThemeId === theme.id}
                    isOwned={true}
                    onAction={handleThemeAction}
                    isSelected={selectedTheme === theme.id}
                    primaryColor={primaryColor}
                  />
                );
              })}
          </View>
        )}

        {/* For purchase section (never show default here) */}
        <View>
          <Text className="text-gray-100 font-pmedium mb-3">Available for Purchase</Text>
          {availableThemes
            .filter((theme) => theme.id !== DEFAULT_FREE_THEME_ID && !ownedThemes.includes(theme.id))
            .map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={false}
                isOwned={false}
                onAction={handleThemeAction}
                isSelected={selectedTheme === theme.id}
                primaryColor={primaryColor}
              />
            ))}
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
};

export default Shop;
