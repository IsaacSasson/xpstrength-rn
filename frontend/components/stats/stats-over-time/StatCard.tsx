import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  description: string;
  color?: string;
  colorTwo?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon,
  description,
  color,
  colorTwo,
}) => {
  return (
    <View className="w-1/2 p-2">
      <View className=" rounded-xl p-4"
      style={{
        backgroundColor: colorTwo,
      }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-100 font-pmedium">{title}</Text>
          <FontAwesome5 name={icon} size={16} color={color} />
        </View>
        <Text className="text-white text-xl font-psemibold mb-1">{value}</Text>
        <Text className="text-gray-100 text-xs">{description}</Text>
      </View>
    </View>
  );
};

export default StatCard;