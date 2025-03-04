import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { router } from 'expo-router';

interface StatButtonItem {
  title: string;
  icon: string;
  onPress: () => void;
}

interface StatButtonsProps {
  buttons?: StatButtonItem[];
}

const StatButtons: React.FC<StatButtonsProps> = ({ 
  buttons = [
    { title: 'Personal Bests', icon: 'trophy', onPress: () => console.log('Navigate to Personal Bests') },
    { title: 'Workout History', icon: 'history', onPress: () => console.log('Navigate to Workout History') },
    { title: 'Stats Over Time', icon: 'chart-line', onPress: () => router.push('/stats-over-time') },
    { title: 'Goals & Achievements', icon: 'medal', onPress: () => console.log('Navigate to Goals') }
  ]
}) => {
  return (
    <View className="mb-8 flex-row flex-wrap">
    {buttons.map((item) => (
        <View key={item.title} className="w-1/2 p-2">
        <TouchableOpacity 
            onPress={item.onPress}
            className="bg-black-100 rounded-xl h-[110px] justify-center items-center p-4"
            activeOpacity={0.7}
        >
            <FontAwesome5 name={item.icon} size={28} color="#A742FF" />
            <Text className="text-white font-pmedium text-center mt-3">{item.title}</Text>
        </TouchableOpacity>
        </View>
    ))}
    </View>
  );
};

export default StatButtons;