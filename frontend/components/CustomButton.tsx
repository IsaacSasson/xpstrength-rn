import React from 'react';
import { TouchableOpacity, Text, GestureResponderEvent } from 'react-native';

interface CustomButtonProps {
  title: string;
  handlePress: (event: GestureResponderEvent) => void;
  containerStyles?: string;
  textStyles?: string;
  isLoading?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  handlePress,
  containerStyles = '',
  textStyles = '',
  isLoading = false,
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className={`bg-secondary rounded-xl min-h-[62px] justify-center items-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
      disabled={isLoading}
    >
      <Text className={`text-primary font-psemibold text-lg ${textStyles}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;