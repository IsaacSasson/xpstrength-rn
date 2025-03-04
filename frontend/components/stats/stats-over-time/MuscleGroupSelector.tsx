import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface MuscleGroupSelectorProps {
  activeMuscle: string;
  handleMuscleChange: (muscle: string) => void;
  muscleGroups: string[];
}

const MuscleGroupSelector: React.FC<MuscleGroupSelectorProps> = ({
  activeMuscle,
  handleMuscleChange,
  muscleGroups
}) => {
  return (
    <View className="mb-4">
      <Text className="text-white font-pmedium mb-3">Muscle Group</Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {muscleGroups.map((muscle) => (
          <TouchableOpacity
            key={muscle}
            onPress={() => handleMuscleChange(muscle)}
            className={`px-4 py-2 mr-2 rounded-full ${
              activeMuscle === muscle ? 'bg-secondary' : 'bg-black-100'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`font-pmedium ${
                activeMuscle === muscle ? 'text-white' : 'text-gray-100'
              }`}
            >
              {muscle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default MuscleGroupSelector;