// frontend/app/(tabs)/shop.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeColors } from "@/context/ThemeContext";

// Each theme will have a primary, secondary, and tertiary color
interface ThemeItem {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  price: number;
  isOwned: boolean;
  description: string;
}

// Custom TopBar component with currency display
const ShopTopBar = () => {
  const { primaryColor, userCurrency, userLevel } = useThemeColors();

  return (
    <View className="justify-between items-start flex-row mb-6">
      <View>
        <Text className="text-2xl font-psemibold text-white">Theme Shop</Text>
        <Text className="font-psemibold text-sm text-gray-100">Customize Your App</Text>
      </View>
      <View className="flex-row items-center">
        <View className="mr-3 flex-row items-center">
          <FontAwesome5 name="bolt" size={16} color={primaryColor} />
          <Text className="text-white font-pmedium ml-1">Lvl {userLevel}</Text>
        </View>
        <View className="flex-row items-center">
          <FontAwesome5 name="coins" size={16} color={primaryColor} />
          <Text className="text-white font-pmedium ml-1">{userCurrency}</Text>
        </View>
      </View>
    </View>
  );
};

const Shop = () => {
  // Access the theme context to change colors and check owned themes
  const { 
    primaryColor, 
    secondaryColor, 
    setPrimaryColor, 
    setSecondaryColor, 
    setTertiaryColor,
    purchaseTheme,
    ownedThemes,
    userCurrency,
    addCurrency
  } = useThemeColors();

  // State to track the selected theme for preview
  const [selectedTheme, setSelectedTheme] = useState<ThemeItem | null>(null);

  // List of available themes in the shop
  const availableThemes: ThemeItem[] = [
    {
      id: "purple_default",
      name: "Classic Purple",
      primaryColor: "#A742FF",
      secondaryColor: "#BD7AFF",
      tertiaryColor: "#D1B3FF",
      price: 0, // Free default theme
      isOwned: true,
      description: "The default purple theme. Bold and energetic."
    },
    {
      id: "red_inferno",
      name: "Inferno Red",
      primaryColor: "#FF0000",
      secondaryColor: "#FF4D4D",
      tertiaryColor: "#FF9999",
      price: 500,
      isOwned: ownedThemes.includes("red_inferno"),
      description: "Fiery and intense. Perfect for high-intensity workouts."
    },
    {
      id: "orange_sunrise",
      name: "Sunrise Orange",
      primaryColor: "#FF7F00",
      secondaryColor: "#FF9933",
      tertiaryColor: "#FFCC99",
      price: 500,
      isOwned: ownedThemes.includes("orange_sunrise"),
      description: "Warm and motivating. Start your day with energy."
    },
    {
      id: "green_forest",
      name: "Forest Green",
      primaryColor: "#00AA00",
      secondaryColor: "#66CC66",
      tertiaryColor: "#CCFFCC",
      price: 750,
      isOwned: ownedThemes.includes("green_forest"),
      description: "Natural and calming. Find your zen while working out."
    },
    {
      id: "blue_ocean",
      name: "Ocean Blue",
      primaryColor: "#0066FF",
      secondaryColor: "#4D94FF",
      tertiaryColor: "#99C2FF",
      price: 750,
      isOwned: ownedThemes.includes("blue_ocean"),
      description: "Deep and focused. Dive into your training routine."
    },
    {
      id: "gold_premium",
      name: "Premium Gold",
      primaryColor: "#FFD700",
      secondaryColor: "#FFDF4D",
      tertiaryColor: "#FFEC99",
      price: 1500,
      isOwned: ownedThemes.includes("gold_premium"),
      description: "Luxurious and prestigious. Show off your achievements."
    },
    {
      id: "neon_future",
      name: "Neon Future",
      primaryColor: "#00FFFF",
      secondaryColor: "#4DFFFF",
      tertiaryColor: "#99FFFF",
      price: 2000,
      isOwned: ownedThemes.includes("neon_future"),
      description: "Futuristic and bright. Train like you're from the future."
    }
  ];

  // Handle theme purchase
  const handlePurchase = (theme: ThemeItem) => {
    if (theme.isOwned) {
      // Apply the theme if already owned
      setPrimaryColor(theme.primaryColor);
      setSecondaryColor(theme.secondaryColor);
      setTertiaryColor(theme.tertiaryColor);
      Alert.alert("Theme Applied", `${theme.name} theme has been applied!`);
    } else {
      // Try to purchase the theme
      if (userCurrency >= theme.price) {
        purchaseTheme(theme.id, theme.price);
        Alert.alert(
          "Purchase Successful", 
          `You've purchased ${theme.name} theme for ${theme.price} StrengthCoins!`
        );
      } else {
        Alert.alert(
          "Insufficient StrengthCoins", 
          `You need ${theme.price - userCurrency} more StrengthCoins to purchase this theme.`
        );
      }
    }
  };

  // Preview the theme without purchasing
  const previewTheme = (theme: ThemeItem) => {
    setSelectedTheme(theme);
  };

  // For demo purposes - add StrengthCoins
  const handleAddCoins = () => {
    addCurrency(500);
    Alert.alert("Coins Added", "You've earned 500 StrengthCoins for completing a workout!");
  };

  // Render each theme item in the shop
  const renderThemeItem = (theme: ThemeItem) => {
    const isSelected = selectedTheme?.id === theme.id;
    
    return (
      <TouchableOpacity
        key={theme.id}
        className="bg-black-100 rounded-xl p-4 mb-4"
        onPress={() => previewTheme(theme)}
        style={{
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? primaryColor : "transparent",
        }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-white font-psemibold text-lg">{theme.name}</Text>
            <Text className="text-gray-100 font-pregular text-sm mt-1">{theme.description}</Text>
            
            <View className="flex-row mt-3 space-x-2">
              <View 
                style={{ backgroundColor: theme.primaryColor }} 
                className="w-8 h-8 rounded-full"
              />
              <View 
                style={{ backgroundColor: theme.secondaryColor }} 
                className="w-8 h-8 rounded-full"
              />
              <View 
                style={{ backgroundColor: theme.tertiaryColor }} 
                className="w-8 h-8 rounded-full"
              />
            </View>
          </View>
          
          <View>
            {theme.isOwned ? (
              <TouchableOpacity
                style={{ backgroundColor: primaryColor }}
                className="py-2 px-4 rounded-lg"
                onPress={() => handlePurchase(theme)}
              >
                <Text className="text-white font-pmedium">Apply</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: primaryColor }}
                className="py-2 px-4 rounded-lg"
                onPress={() => handlePurchase(theme)}
              >
                <View className="flex-row items-center space-x-1">
                  <FontAwesome5 name="coins" size={14} color="#FFF" />
                  <Text className="text-white font-pmedium ml-1">{theme.price}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
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
            {userCurrency} <Text className="text-gray-100">StrengthCoins</Text>
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
        
        {availableThemes.map(renderThemeItem)}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
};

export default Shop;