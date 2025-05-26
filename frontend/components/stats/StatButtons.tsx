import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { router } from 'expo-router';

interface StatButtonItem {
  title: string;
  icon: string;
  onPress: () => void;
  color?: string;
  tertiaryColor?: string;
}

interface StatButtonsProps {
  buttons?: StatButtonItem[];
  color?: string; // add the color prop here
  tertiaryColor?: string;
}

const StatButtons: React.FC<StatButtonsProps> = ({ 
  buttons = [
    { title: 'Personal Bests', icon: 'trophy', onPress: () => router.push('/(stats)/personal-bests') },
    { title: 'Workout History', icon: 'history', onPress: () => router.push('/(stats)/workout-history') }, 
    { title: 'Stats Over Time', icon: 'chart-line', onPress: () => router.push('/(stats)/stats-over-time') },
    { title: 'Goals & Achievements', icon: 'medal', onPress: () => router.push('/(stats)/goals') }
  ],
  color, // destructure the color prop from props
  tertiaryColor // destructure the tertiaryColor prop from props
}) => {
  return (
    <View className="mb-8 flex-row flex-wrap">
      {buttons.map((item) => (
        <View key={item.title} className="w-1/2 p-2">
          <TouchableOpacity 
            onPress={item.onPress}
            className=" rounded-xl h-[110px] justify-center items-center p-4"
            activeOpacity={0.7}
            style={{
              backgroundColor: tertiaryColor, // use passed bColor or fallback
            }}
          >
            <FontAwesome5 
              name={item.icon} 
              size={28} 
              color={color || item.color || '#000'} // use passed color or fallback
            />
            <Text className="text-white font-pmedium text-center mt-3">
              {item.title}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default StatButtons;
