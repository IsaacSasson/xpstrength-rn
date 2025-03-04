import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { MetricType } from './ProgressLineChart';

interface WorkoutSuggestionsProps {
  activeMetric: MetricType;
  activeMuscle: string;
  color?: string;
}

const WorkoutSuggestions: React.FC<WorkoutSuggestionsProps> = ({ activeMetric, activeMuscle, color }) => {
  return (
    <>
      <Text className="text-white text-xl font-psemibold mt-6 mb-4">
        Suggestions
      </Text>
      <View className="bg-black-100 rounded-2xl p-4 mb-6">
        <View className="flex-row items-start mb-4">
          <View 
          style={{
            backgroundColor: color 
          }}
          className="h-10 w-10 rounded-full items-center justify-center mr-3">
            <FontAwesome5 name="lightbulb" size={18} color="#FFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-pmedium">Progressive Overload</Text>
            <Text className="text-gray-100">
              Try to increase your {activeMetric} by 5% in your next {activeMuscle.toLowerCase()} workout to maintain progress.
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-start">
          <View className="bg-black-200 h-10 w-10 rounded-full items-center justify-center mr-3">
            <FontAwesome5 name="dumbbell" size={18} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-pmedium">Optimize Recovery</Text>
            <Text className="text-gray-100">
              Your stats show you perform best with 2-3 days between {activeMuscle.toLowerCase()} workouts. Plan your schedule accordingly.
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default WorkoutSuggestions;