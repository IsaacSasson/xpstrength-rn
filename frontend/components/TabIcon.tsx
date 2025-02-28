import React from 'react';
import { View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Foundation from '@expo/vector-icons/Foundation';

type TabIconProps = {
  icon: string;
  color: string;
  focused: boolean;
};

const TabIcon = ({ icon, color, focused }: TabIconProps): JSX.Element => {
  return (
    <View className="flex items-center justify-center h-full -mb-9">
      {icon === 'dumbbell' ? (
        <View className="flex items-center justify-center">
          <MaterialCommunityIcons 
            name={icon} 
            size={31} 
            color={color}
          />
        </View>
      ) : icon === 'graph-pie' ? (
        <View className="flex items-center justify-center">
          <Foundation 
            name={icon} 
            size={32} 
            color={color}
          />
        </View>
      ) : (
        <View className="flex items-center justify-center">
          <FontAwesome5 
            name={icon} 
            size={24} 
            color={color}
          />
        </View>
      )}
    </View>
  );
};

export default TabIcon;
