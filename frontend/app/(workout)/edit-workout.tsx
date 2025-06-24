import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";

// Types for our workout structure
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

interface Workout {
  name: string;
  days: string[];
  exercises: Exercise[];
}

// Exercise templates (if needed elsewhere)
interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
}

// Sample data keyed by day for editing
interface WorkoutRecord {
  [key: string]: Workout;
}
const workoutsByDay: WorkoutRecord = {
  Monday: {
    name: "Push Day",
    days: ["Monday"],
    exercises: [
      { id: "101", name: "Bench Press", sets: 4, reps: "8-10", weight: "185 lbs" },
      { id: "102", name: "Shoulder Press", sets: 3, reps: "10-12", weight: "135 lbs" },
      { id: "103", name: "Incline DB Press", sets: 3, reps: "10-12", weight: "65 lbs" },
      { id: "104", name: "Tricep Extensions", sets: 3, reps: "12-15", weight: "50 lbs" },
    ],
  },
  Tuesday: {
    name: "Pull Day",
    days: ["Tuesday"],
    exercises: [
      { id: "201", name: "Deadlifts", sets: 4, reps: "6-8", weight: "225 lbs" },
      { id: "202", name: "Pull-ups", sets: 3, reps: "8-10", weight: "Body weight" },
      { id: "203", name: "Barbell Rows", sets: 3, reps: "8-10", weight: "135 lbs" },
      { id: "204", name: "Bicep Curls", sets: 3, reps: "12-15", weight: "30 lbs" },
    ],
  },
};

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ExpandableSection component
const ExpandableSection: React.FC<{ isExpanded: boolean; children: React.ReactNode }> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, contentHeight]);

  return (
    <View>
      <Animated.View style={{ height: animation, overflow: "hidden" }}>
        <View onLayout={onMeasure}>{children}</View>
      </Animated.View>
      <View style={{ position: "absolute", top: 10000, left: 0, right: 0, opacity: 0 }}>{children}</View>
    </View>
  );
};

// ExpandableExerciseCard component
interface ExpandableExerciseCardProps {
  exercise: Exercise;
  index: number;
  updateExercise: (id: string, field: keyof Exercise, value: any) => void;
  removeExercise: (id: string) => void;
}
const ExpandableExerciseCard: React.FC<ExpandableExerciseCardProps> = ({ exercise, index, updateExercise, removeExercise }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View className="bg-black-100 rounded-xl mb-4 overflow-hidden">
      <View className="p-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ flex: 1 }}>
          <View className="flex-row items-center">
            <View className="bg-secondary h-8 w-8 rounded-full items-center justify-center mr-3">
              <Text className="text-white font-pbold">{index + 1}</Text>
            </View>
            <Text className="text-white text-lg font-pmedium">{exercise.name}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeExercise(exercise.id)} className="mr-3">
          <FontAwesome5 name="trash" size={16} color="#FF4D4D" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <FontAwesome5 name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#CDCDE0" />
        </TouchableOpacity>
      </View>
      <ExpandableSection isExpanded={isExpanded}>
        <View className="p-4 border-t border-black-200">
          {/* Sets Input */}
          <View className="mb-3">
            <Text className="text-gray-100 font-pmedium mb-1">Sets</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="3"
              placeholderTextColor="#7b7b8b"
              keyboardType="number-pad"
              value={exercise.sets.toString()}
              onChangeText={(text) => updateExercise(exercise.id, "sets", parseInt(text) || 0)}
            />
          </View>
          {/* Reps Input */}
          <View className="mb-3">
            <Text className="text-gray-100 font-pmedium mb-1">Reps</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="10"
              placeholderTextColor="#7b7b8b"
              value={exercise.reps}
              onChangeText={(text) => updateExercise(exercise.id, "reps", text)}
            />
          </View>
          {/* Weight Input */}
          <View className="mb-3">
            <Text className="text-gray-100 font-pmedium mb-1">Weight</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="Optional"
              placeholderTextColor="#7b7b8b"
              value={exercise.weight}
              onChangeText={(text) => updateExercise(exercise.id, "weight", text)}
            />
          </View>
          {/* Notes Input */}
          <View>
            <Text className="text-gray-100 font-pmedium mb-1">Notes</Text>
            <TextInput
              className="bg-black-200 text-white font-pmedium p-2 rounded-lg"
              placeholder="Optional notes"
              placeholderTextColor="#7b7b8b"
              multiline
              numberOfLines={2}
              value={exercise.notes}
              onChangeText={(text) => updateExercise(exercise.id, "notes", text)}
            />
          </View>
        </View>
      </ExpandableSection>
    </View>
  );
};

