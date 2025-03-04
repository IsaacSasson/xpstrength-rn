// Path: /components/ThemedText.tsx
import React from "react";
import { Text, TextProps } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";

const ThemedText: React.FC<TextProps> = ({ style, ...props }) => {
  const { primaryColor } = useThemeContext();
  return <Text {...props} style={[{ color: primaryColor }, style]} />;
};

export default ThemedText;