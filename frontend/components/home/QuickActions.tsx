// Path: /app/components/home/QuickActions.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface QuickActionsProps {
  title: string;
  icon: string;
  iconType?: 'material' | 'fontawesome';
  onPress: () => void;
  iconColor?: string;
  backgroundColor?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  title,
  icon,
  iconType = 'fontawesome',
  onPress,
  iconColor = '#fff',
  backgroundColor = '#333',
}) => {
  return (
    <View className="w-1/2 p-2">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          backgroundColor,
          borderRadius: 16,
          height: 90,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        {iconType === 'material' ? (
          <MaterialCommunityIcons name={icon as any} size={28} color={iconColor} />
        ) : (
          <FontAwesome5 name={icon as any} size={24} color={iconColor} />
        )}
        <Text className="text-white font-pmedium text-center mt-3">
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default QuickActions;
