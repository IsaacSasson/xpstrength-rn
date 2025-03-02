import React from 'react';
import { View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TopBarProps = {
  username: string;
};

const TopBar: React.FC<TopBarProps> = ({ username }) => {
  return (
    <View className="justify-between items-start flex-row mb-6">
      <View>
        <Text className="font-pmedium text-sm text-gray-100">
          Welcome Back
        </Text>
        <Text className="text-2xl font-psemibold text-white">{username}</Text>
      </View>
      <View>
        <Image
          source={require('../assets/images/logo.png')}
          style={{
            height: 57,
            width: 100,
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default TopBar;