import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { exerciseImageMap } from "@/app/utils/exerciseImageMap";
import exercisesData from "@/assets/exercises.json";

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

const ExerciseList = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const params = useLocalSearchParams();
  const isReplaceMode = params.isReplaceMode === "true" || false;
  const replaceIndex = params.replaceIndex ? Number(params.replaceIndex) : null;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    primaryMuscles: "",
    equipment: "",
    level: "",
    force_measure: "",
    mechanic: "",
    category: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  const itemsPerPage = 5;

  useEffect(() => {
    const loadExercises = () => {
      try {
        setLoading(true);
        type Row =
          | { type: "header"; version: string; comment: string }
          | { type: "database"; name: string }
          | { type: "table"; name: string; database: string; data: any[] };
        const rows = exercisesData as unknown as Row[];
        const tableRow = rows.find(
          (row): row is Extract<Row, { type: "table" }> =>
            row.type === "table" && Array.isArray((row as any).data)
        );
        const exerciseArray: any[] = tableRow?.data ?? [];
        const parsedExercises: Exercise[] = exerciseArray.map((exercise) => {
          let images: string[] = [];
          if (typeof exercise.images === "string") {
            try {
              images = JSON.parse(exercise.images);
            } catch {
              images = [];
            }
          } else if (Array.isArray(exercise.images)) {
            images = exercise.images;
          }
          const numericImages = images
            .map((p) => exerciseImageMap[p])
            .filter(Boolean) as number[];
          return { ...exercise, images: numericImages };
        });
        setExercises(parsedExercises);
      } catch (error) {
        console.error("Error loading exercises:", error);
      } finally {
        setLoading(false);
      }
    };
    loadExercises();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredExercises = exercises
    .filter((exercise) => {
      const { primaryMuscles, equipment, level, force_measure, mechanic, category } = selectedFilters;
      return (
        (!primaryMuscles ||
          (exercise.primaryMuscles && exercise.primaryMuscles.toLowerCase().includes(primaryMuscles.toLowerCase()))) &&
        (!equipment || exercise.equipment.toLowerCase() === equipment.toLowerCase()) &&
        (!level || exercise.level.toLowerCase() === level.toLowerCase()) &&
        (!force_measure ||
          (exercise.force_measure !== "unknown" && exercise.force_measure.toLowerCase() === force_measure.toLowerCase())) &&
        (!mechanic || exercise.mechanic.toLowerCase() === mechanic.toLowerCase()) &&
        (!category || exercise.category.toLowerCase() === category.toLowerCase()) &&
        (!searchTerm || exercise.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fixed getUniqueValues function with proper capitalization
  const getUniqueValues = (field: keyof Exercise) => {
    const values = new Set<string>();
    exercises.forEach((ex) => {
      const value = ex[field];
      if (value && typeof value === "string" && value !== "unknown") {
        if (field === "primaryMuscles" || field === "secondaryMuscles") {
          value.split(",").forEach((v) => {
            const trimmed = v.trim();
            if (trimmed) values.add(trimmed);
          });
        } else {
          values.add(value);
        }
      }
    });
    return Array.from(values).sort();
  };

  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  };

  const goBack = () => {
    router.back();
  };

  const handleAddOrReplace = () => {
    if (selectedExercises.length === 0) {
      Alert.alert("No exercises selected!", "Please select at least one exercise.");
      return;
    }
    
    const selectedExerciseObjects = exercises.filter((ex) => selectedExercises.includes(ex.id));
    
    if (isReplaceMode && replaceIndex !== null) {
      // TODO: Replace exercise at specific index in workout
      console.log("Replacing exercise at index:", replaceIndex, "with:", selectedExerciseObjects[0]);
    } else {
      // TODO: Add exercises to workout
      console.log("Adding exercises to workout:", selectedExerciseObjects);
    }
    
    router.back();
  };

  const handleExerciseClick = (exerciseId: string) => {
    if (isReplaceMode) {
      setSelectedExercises([exerciseId]);
    } else {
      setSelectedExercises((prev) => {
        if (prev.includes(exerciseId)) {
          return prev.filter((id) => id !== exerciseId);
        } else {
          return [...prev, exerciseId];
        }
      });
    }
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (field: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      <View className="px-4 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1 flex-row items-center">
            <TouchableOpacity onPress={goBack} className="mr-3">
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-white font-psemibold text-2xl">Exercise List</Text>
              <Text className="text-gray-100 text-sm">
                {loading ? "Loading..." : `${exercises.length} exercises available`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={goBack}
            className="w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <FontAwesome5 name="times" size={12} color="white" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row items-center justify-between mb-2">
          <TextInput
            className="flex-1 bg-black-100 border border-black-200 text-white rounded-lg px-3 py-2 mr-2"
            placeholder="Search exercises..."
            placeholderTextColor="#7b7b8b"
            value={searchTerm}
            onChangeText={handleSearch}
          />
          <TouchableOpacity
            onPress={() => setShowAdditionalFilters(!showAdditionalFilters)}
            className="p-2 bg-black-100 border border-black-200 rounded-lg mr-2"
          >
            <MaterialCommunityIcons name="filter" size={20} color={primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: primaryColor }}
            className="px-4 py-2 rounded-lg"
            onPress={handleAddOrReplace}
          >
            <Text className="text-white font-pmedium">
              {isReplaceMode ? "Replace" : "Add to Workout"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fixed filter row with proper theme colors */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <View className="flex-1 bg-black-100 border border-black-200 rounded-lg overflow-hidden">
            <Picker
              selectedValue={selectedFilters.primaryMuscles}
              onValueChange={(value) => handleFilterChange('primaryMuscles', value)}
              style={{ color: "white", height: 40 }}
              dropdownIconColor={primaryColor}
            >
              <Picker.Item label="Any Muscles" value="" />
              {getUniqueValues("primaryMuscles").map((muscle) => (
                <Picker.Item key={muscle} label={capitalizeWords(muscle)} value={muscle} />
              ))}
            </Picker>
          </View>
          
          <View className="flex-1 bg-black-100 border border-black-200 rounded-lg overflow-hidden">
            <Picker
              selectedValue={selectedFilters.equipment}
              onValueChange={(value) => handleFilterChange('equipment', value)}
              style={{ color: "white", height: 40 }}
              dropdownIconColor={primaryColor}
            >
              <Picker.Item label="Any Equipment" value="" />
              {getUniqueValues("equipment").map((eq) => (
                <Picker.Item key={eq} label={capitalizeWords(eq)} value={eq} />
              ))}
            </Picker>
          </View>
          
          <View className="flex-1 bg-black-100 border border-black-200 rounded-lg overflow-hidden">
            <Picker
              selectedValue={selectedFilters.level}
              onValueChange={(value) => handleFilterChange('level', value)}
              style={{ color: "white", height: 40 }}
              dropdownIconColor={primaryColor}
            >
              <Picker.Item label="Any Difficulty" value="" />
              {getUniqueValues("level").map((lvl) => (
                <Picker.Item key={lvl} label={capitalizeWords(lvl)} value={lvl} />
              ))}
            </Picker>
          </View>
        </View>

        {showAdditionalFilters && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
            <View className="flex-1 bg-black-100 border border-black-200 rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedFilters.force_measure}
                onValueChange={(value) => handleFilterChange('force_measure', value)}
                style={{ color: "white", height: 40 }}
                dropdownIconColor={primaryColor}
              >
                <Picker.Item label="Any Force" value="" />
                {getUniqueValues("force_measure").map((force) => (
                  <Picker.Item key={force} label={capitalizeWords(force)} value={force} />
                ))}
              </Picker>
            </View>
            
            <View className="flex-1 bg-black-100 border border-black-200 rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedFilters.mechanic}
                onValueChange={(value) => handleFilterChange('mechanic', value)}
                style={{ color: "white", height: 40 }}
                dropdownIconColor={primaryColor}
              >
                <Picker.Item label="Any Mechanic" value="" />
                {getUniqueValues("mechanic").map((m) => (
                  <Picker.Item key={m} label={capitalizeWords(m)} value={m} />
                ))}
              </Picker>
            </View>
            
            <View className="flex-1 bg-black-100 border border-black-200 rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedFilters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
                style={{ color: "white", height: 40 }}
                dropdownIconColor={primaryColor}
              >
                <Picker.Item label="Any Category" value="" />
                {getUniqueValues("category").map((c) => (
                  <Picker.Item key={c} label={capitalizeWords(c)} value={c} />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="text-white mt-4">Loading exercises...</Text>
          </View>
        ) : filteredExercises.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MaterialCommunityIcons name="dumbbell" size={50} color={primaryColor} />
            <Text className="text-white font-pmedium text-lg mt-4">No exercises found</Text>
            <Text className="text-gray-100 text-center mt-2">Try adjusting your filters or search terms</Text>
            <Text className="text-gray-100 text-sm mt-4">{exercises.length} total exercises available</Text>
          </View>
        ) : (
          <View>
            {paginatedExercises.map((exercise) => {
              const images = exercise.images;
              const isSelected = selectedExercises.includes(exercise.id);
              return (
                <TouchableOpacity
                  key={exercise.id}
                  className={`flex-row p-3 rounded-lg mb-3`}
                  style={{ 
                    backgroundColor: isSelected ? `${primaryColor}20` : tertiaryColor,
                    borderWidth: isSelected ? 1 : 0,
                    borderColor: isSelected ? primaryColor : 'transparent'
                  }}
                  onPress={() => handleExerciseClick(exercise.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.imageContainer}>
                    {images.length > 0 ? (
                      <>
                        <Image
                          source={images[0]}
                          style={[styles.exerciseImage, { opacity: imageIndex === 0 ? 1 : 0 }]}
                          resizeMode="cover"
                        />
                        {images.length > 1 && (
                          <Image
                            source={images[1]}
                            style={[styles.exerciseImage, { opacity: imageIndex === 1 ? 1 : 0 }]}
                            resizeMode="cover"
                          />
                        )}
                      </>
                    ) : (
                      <View className="w-full h-full rounded-lg bg-black-200 items-center justify-center">
                        <MaterialCommunityIcons name="dumbbell" size={30} color="#7b7b8b" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-lg">{exercise.name}</Text>
                    <Text style={{ color: primaryColor }} className="text-sm mt-1">
                      <Text className="font-semibold">Target Muscle:</Text> <Text className="text-gray-100">{exercise.primaryMuscles}</Text>
                    </Text>
                    {exercise.secondaryMuscles && (
                      <Text style={{ color: primaryColor }} className="text-sm">
                        <Text className="font-semibold">Secondary:</Text> <Text className="text-gray-100">{exercise.secondaryMuscles}</Text>
                      </Text>
                    )}
                  </View>
                  <View className="justify-center">
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center`}
                      style={{
                        borderColor: primaryColor,
                        backgroundColor: isSelected ? primaryColor : 'transparent'
                      }}
                    >
                      {isSelected && <FontAwesome5 name="check" size={10} color="white" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {filteredExercises.length > 0 && (
        <View className="flex-row justify-between items-center bg-black-100 p-4">
          <TouchableOpacity onPress={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2">
            <FontAwesome5 name="chevron-left" size={16} color={currentPage === 1 ? "#7b7b8b" : "white"} />
          </TouchableOpacity>
          <View className="flex-row items-center">
            {Array.from({ length: Math.min(7, totalPages) }, (_, idx) => {
              const pageNumber = currentPage - 3 + idx;
              if (pageNumber > 0 && pageNumber <= totalPages) {
                return (
                  <TouchableOpacity
                    key={pageNumber}
                    onPress={() => handlePageChange(pageNumber)}
                    className={`px-3 py-1 mx-1 rounded-lg`}
                    style={{
                      backgroundColor: pageNumber === currentPage ? primaryColor : "#232533"
                    }}
                  >
                    <Text className="text-white">{pageNumber}</Text>
                  </TouchableOpacity>
                );
              }
              return null;
            })}
          </View>
          <TouchableOpacity onPress={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2">
            <FontAwesome5 name="chevron-right" size={16} color={currentPage === totalPages ? "#7b7b8b" : "white"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 96, // w-24 equivalent (24 * 4 = 96px)
    height: 96, // h-24 equivalent
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#232533', // fallback background
  },
  exerciseImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});

export default ExerciseList;