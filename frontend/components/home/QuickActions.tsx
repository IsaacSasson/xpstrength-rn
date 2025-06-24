import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
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
  const containerStyle: ViewStyle = {
    width: '50%',
    padding: 8,
  };

  const buttonStyle: ViewStyle = {
    backgroundColor,
    borderRadius: 16,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  };

  const textStyle: TextStyle = {
    color: '#fff',
    fontFamily: 'PMedium',
    textAlign: 'center',
    marginTop: 12,
  };

  return (
    <View style={containerStyle}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={buttonStyle}>
        {iconType === 'material' ? (
          <MaterialCommunityIcons name={icon as any} size={28} color={iconColor} />
        ) : (
          <FontAwesome5 name={icon as any} size={24} color={iconColor} />
        )}
        <Text style={textStyle}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default QuickActions;
