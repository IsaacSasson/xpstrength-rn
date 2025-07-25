import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { loadExercises } from "@/utils/loadExercises";
import Header from "@/components/Header";

interface Exercise {
  id: string;
  name: string;
  force_measure: string;
  level: string;
  mechanic: string;
  equipment: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  instructions: string;
  category: string;
  images: number[];
}

const ExerciseDetail = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const params = useLocalSearchParams();
  const exerciseId = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the specific exercise by ID
    try {
      const exercises = loadExercises();
      const foundExercise = exercises.find((ex: Exercise) => ex.id === exerciseId);
      
      if (foundExercise) {
        setExercise(foundExercise);
      } else {
        // Try to find by name as fallback (in case IDs don't match exactly)
        const exerciseByName = exercises.find((ex: Exercise) => 
          ex.name.toLowerCase().replace(/\s+/g, '-') === exerciseId.toLowerCase() ||
          ex.name.toLowerCase() === exerciseId.toLowerCase()
        );
        
        if (exerciseByName) {
          setExercise(exerciseByName);
        } else {
          setExercise(null);
        }
      }
    } catch (error) {
      console.error("Error loading exercise:", error);
      setExercise(null);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    if (exercise && exercise.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === exercise.images.length - 1 ? 0 : prevIndex + 1
        );
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [exercise]);

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatInstructions = (instructions: string) => {
    // Split by "., " (period, comma, space) and filter out empty strings
    return instructions
      .split('., ')
      .filter(sentence => sentence.trim().length > 0)
      .map(sentence => sentence.trim());
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6 pb-4">
            <View className="flex-row items-center mb-4">
              <Text className="text-white font-psemibold text-xl">Loading...</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6 pb-4">
            <View className="flex-row items-center mb-4">
              <Header
                MText="Exercise Not Found"
                SText={`Could not find exercise with ID: ${exerciseId}`}
              />
            </View>
          </View>
        </SafeAreaView>
        <View className="flex-1 px-4 pt-6 items-center justify-center">
          <MaterialCommunityIcons
            name="dumbbell"
            size={80}
            color={primaryColor}
          />
          <Text className="text-white font-psemibold text-xl mt-4 text-center">
            Exercise Not Found
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            The exercise you're looking for could not be found in the database.
          </Text>
          <Text className="text-gray-100 text-center mt-1 text-sm">
            Exercise ID: {exerciseId}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row items-center mb-4">
            <Header
              MText={exercise.name}
              SText={`${capitalizeWords(exercise.category)} • ${capitalizeWords(exercise.level)}`}
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Exercise Images */}
        <View style={styles.imageContainer}>
          {exercise.images.length > 0 ? (
            <>
              {exercise.images.map((image, index) => (
                <Image
                  key={index}
                  source={image}
                  style={[
                    styles.exerciseImage,
                    { opacity: currentImageIndex === index ? 1 : 0 }
                  ]}
                  resizeMode="cover"
                />
              ))}
              {exercise.images.length > 1 && (
                <View style={styles.imageIndicator}>
                  {exercise.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: currentImageIndex === index 
                            ? primaryColor 
                            : 'rgba(255,255,255,0.3)'
                        }
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View className="w-full h-full rounded-lg bg-black-200 items-center justify-center">
              <MaterialCommunityIcons
                name="dumbbell"
                size={60}
                color="#7b7b8b"
              />
            </View>
          )}
        </View>

        {/* Exercise Details */}
        <View className="mt-6">
          {/* Primary Muscles */}
          <View 
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: tertiaryColor }}
          >
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons
                name="target"
                size={20}
                color={primaryColor}
              />
              <Text className="text-white font-psemibold text-lg ml-2">
                Primary Muscles
              </Text>
            </View>
            <Text className="text-gray-100 text-base">
              {capitalizeWords(exercise.primaryMuscles)}
            </Text>
          </View>

          {/* Secondary Muscles */}
          {exercise.secondaryMuscles && (
            <View 
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: tertiaryColor }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialCommunityIcons
                  name="target-variant"
                  size={20}
                  color={primaryColor}
                />
                <Text className="text-white font-psemibold text-lg ml-2">
                  Secondary Muscles
                </Text>
              </View>
              <Text className="text-gray-100 text-base">
                {capitalizeWords(exercise.secondaryMuscles)}
              </Text>
            </View>
          )}

          {/* Equipment & Details */}
          <View 
            className="rounded-xl p-4 mb-4"
            style={{ backgroundColor: tertiaryColor }}
          >
            <View className="flex-row items-center mb-3">
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={primaryColor}
              />
              <Text className="text-white font-psemibold text-lg ml-2">
                Exercise Details
              </Text>
            </View>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-100 font-pmedium">Equipment:</Text>
                <Text className="text-white">{capitalizeWords(exercise.equipment)}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-100 font-pmedium">Difficulty:</Text>
                <Text className="text-white">{capitalizeWords(exercise.level)}</Text>
              </View>
              
              {exercise.mechanic && exercise.mechanic !== "unknown" && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-100 font-pmedium">Mechanic:</Text>
                  <Text className="text-white">{capitalizeWords(exercise.mechanic)}</Text>
                </View>
              )}
              
              {exercise.force_measure && exercise.force_measure !== "unknown" && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-100 font-pmedium">Force:</Text>
                  <Text className="text-white">{capitalizeWords(exercise.force_measure)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Instructions */}
          {exercise.instructions && (
            <View 
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: tertiaryColor }}
            >
              <View className="flex-row items-center mb-3">
                <MaterialCommunityIcons
                  name="format-list-numbered"
                  size={20}
                  color={primaryColor}
                />
                <Text className="text-white font-psemibold text-lg ml-2">
                  Instructions
                </Text>
              </View>
              
              {formatInstructions(exercise.instructions).map((instruction, index, array) => (
                <View key={index} className="flex-row mb-2">
                  <Text style={{ color: primaryColor }} className="font-pmedium mr-2">
                    {index + 1}.
                  </Text>
                  <Text className="text-gray-100 flex-1 leading-5">
                    {instruction}{index === array.length - 1 ? '' : '.'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#232533',
  },
  exerciseImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default ExerciseDetail;