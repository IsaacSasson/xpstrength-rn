import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StatusBar, 
  ScrollView, 
  TouchableOpacity,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Mock data for the weekly workout plan
const weeklyWorkoutData = [
  {
    day: 'Monday',
    workout: {
      name: 'Push Day',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10' },
        { name: 'Shoulder Press', sets: 3, reps: '10-12' },
        { name: 'Incline DB Press', sets: 3, reps: '10-12' },
        { name: 'Tricep Extensions', sets: 3, reps: '12-15' }
      ],
      time: '1h 15m'
    }
  },
  {
    day: 'Tuesday',
    workout: {
      name: 'Pull Day',
      exercises: [
        { name: 'Deadlifts', sets: 4, reps: '6-8' },
        { name: 'Pull-ups', sets: 3, reps: '8-10' },
        { name: 'Barbell Rows', sets: 3, reps: '8-10' },
        { name: 'Bicep Curls', sets: 3, reps: '12-15' }
      ],
      time: '1h 10m'
    }
  },
  {
    day: 'Wednesday',
    workout: {
      name: 'Rest Day',
      exercises: [],
      time: '0m'
    }
  },
  {
    day: 'Thursday',
    workout: {
      name: 'Legs Day',
      exercises: [
        { name: 'Squats', sets: 4, reps: '8-10' },
        { name: 'Leg Press', sets: 3, reps: '10-12' },
        { name: 'Lunges', sets: 3, reps: '10 each' },
        { name: 'Calf Raises', sets: 4, reps: '15-20' }
      ],
      time: '1h 20m'
    }
  },
  {
    day: 'Friday',
    workout: {
      name: 'Upper Body',
      exercises: [
        { name: 'Incline Bench', sets: 4, reps: '8-10' },
        { name: 'Lat Pulldowns', sets: 3, reps: '10-12' },
        { name: 'Lateral Raises', sets: 3, reps: '12-15' },
        { name: 'Face Pulls', sets: 3, reps: '15-20' }
      ],
      time: '1h 05m'
    }
  },
  {
    day: 'Saturday',
    workout: {
      name: 'Lower Body',
      exercises: [
        { name: 'Romanian Deadlifts', sets: 4, reps: '8-10' },
        { name: 'Hack Squats', sets: 3, reps: '10-12' },
        { name: 'Leg Extensions', sets: 3, reps: '12-15' },
        { name: 'Hamstring Curls', sets: 3, reps: '12-15' }
      ],
      time: '1h 15m'
    }
  },
  {
    day: 'Sunday',
    workout: {
      name: 'Rest Day',
      exercises: [],
      time: '0m'
    }
  }
];

const WeeklyPlan = () => {
  // Get the current day of the week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  
  // Convert to our array index (0 = Monday in our data)
  const todayIndex = today === 0 ? 6 : today - 1;
  
  // State to track which day's workout is expanded
  const [expandedDay, setExpandedDay] = useState<number>(todayIndex);

  // Toggle expanded state for a day
  const toggleExpand = (index: number) => {
    if (expandedDay === index) {
      setExpandedDay(-1); // Collapse if already expanded
    } else {
      setExpandedDay(index); // Expand the clicked day
    }
  };

  // Handle going back to home
  const goBack = () => {
    router.back();
  };

  // Handle editing a workout
  const editWorkout = (dayIndex: number) => {
    console.log(`Edit workout for ${weeklyWorkoutData[dayIndex].day}`);
    // When you have the edit workout page ready:
    // router.push({
    //   pathname: '/edit-workout',
    //   params: { day: weeklyWorkoutData[dayIndex].day }
    // });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={goBack} className="mr-4">
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-psemibold text-white">Weekly Workout Plan</Text>
              <Text className="font-pmedium text-sm text-gray-100">Your training schedule</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="px-4 pt-2 pb-6"
      >
        <Text className="text-white font-pmedium text-lg mb-4">Tap day to expand details</Text>
        
        {weeklyWorkoutData.map((dayData, index) => {
          const isToday = index === todayIndex;
          const isExpanded = expandedDay === index;
          const isRestDay = dayData.workout.name === 'Rest Day';
          
          return (
            <View 
              key={dayData.day}
              className={`bg-black-100 rounded-xl mb-4 overflow-hidden ${isToday ? 'border border-secondary' : ''}`}
            >
              {/* Day Header - Always visible */}
              <Pressable
                onPress={() => toggleExpand(index)}
                android_ripple={{ color: '#232533' }}
                className="p-4 flex-row justify-between items-center"
              >
                <View className="flex-row items-center">
                  <View className={`h-10 w-10 rounded-full items-center justify-center mr-3 ${isToday ? 'bg-secondary' : 'bg-black-200'}`}>
                    <Text className="text-white font-pbold">{dayData.day.substring(0, 2)}</Text>
                  </View>
                  <View>
                    <View className="flex-row items-center">
                      <Text className="text-white font-psemibold text-lg">{dayData.day}</Text>
                      {isToday && (
                        <View className="bg-secondary rounded-full px-2 py-0.5 ml-2">
                          <Text className="text-white text-xs font-pbold">TODAY</Text>
                        </View>
                      )}
                    </View>
                    <Text className={`font-pmedium ${isRestDay ? 'text-gray-100' : 'text-secondary-100'}`}>
                      {dayData.workout.name}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center">
                  {!isRestDay && (
                    <View className="flex-row items-center mr-3">
                      <FontAwesome5 name="clock" size={14} color="#CDCDE0" />
                      <Text className="text-gray-100 ml-1">{dayData.workout.time}</Text>
                    </View>
                  )}
                  <FontAwesome5 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#CDCDE0" 
                  />
                </View>
              </Pressable>
              
              {/* Expanded Details */}
              {isExpanded && (
                <View className="border-t border-black-200 p-4">
                  {isRestDay ? (
                    <View className="items-center py-4">
                      <MaterialCommunityIcons name="sleep" size={40} color="#A742FF" />
                      <Text className="text-white font-pmedium text-center mt-3">
                        Rest and recovery day. No workout scheduled.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Exercise List */}
                      <View className="mb-4">
                        {dayData.workout.exercises.map((exercise, idx) => (
                          <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                            <MaterialCommunityIcons name="dumbbell" size={18} color="#A742FF" />
                            <Text className="text-white font-pmedium ml-3">{exercise.name}</Text>
                            <Text className="text-gray-100 ml-auto">{exercise.sets} sets × {exercise.reps}</Text>
                          </View>
                        ))}
                      </View>
                      
                      {/* Action Buttons */}
                      <View className="flex-row justify-end mt-2">
                        <TouchableOpacity 
                          onPress={() => editWorkout(index)}
                          className="bg-secondary flex-row items-center px-4 py-2 rounded-lg mr-3"
                          activeOpacity={0.7}
                        >
                          <FontAwesome5 name="edit" size={14} color="#FFF" />
                          <Text className="text-white font-pmedium ml-2">Edit</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => console.log("Start workout")}
                          className="bg-black-200 flex-row items-center px-4 py-2 rounded-lg"
                          activeOpacity={0.7}
                        >
                          <FontAwesome5 name="play" size={14} color="#A742FF" />
                          <Text className="text-white font-pmedium ml-2">Start</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default WeeklyPlan;