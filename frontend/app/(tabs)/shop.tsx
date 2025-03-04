// Path: /app/(tabs)/shop.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

// Import our context hooks
import { useThemeContext } from "@/context/ThemeContext";
import { useUserProgress } from "@/context/UserProgressContext";
import { useShopContext } from "@/context/ShopContext";
import { SHOP_THEMES, ShopItem } from "@/context/constants/themeConstants";

// Import our ThemeCard component
import ThemeCard from "@/components/shop/ThemeCard";

// Custom TopBar component with currency display
const ShopTopBar = () => {
  const { primaryColor } = useThemeContext();
  const { currency, level } = useUserProgress();

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
          <Text className="text-white font-pmedium ml-1">{currency}</Text>
        </View>
      </View>
    </View>
  );
};

const Shop = () => {
  // Use our separate contexts
  const { primaryColor, setActiveThemeId, activeThemeId } = useThemeContext();
  const { currency, addCurrency } = useUserProgress();
  const { ownedThemes, purchaseTheme, getAllShopItems } = useShopContext();
  
  // State to track the selected theme for preview
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // Get all available themes from the shop
  const availableThemes = getAllShopItems();

  // Handle theme purchase or activation
  const handleThemeAction = (themeId: string) => {
    const isOwned = ownedThemes.includes(themeId);
    const isActive = activeThemeId === themeId;
    
    if (isActive) {
      // Already applied, do nothing
      return;
    }
    
    // Set as selected when activated
    setSelectedTheme(themeId);
    
    if (isOwned) {
      // Apply the theme if already owned
      setActiveThemeId(themeId);
      Alert.alert("Theme Applied", `${SHOP_THEMES[themeId].name} theme has been applied!`);
    } else {
      // Try to purchase the theme
      const success = purchaseTheme(themeId);
      
      if (success) {
        setActiveThemeId(themeId); // Auto-apply on purchase
        Alert.alert(
          "Purchase Successful", 
          `You've purchased ${SHOP_THEMES[themeId].name} theme for ${SHOP_THEMES[themeId].price} StrengthCoins! The theme has been applied.`
        );
      } else {
        Alert.alert(
          "Insufficient StrengthCoins", 
          `You need ${SHOP_THEMES[themeId].price - currency} more StrengthCoins to purchase this theme.`
        );
      }
    }
  };

  // For demo purposes - add StrengthCoins
  const handleAddCoins = () => {
    addCurrency(500);
    Alert.alert("Coins Added", "You've earned 500 StrengthCoins for completing a workout!");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <ShopTopBar />
        </View>
      </SafeAreaView>

      <View className="px-4 py-4 flex-row justify-between items-center bg-black-100">
        <View className="flex-row items-center">
          <FontAwesome5 name="coins" size={20} color={primaryColor} />
          <Text className="text-white font-psemibold text-lg ml-2">
            {currency} <Text className="text-gray-100">StrengthCoins</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: primaryColor }}
          className="py-2 px-4 rounded-lg flex-row items-center"
          onPress={handleAddCoins}
        >
          <FontAwesome5 name="plus" size={14} color="#FFF" />
          <Text className="text-white font-pmedium ml-2">Get More</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="px-4 py-4">
        <Text className="text-white font-psemibold text-xl mb-4">Available Themes</Text>
        
        {/* Owned Themes Section */}
        {ownedThemes.length > 1 && (
          <View className="mb-6">
            <Text className="text-gray-100 font-pmedium mb-3">Your Themes</Text>
            {availableThemes
              .filter(theme => ownedThemes.includes(theme.id))
              .map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={activeThemeId === theme.id}
                  isOwned={true}
                  onAction={handleThemeAction}
                  isSelected={selectedTheme === theme.id}
                  primaryColor={primaryColor}
                />
              ))}
          </View>
        )}
        
        {/* Available for Purchase Section */}
        <View>
          <Text className="text-gray-100 font-pmedium mb-3">Available for Purchase</Text>
          {availableThemes
            .filter(theme => !ownedThemes.includes(theme.id))
            .map(theme => (
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