const EditWorkout: React.FC = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const params = useLocalSearchParams();
  const dayParam = params.day as string;

  const [workout, setWorkout] = useState<Workout>({ name: "", days: [], exercises: [] });
  const [showDayPicker, setShowDayPicker] = useState(false);

  useEffect(() => {
    if (dayParam && workoutsByDay[dayParam]) {
      setWorkout({ ...workoutsByDay[dayParam] });
    } else {
      Alert.alert("Error", "No workout found for the selected day.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }, [dayParam]);

  const goBack = () => router.back();

  const removeExercise = (id: string) => {
    Alert.alert(
      "Remove Exercise",
      "Are you sure you want to remove this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setWorkout({
            ...workout,
            exercises: workout.exercises.filter(ex => ex.id !== id)
          })
        }
      ]
    );
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex)
    });
  };

  const toggleDay = (day: string) => {
    setWorkout(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const displayDays = () => {
    const order = daysOfWeek;
    const sortedSelected = order.filter(day => workout.days.includes(day));
    if (sortedSelected.length === 7) return "Everyday";
    if (sortedSelected.length === 5 && ["Monday","Tuesday","Wednesday","Thursday","Friday"].every(d => sortedSelected.includes(d))) return "Weekdays";
    if (sortedSelected.length === 2 && ["Saturday","Sunday"].every(d => sortedSelected.includes(d))) return "Weekends";
    return sortedSelected.join(", ");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#0F0E1A" }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={goBack} className="mr-4">
                <FontAwesome5 name="arrow-left" size={20} color="white" />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-psemibold text-white">Edit Workout</Text>
                <Text className="font-pmedium text-sm text-gray-100">
                  Editing workout for {displayDays()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!workout.name.trim()) {
                  Alert.alert("Error", "Please enter a workout name"); return;
                }
                if (workout.exercises.length === 0) {
                  Alert.alert("Error", "Please add at least one exercise"); return;
                }
                Alert.alert("Success", "Workout updated successfully!", [
                  { text: "OK", onPress: goBack }
                ]);
              }}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4 pt-2 pb-20">
        <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: tertiaryColor }}>
          <Text className="text-white font-pmedium mb-2">Workout Name</Text>
          <TextInput
            className="bg-black-200 text-white font-pmedium p-3 rounded-lg"
            placeholder="Enter workout name"
            placeholderTextColor="#7b7b8b"
            value={workout.name}
            onChangeText={text => setWorkout(prev => ({ ...prev, name: text }))}
          />
        </View>

        <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: tertiaryColor }}>
          <Text className="text-white font-pmedium mb-2">Workout Days</Text>
          <TouchableOpacity className="bg-black-200 flex-row justify-between items-center p-3 rounded-lg" onPress={() => setShowDayPicker(true)}>
            <Text className="text-white font-pmedium">{displayDays()}</Text>
            <FontAwesome5 name="chevron-down" size={16} color="#CDCDE0" />
          </TouchableOpacity>
        </View>

        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-xl font-psemibold">Exercises</Text>
            <TouchableOpacity
              style={{ backgroundColor: primaryColor }}
              className="flex-row items-center px-3 py-2 rounded-lg"
              onPress={() => router.push("/(workout)/exercise-list")}
            >
              <FontAwesome5 name="plus" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {workout.exercises.length === 0 ? (
            <View className="rounded-xl p-6 items-center" style={{ backgroundColor: tertiaryColor }}>
              <MaterialCommunityIcons name="dumbbell" size={50} color={primaryColor} />
              <Text className="text-white font-pmedium text-center mt-4">No exercises added yet</Text>
              <Text className="text-gray-100 text-center mt-2 mb-4">
                Tap the "Add Exercise" button to start building your workout
              </Text>
            </View>
          ) : (
            workout.exercises.map((exercise, index) => (
              <ExpandableExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                updateExercise={updateExercise}
                removeExercise={removeExercise}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showDayPicker} transparent animationType="slide" onRequestClose={() => setShowDayPicker(false)}>
        <View style={{ flex: 1 }}>
          <View style={{ position: "absolute", inset: 0 }} />
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={{ borderColor: secondaryColor, backgroundColor: tertiaryColor }} className="bg-black-100 rounded-t-3xl border-t-2">
              {/* make draggable */}
              <View className="w-16 h-1 bg-gray-100 rounded-full mx-auto my-4" />
              
              <Text className="text-white text-xl font-psemibold text-center mb-4">Select Days</Text>
              <ScrollView className="max-h-96">
                {daysOfWeek.map(day => {
                  const isSelected = workout.days.includes(day);
                  return (
                    <TouchableOpacity key={day} className={`p-4 border-b border-black-200 ${isSelected ? "bg-black-200" : ""}`} onPress={() => toggleDay(day)}>
                      <Text style={{ color: isSelected ? primaryColor : "white" }} className="text-lg font-pmedium">{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity className="bg-black-200 m-4 p-4 rounded-xl" onPress={() => setShowDayPicker(false)}>
                <Text className="text-white font-pmedium text-center">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default EditWorkout;
