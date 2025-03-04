import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
  days: string[]; // supports multiple days
  exercises: Exercise[];
}

// Type definitions for exercise templates
interface ExerciseTemplate {
  id: string;
  name: string;
  category: string;
}

// Sample exercise templates
const exerciseTemplates: ExerciseTemplate[] = [
  { id: '1', name: 'Bench Press', category: 'Chest' },
  { id: '2', name: 'Squats', category: 'Legs' },
  { id: '3', name: 'Deadlifts', category: 'Back' },
  { id: '4', name: 'Pull-ups', category: 'Back' },
  { id: '5', name: 'Push-ups', category: 'Chest' },
  { id: '6', name: 'Shoulder Press', category: 'Shoulders' },
  { id: '7', name: 'Lunges', category: 'Legs' },
  { id: '8', name: 'Bicep Curls', category: 'Arms' },
  { id: '9', name: 'Tricep Extensions', category: 'Arms' },
  { id: '10', name: 'Leg Press', category: 'Legs' },
  { id: '11', name: 'Lateral Raises', category: 'Shoulders' },
  { id: '12', name: 'Planks', category: 'Core' },
  { id: '13', name: 'Crunches', category: 'Core' },
  { id: '14', name: 'Rows', category: 'Back' },
  { id: '15', name: 'Calf Raises', category: 'Legs' },
  // Add more exercise templates as needed
];

// Define a record type for workouts by day (keyed by one day for editing convenience)
interface WorkoutRecord {
  [key: string]: Workout;
}

const workoutsByDay: WorkoutRecord = {
  'Monday': {
    name: 'Push Day',
    days: ['Monday'],
    exercises: [
      { id: '101', name: 'Bench Press', sets: 4, reps: '8-10', weight: '185 lbs' },
      { id: '102', name: 'Shoulder Press', sets: 3, reps: '10-12', weight: '135 lbs' },
      { id: '103', name: 'Incline DB Press', sets: 3, reps: '10-12', weight: '65 lbs' },
      { id: '104', name: 'Tricep Extensions', sets: 3, reps: '12-15', weight: '50 lbs' },
    ]
  },
  'Tuesday': {
    name: 'Pull Day',
    days: ['Tuesday'],
    exercises: [
      { id: '201', name: 'Deadlifts', sets: 4, reps: '6-8', weight: '225 lbs' },
      { id: '202', name: 'Pull-ups', sets: 3, reps: '8-10', weight: 'Body weight' },
      { id: '203', name: 'Barbell Rows', sets: 3, reps: '8-10', weight: '135 lbs' },
      { id: '204', name: 'Bicep Curls', sets: 3, reps: '12-15', weight: '30 lbs' },
    ]
  },
  // Add more sample workouts for other days as needed
};

// Days of the week for selecting workout days
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* 
  ExpandableSection component – measures its content and animates its height between 0 and the measured contentHeight.
*/
const ExpandableSection: React.FC<{ isExpanded: boolean; children: React.ReactNode }> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? contentHeight : 0,
      duration: 300,
      useNativeDriver: false, // Height animation requires useNativeDriver: false
    }).start();
  }, [isExpanded, contentHeight]);

  return (
    <View>
      <Animated.View style={{ height: animation, overflow: 'hidden' }}>
        <View onLayout={onMeasure}>
          {children}
        </View>
      </Animated.View>
      {/* Hidden container to measure children */}
      <View style={{ position: 'absolute', top: 10000, left: 0, right: 0, opacity: 0 }}>
        {children}
      </View>
    </View>
  );
};

/* 
  ExpandableExerciseCard – renders a single exercise card with an expandable section for its details.
*/
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
        {/* Tapping the left section toggles the expansion */}
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ flex: 1 }}>
          <View className="flex-row items-center">
            <View className="bg-secondary h-8 w-8 rounded-full items-center justify-center mr-3">
              <Text className="text-white font-pbold">{index + 1}</Text>
            </View>
            <Text className="text-white text-lg font-pmedium">{exercise.name}</Text>
          </View>
        </TouchableOpacity>
        {/* Remove button */}
        <TouchableOpacity onPress={() => removeExercise(exercise.id)} className="mr-3">
          <FontAwesome5 name="trash" size={16} color="#FF4D4D" />
        </TouchableOpacity>
        {/* Chevron toggles expansion */}
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
              onChangeText={(text) => updateExercise(exercise.id, 'sets', parseInt(text) || 0)}
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
              onChangeText={(text) => updateExercise(exercise.id, 'reps', text)}
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
              onChangeText={(text) => updateExercise(exercise.id, 'weight', text)}
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
              onChangeText={(text) => updateExercise(exercise.id, 'notes', text)}
            />
          </View>
        </View>
      </ExpandableSection>
    </View>
  );
};

