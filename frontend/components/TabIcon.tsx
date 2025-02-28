import React from 'react';
import { View } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type TabIconProps = {
  icon: string;
  color: string;
  focused: boolean;
};

const TabIcon = ({ icon, color, focused }: TabIconProps): JSX.Element => {
  return (
    <View className="flex items-center justify-center h-full -mb-9">
      {icon === 'camera' ? (
        <View className="flex items-center justify-center">
          <MaterialIcons 
            name={icon} 
            size={30} 
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