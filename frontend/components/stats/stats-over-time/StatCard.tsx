import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon,
  description 
}) => {
  return (
    <View className="w-1/2 p-2">
      <View className="bg-black-100 rounded-xl p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-100 font-pmedium">{title}</Text>
          <FontAwesome5 name={icon} size={16} color="#A742FF" />
        </View>
        <Text className="text-white text-xl font-psemibold mb-1">{value}</Text>
        <Text className="text-gray-100 text-xs">{description}</Text>
      </View>
    </View>
  );
};

export default StatCard;