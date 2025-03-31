// Path: /app/(workout)/exercise-list.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";

// Mock exercise data - you can expand this with more exercises if needed
const MOCK_EXERCISES = [
  {
    exercise_id: "1",
    name: "3/4 Sit-Up",
    primaryMuscles: "abdominals",
    secondaryMuscles: "",
    equipment: "bodyweight",
    level: "beginner",
  },
  {
    exercise_id: "2",
    name: "90/90 Hamstring",
    primaryMuscles: "hamstrings",
    secondaryMuscles: "calves",
    equipment: "bodyweight",
    level: "beginner",
  },
  {
    exercise_id: "3",
    name: "Ab Crunch Machine",
    primaryMuscles: "abdominals",
    secondaryMuscles: "",
    equipment: "machine",
    level: "intermediate",
  },
  {
    exercise_id: "4",
    name: "Ab Roller",
    primaryMuscles: "abdominals",
    secondaryMuscles: "shoulders, arms",
    equipment: "equipment",
    level: "advanced",
  },
  {
    exercise_id: "5",
    name: "Barbell Bench Press",
    primaryMuscles: "chest",
    secondaryMuscles: "triceps, shoulders",
    equipment: "barbell",
    level: "intermediate",
  },
  {
    exercise_id: "6",
    name: "Barbell Deadlift",
    primaryMuscles: "back",
    secondaryMuscles: "hamstrings, glutes, traps",
    equipment: "barbell",
    level: "advanced",
  },
  {
    exercise_id: "7",
    name: "Barbell Squat",
    primaryMuscles: "quads",
    secondaryMuscles: "glutes, hamstrings, calves",
    equipment: "barbell",
    level: "intermediate",
  },
  {
    exercise_id: "8",
    name: "Cable Crossover",
    primaryMuscles: "chest",
    secondaryMuscles: "shoulders",
    equipment: "cable",
    level: "intermediate",
  },
];

// Define types for exercise data
interface Exercise {
  exercise_id: string;
  name: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  equipment: string;
  level: string;
}

// Define filter types
type MuscleFilter =
  | "Any Muscles"
  | "abdominals"
  | "back"
  | "chest"
  | "shoulders"
  | "arms"
  | "legs";
type EquipmentFilter =
  | "Any Equipment"
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight";
type DifficultyFilter =
  | "Any Difficulty"
  | "beginner"
  | "intermediate"
  | "advanced";