const EditWorkout = () => {
  const params = useLocalSearchParams();
  const dayParam = params.day as string | undefined;
  
  // State for the workout being edited
  const [workout, setWorkout] = useState<Workout>({
    name: '',
    days: dayParam ? [dayParam] : [daysOfWeek[0]],
    exercises: [],
  });

  // State for day picker modal and search query
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load workout data if editing an existing workout
  useEffect(() => {
    if (dayParam && workoutsByDay[dayParam]) {
      setWorkout({ ...workoutsByDay[dayParam] });
    }
  }, [dayParam]);

  // Handle going back
  const goBack = () => {
    router.back();
  };

  // Generate a random ID for new exercises
  const generateId = () => `ex_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // (This addExercise function is kept for reference but is no longer used since "Add Exercise" now opens a new stack)
  const addExercise = (template: ExerciseTemplate) => {
    const newExercise: Exercise = {
      id: generateId(),
      name: template.name,
      sets: 3,
      reps: '10',
      weight: '',
      notes: '',
    };
    
    setWorkout({
      ...workout,
      exercises: [...workout.exercises, newExercise]
    });
  };

  // Remove an exercise from the workout
  const removeExercise = (id: string) => {
    Alert.alert(
      "Remove Exercise",
      "Are you sure you want to remove this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          onPress: () => {
            setWorkout({
              ...workout,
              exercises: workout.exercises.filter(ex => ex.id !== id)
            });
          },
          style: "destructive"
        }
      ]
    );
  };

  // Update exercise properties
  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.map(ex => 
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    });
  };

  // Toggle day selection for multiple days
  const toggleDay = (day: string) => {
    if (workout.days.includes(day)) {
      setWorkout({
        ...workout,
        days: workout.days.filter(d => d !== day)
      });
    } else {
      setWorkout({
        ...workout,
        days: [...workout.days, day]
      });
    }
  };

  // Function to display days in a friendly format
  const displayDays = () => {
    const order = daysOfWeek;
    const sortedSelected = order.filter(day => workout.days.includes(day));
    if (sortedSelected.length === 7) return "Everyday";
    if (
      sortedSelected.length === 5 &&
      ['Monday','Tuesday','Wednesday','Thursday','Friday'].every(day => sortedSelected.includes(day))
    )
      return "Weekdays";
    if (
      sortedSelected.length === 2 &&
      ['Saturday','Sunday'].every(day => sortedSelected.includes(day))
    )
      return "Weekends";
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
                <Text className="text-2xl font-psemibold text-white">
                  {dayParam ? 'Edit Workout' : 'Create Workout'}
                </Text>
                <Text className="font-pmedium text-sm text-gray-100">
                  {dayParam ? `Editing workout for ${displayDays()}` : 'Create a new workout routine'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => {
                if (workout.name.trim() === '') {
                  Alert.alert("Error", "Please enter a workout name");
                  return;
                }
                if (workout.exercises.length === 0) {
                  Alert.alert("Error", "Please add at least one exercise");
                  return;
                }
                // Save workout logic here
                Alert.alert("Success", "Workout saved successfully!", [
                  { text: "OK", onPress: () => router.back() }
                ]);
              }}
              className="bg-secondary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-pmedium">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="px-4 pt-2 pb-20"
      >
        {/* Workout Name Input */}
        <View className="bg-black-100 rounded-xl p-4 mb-5">
          <Text className="text-white font-pmedium mb-2">Workout Name</Text>
          <TextInput
            className="bg-black-200 text-white font-pmedium p-3 rounded-lg"
            placeholder="Enter workout name"
            placeholderTextColor="#7b7b8b"
            value={workout.name}
            onChangeText={(text) => setWorkout({ ...workout, name: text })}
          />
        </View>
        
        {/* Day Selection */}
        <View className="bg-black-100 rounded-xl p-4 mb-5">
          <Text className="text-white font-pmedium mb-2">Workout Days</Text>
          <TouchableOpacity 
            className="bg-black-200 flex-row justify-between items-center p-3 rounded-lg"
            onPress={() => setShowDayPicker(true)}
          >
            <Text className="text-white font-pmedium">{displayDays()}</Text>
            <FontAwesome5 name="chevron-down" size={16} color="#CDCDE0" />
          </TouchableOpacity>
        </View>
        
        {/* Exercises Section */}
        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-xl font-psemibold">Exercises</Text>
            <TouchableOpacity 
              className="bg-secondary flex-row items-center px-3 py-2 rounded-lg"
              onPress={() => router.push('/home')}
            >
              <FontAwesome5 name="plus" size={14} color="#FFF" />
              <Text className="text-white font-pmedium ml-2">Add Exercise</Text>
            </TouchableOpacity>
          </View>
          
          {workout.exercises.length === 0 ? (
            <View className="bg-black-100 rounded-xl p-6 items-center">
              <MaterialCommunityIcons name="dumbbell" size={50} color="#A742FF" />
              <Text className="text-white font-pmedium text-center mt-4">
                No exercises added yet
              </Text>
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
      
      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={{ position: 'absolute', inset: 0 }} />
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View className="bg-black-100 rounded-t-3xl border-t-2 border-secondary-100">
              <View className="w-16 h-1 bg-gray-100 rounded-full mx-auto my-4" />
              
              <Text className="text-white text-xl font-psemibold text-center mb-4">
                Select Days
              </Text>
              
              <ScrollView className="max-h-96">
                {daysOfWeek.map((day) => {
                  const isSelected = workout.days.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      className={`p-4 border-b border-black-200 ${isSelected ? 'bg-black-200' : ''}`}
                      onPress={() => toggleDay(day)}
                    >
                      <Text className={`text-lg font-pmedium ${isSelected ? 'text-secondary' : 'text-white'}`}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              <TouchableOpacity
                className="bg-black-200 m-4 p-4 rounded-xl"
                onPress={() => setShowDayPicker(false)}
              >
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
