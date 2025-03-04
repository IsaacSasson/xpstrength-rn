// Path: /components/ThemeCard.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { ShopItem } from "@/context/constants/themeConstants";

// Color Swatch component to display a theme color
const ColorSwatch = ({ color, label }: { color: string; label?: string }) => (
  <View className="items-center">
    <View 
      style={{ backgroundColor: color, width: 32, height: 32 }} 
      className="rounded-full shadow"
    />
    {label && <Text className="text-gray-100 text-xs mt-1">{label}</Text>}
  </View>
);

interface ThemeCardProps {
  theme: ShopItem;
  isActive: boolean;
  isOwned: boolean;
  isSelected: boolean;
  primaryColor: string;
  onAction: (themeId: string) => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isActive,
  isOwned,
  isSelected,
  primaryColor,
  onAction,
}) => {
  return (
    <View
      className="bg-black-100 rounded-xl p-4 mb-4"
      style={{
        borderWidth: isSelected ? 2 : isActive ? 1 : 0,
        borderColor: isSelected ? primaryColor : isActive ? primaryColor : "transparent",
        backgroundColor: isActive ? "#1A1A2E" : undefined,
      }}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white font-psemibold text-lg">{theme.name}</Text>
            {isActive && (
              <View 
                style={{ backgroundColor: primaryColor }}
                className="ml-2 px-2 py-1 rounded-md"
              >
                <Text className="text-white text-xs font-pmedium">Active</Text>
              </View>
            )}
          </View>
          
          <Text className="text-gray-100 font-pregular text-sm mt-1 mb-3">{theme.description}</Text>
          
          <View className="flex-row space-x-4">
            <ColorSwatch color={theme.colors.primary} label="Primary" />
            <ColorSwatch color={theme.colors.secondary} label="Secondary" />
            <ColorSwatch color={theme.colors.tertiary} label="Tertiary" />
          </View>
        </View>
        
        <View>
          {isOwned ? (
            <TouchableOpacity
              style={{ 
                backgroundColor: isActive ? "#333344" : primaryColor,
                opacity: isActive ? 0.8 : 1
              }}
              className="py-2 px-4 rounded-lg"
              onPress={() => onAction(theme.id)}
              disabled={isActive}
            >
              <Text className="text-white font-pmedium">
                {isActive ? "Applied" : "Apply"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{ backgroundColor: primaryColor }}
              className="py-2 px-4 rounded-lg"
              onPress={() => onAction(theme.id)}
            >
              <View className="flex-row items-center space-x-1">
                <FontAwesome5 name="coins" size={14} color="#FFF" />
                <Text className="text-white font-pmedium ml-1">{theme.price}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ThemeCard;