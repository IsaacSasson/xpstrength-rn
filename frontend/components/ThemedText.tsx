// ThemedText.tsx
import React from "react";
import { Text, TextProps } from "react-native";
import { useThemeColors } from "@/context//ThemeContext"; // Adjust the path as needed

const ThemedText: React.FC<TextProps> = ({ style, ...props }) => {
  const { primaryColor } = useThemeColors();
  return <Text {...props} style={[{ color: primaryColor }, style]} />;
};

export default ThemedText;