const ExerciseList = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleFilter>("Any Muscles");
  const [equipmentFilter, setEquipmentFilter] =
    useState<EquipmentFilter>("Any Equipment");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("Any Difficulty");

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [totalExercises, setTotalExercises] = useState(0);

  // Load mock exercises with a simulated delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setExercises(MOCK_EXERCISES);
      setTotalExercises(MOCK_EXERCISES.length);
      setLoading(false);
    }, 1000); // 1 second delay to simulate loading

    return () => clearTimeout(timer);
  }, []);

  // Function to go back
  const goBack = () => {
    router.back();
  };

  // Function to add selected exercises to workout
  const addToWorkout = () => {
    if (selectedExercises.length === 0) {
      Alert.alert(
        "Selection Required",
        "Please select at least one exercise to add to your workout."
      );
      return;
    }

    // Find the selected exercise objects
    const selectedExerciseObjects = exercises.filter((ex) =>
      selectedExercises.includes(ex.exercise_id)
    );

    console.log("Selected exercises:", selectedExerciseObjects);

    // You can implement passing data back to the previous screen here
    router.back();
  };

  // Toggle exercise selection
  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  // Extract all unique muscle groups, equipment types, and difficulty levels from exercises
  const uniqueMuscles = React.useMemo(() => {
    const muscles = new Set<string>();
    exercises.forEach((ex) => {
      // Split by commas for multiple muscles and add each one
      const primaryMuscles = ex.primaryMuscles?.split(",") || [];
      primaryMuscles.forEach((muscle) =>
        muscles.add(muscle.trim().toLowerCase())
      );
    });
    return Array.from(muscles).filter(Boolean);
  }, [exercises]);

  const uniqueEquipment = React.useMemo(() => {
    const equipment = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.equipment) {
        equipment.add(ex.equipment.toLowerCase());
      }
    });
    return Array.from(equipment).filter(Boolean);
  }, [exercises]);

  const uniqueDifficulties = React.useMemo(() => {
    const difficulties = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.level) {
        difficulties.add(ex.level.toLowerCase());
      }
    });
    return Array.from(difficulties).filter(Boolean);
  }, [exercises]);

  // Filter exercises based on search query and filters
  const filteredExercises = exercises.filter((exercise) => {
    // Search filter
    if (
      searchQuery &&
      !exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Muscle filter
    if (muscleFilter !== "Any Muscles") {
      const primaryMuscles = exercise.primaryMuscles?.toLowerCase() || "";
      if (!primaryMuscles.includes(muscleFilter.toLowerCase())) {
        return false;
      }
    }

    // Equipment filter
    if (equipmentFilter !== "Any Equipment") {
      const equipment = exercise.equipment?.toLowerCase() || "";
      if (!equipment.includes(equipmentFilter.toLowerCase())) {
        return false;
      }
    }

    // Difficulty filter
    if (difficultyFilter !== "Any Difficulty") {
      const level = exercise.level?.toLowerCase() || "";
      if (!level.includes(difficultyFilter.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Screen dimensions for better sizing
  const screenWidth = Dimensions.get("window").width;

  // Size and styling for filter buttons
  const getFilterSize = (type: string, filter: string) => {
    let baseSize = screenWidth * 0.28; // Approximately 1/3 of screen minus margins

    // Make selected buttons larger
    if (
      (type === "muscle" && muscleFilter === filter) ||
      (type === "equipment" && equipmentFilter === filter) ||
      (type === "difficulty" && difficultyFilter === filter)
    ) {
      baseSize = screenWidth * 0.33;
    }

    return {
      width: baseSize,
      height: baseSize * 0.55,
    };
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <View className="px-4 pt-12 pb-2">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={goBack} className="mr-3">
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-psemibold text-2xl">
              Exercise List
            </Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: primaryColor }}
            className="px-4 py-2 rounded-lg"
            onPress={addToWorkout}
          >
            <Text className="text-white font-pmedium">Add to Workout</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-100 font-pmedium text-sm">
          Find exercises for your workout •{" "}
          {loading ? "Loading..." : `${totalExercises} exercises available`}
        </Text>
      </View>

      {/* Content Container */}
      <View className="flex-1 px-4 py-4" style={{ backgroundColor: "#0F0E1A" }}>
        {/* Search bar */}
        <View className="flex-row items-center bg-[#1A1726] rounded-lg border border-[#232533] px-4 py-3 mb-5">
          <TextInput
            className="flex-1 text-white font-pregular text-base"
            placeholder="Search exercises"
            placeholderTextColor="#7b7b8b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FontAwesome5 name="search" size={18} color={primaryColor} />
        </View>

        {/* Filter Sections */}
        <View className="mb-3">
          {/* Muscle Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            <TouchableOpacity
              onPress={() => setMuscleFilter("Any Muscles")}
              className="mr-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  muscleFilter === "Any Muscles" ? primaryColor : "#1A1726",
              }}
            >
              <Text className="text-white font-pmedium">Any Muscles</Text>
            </TouchableOpacity>

            {uniqueMuscles.map((muscle) => (
              <TouchableOpacity
                key={`muscle-${muscle}`}
                onPress={() => setMuscleFilter(muscle as MuscleFilter)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor:
                    muscleFilter === muscle ? primaryColor : "#1A1726",
                }}
              >
                <Text className="text-white font-pmedium">
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Equipment Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            <TouchableOpacity
              onPress={() => setEquipmentFilter("Any Equipment")}
              className="mr-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  equipmentFilter === "Any Equipment"
                    ? primaryColor
                    : "#1A1726",
              }}
            >
              <Text className="text-white font-pmedium">Any Equipment</Text>
            </TouchableOpacity>

            {uniqueEquipment.map((equipment) => (
              <TouchableOpacity
                key={`equipment-${equipment}`}
                onPress={() => setEquipmentFilter(equipment as EquipmentFilter)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor:
                    equipmentFilter === equipment ? primaryColor : "#1A1726",
                }}
              >
                <Text className="text-white font-pmedium">
                  {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Difficulty Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            <TouchableOpacity
              onPress={() => setDifficultyFilter("Any Difficulty")}
              className="mr-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  difficultyFilter === "Any Difficulty"
                    ? primaryColor
                    : "#1A1726",
              }}
            >
              <Text className="text-white font-pmedium">Any Difficulty</Text>
            </TouchableOpacity>

            {uniqueDifficulties.map((difficulty) => (
              <TouchableOpacity
                key={`difficulty-${difficulty}`}
                onPress={() =>
                  setDifficultyFilter(difficulty as DifficultyFilter)
                }
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor:
                    difficultyFilter === difficulty ? primaryColor : "#1A1726",
                }}
              >
                <Text className="text-white font-pmedium">
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exercises Found Stats */}
        <View className="mb-3 px-2">
          <Text className="text-gray-100 font-pmedium text-sm">
            {loading
              ? "Loading exercises..."
              : `${filteredExercises.length} of ${totalExercises} exercises`}
          </Text>
        </View>

        {/* Exercise List */}
        <View className="flex-1 bg-[#1A1726] rounded-xl p-4">
          {loading ? (
            <View className="items-center justify-center flex-1">
              <ActivityIndicator size="large" color={primaryColor} />
              <Text className="text-white mt-4 font-pmedium">
                Loading exercises...
              </Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View className="items-center justify-center flex-1 py-8">
              {/* Dumbbell icon using View elements */}
              <View className="mb-5 items-center">
                <View className="flex-row">
                  <View className="h-12 w-4 rounded bg-purple-500 mr-1" />
                  <View className="h-12 w-4 rounded bg-purple-500 mr-1" />
                  <View className="h-12 w-16 rounded-full bg-purple-500" />
                  <View className="h-12 w-4 rounded bg-purple-500 ml-1" />
                  <View className="h-12 w-4 rounded bg-purple-500 ml-1" />
                </View>
              </View>
              <Text className="text-white font-psemibold text-center text-xl mb-2">
                No Exercises Found
              </Text>
              <Text className="text-gray-100 text-center">
                Try adjusting your filters or search query
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.exercise_id}
                  className="flex-row items-center justify-between mb-4 pb-3 border-b border-[#232533]"
                  onPress={() => toggleExerciseSelection(exercise.exercise_id)}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="flex-1">
                      <Text className="text-white font-pmedium text-lg">
                        {exercise.name}
                      </Text>
                      <Text className="text-gray-100 text-sm">
                        Target Muscle: {exercise.primaryMuscles}
                      </Text>
                      {exercise.secondaryMuscles && (
                        <Text className="text-gray-100 text-sm">
                          Secondary Muscles: {exercise.secondaryMuscles}
                        </Text>
                      )}
                      <View className="flex-row mt-1">
                        {exercise.equipment && (
                          <View className="bg-[#232533] px-2 py-1 rounded mr-2">
                            <Text className="text-gray-100 text-xs">
                              {exercise.equipment}
                            </Text>
                          </View>
                        )}
                        {exercise.level && (
                          <View
                            className="px-2 py-1 rounded"
                            style={{
                              backgroundColor:
                                exercise.level.toLowerCase() === "beginner"
                                  ? "#52A843"
                                  : exercise.level.toLowerCase() ===
                                    "intermediate"
                                  ? "#F5A623"
                                  : "#E74C3C",
                            }}
                          >
                            <Text className="text-white text-xs">
                              {exercise.level}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      toggleExerciseSelection(exercise.exercise_id)
                    }
                    className="h-6 w-6 rounded-full border-2 items-center justify-center ml-2"
                    style={{ borderColor: primaryColor }}
                  >
                    {selectedExercises.includes(exercise.exercise_id) && (
                      <View
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              {/* Bottom padding */}
              <View className="h-10" />
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

export default ExerciseList;
