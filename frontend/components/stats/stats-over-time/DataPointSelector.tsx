import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface DataPointSelectorProps {
  dataPoints: number;
  handleDataPointsChange: (points: number) => void;
  backgroundColor?: string;
}

const DataPointSelector: React.FC<DataPointSelectorProps> = ({
  dataPoints,
  handleDataPointsChange,
  backgroundColor
}) => {
  return (
    <View className="mb-4">
      <Text className="text-white font-pmedium mb-3">Workouts to Display</Text>
      <View className="flex-row">
        {[10, 20, 30].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => handleDataPointsChange(num)}
            className="px-4 py-2 mr-2 rounded-lg"
            style={{ backgroundColor: dataPoints === num ? backgroundColor : 'bg-black-100' }}
            activeOpacity={0.7}
          >
            <Text
              className={`font-pmedium ${
                dataPoints === num ? 'text-white' : 'text-gray-100'
              }`}
            >
              Last {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default DataPointSelector;