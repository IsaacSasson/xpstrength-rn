import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useThemeContext } from "@/context/ThemeContext";
import { router } from 'expo-router';
export default function TodaysWorkout() {
      const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();


      const todaysWorkout = {
  exists: true,
  name: "Push Day",
  exercises: [
    { name: "Bench Press", sets: 4, reps: "8-10" },
    { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
    { name: "Shoulder Press", sets: 3, reps: "10-12" },
    { name: "Tricep Pushdown", sets: 3, reps: "12-15" },
  ],
  calories: 550, // calorie estimate replaces time
};


const goToEditWorkout = () => router.push("/edit-workout");
  const goToCreateWorkout = () => router.push("/create-workout");
  const goToActiveWorkout = () => router.push("/active-workout");
  
  return (
    <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-psemibold">
              Today's Workout
            </Text>

            {/* Pencil-only edit button */}
            {todaysWorkout.exists && (
              <TouchableOpacity
                onPress={goToEditWorkout}
                className="p-2 rounded-lg"
              >
                <FontAwesome5 name="pencil-alt" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {todaysWorkout.exists ? (
            <View>
              <Text
                style={{ color: secondaryColor }}
                className="text-lg font-pmedium mb-4"
              >
                {todaysWorkout.name}
              </Text>

              {/* Exercise List */}
              <View className="mb-4">
                {todaysWorkout.exercises.map((exercise, index) => (
                  <View
                    key={index}
                    className="flex-row items-center mb-3 last:mb-0"
                  >
                    <MaterialCommunityIcons
                      name="dumbbell"
                      size={18}
                      color={primaryColor}
                    />
                    <Text className="text-white font-pmedium ml-3">
                      {exercise.name}
                    </Text>
                    <Text className="text-gray-100 ml-auto">
                      {exercise.sets} sets × {exercise.reps}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row items-center justify-between mt-2">
                {/* Calorie estimate */}
                <View className="flex-row items-center">
                  <FontAwesome5 name="fire" size={14} color="#f97316" />
                  <Text className="text-orange-500 ml-2">
                    ≈ {todaysWorkout.calories} kcal
                  </Text>
                </View>

                {/* Start Workout button */}
                <TouchableOpacity
                  onPress={goToActiveWorkout}
                  style={{ backgroundColor: primaryColor }}
                  className="flex-row items-center px-4 py-2 rounded-lg"
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="play" size={14} color="#FFF" />
                  <Text className="text-white font-pmedium ml-2">
                    Start Workout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="items-center py-8">
              <FontAwesome5
                name="calendar-times"
                size={50}
                color={primaryColor}
              />
              <Text className="text-white font-pmedium text-center mt-4 text-lg">
                No Workout Scheduled
              </Text>
              <Text className="text-gray-100 text-center mt-2 mb-4">
                You don't have a workout planned for today.
              </Text>

              <TouchableOpacity
                onPress={goToCreateWorkout}
                style={{ backgroundColor: primaryColor }}
                className="flex-row items-center px-6 py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <FontAwesome5 name="plus" size={14} color="#FFF" />
                <Text className="text-white font-pmedium ml-2">
                  Create Workout
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
  )
}