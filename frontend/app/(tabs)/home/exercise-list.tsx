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
import { router, useLocalSearchParams } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { loadExercises } from "@/utils/loadExercises";
import { setTempExercises } from "@/utils/exerciseBuffer";
import CustomDropdown, { DropdownOption } from "@/components/CustomDropdown";
import { SafeAreaView } from "react-native-safe-area-context";
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

const ExerciseList = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const params = useLocalSearchParams();
  const isReplaceMode = params.isReplaceMode === "true" || false;
  const replaceIndex = params.replaceIndex ? Number(params.replaceIndex) : null;
  const returnTo = params.returnTo as string;

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
  
  // Load exercises from JSON file
  useEffect(() => {
    setLoading(true);
    const parsed = loadExercises();
    setExercises(parsed);
    setLoading(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredExercises = exercises
    .filter((exercise) => {
      const {
        primaryMuscles,
        equipment,
        level,
        force_measure,
        mechanic,
        category,
      } = selectedFilters;
      return (
        (!primaryMuscles ||
          (exercise.primaryMuscles &&
            exercise.primaryMuscles
              .toLowerCase()
              .includes(primaryMuscles.toLowerCase()))) &&
        (!equipment ||
          exercise.equipment.toLowerCase() === equipment.toLowerCase()) &&
        (!level || exercise.level.toLowerCase() === level.toLowerCase()) &&
        (!force_measure ||
          (exercise.force_measure !== "unknown" &&
            exercise.force_measure.toLowerCase() ===
              force_measure.toLowerCase())) &&
        (!mechanic ||
          exercise.mechanic.toLowerCase() === mechanic.toLowerCase()) &&
        (!category ||
          exercise.category.toLowerCase() === category.toLowerCase()) &&
        (!searchTerm ||
          exercise.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(filteredExercises.length / itemsPerPage);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getUniqueValues = (field: keyof Exercise): DropdownOption[] => {
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

    const sortedValues = Array.from(values).sort();
    return sortedValues.map((value) => ({
      label: capitalizeWords(value),
      value: value,
    }));
  };

  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleAddOrReplace = () => {
    if (selectedExercises.length === 0) {
      Alert.alert(
        "No exercises selected!",
        "Please select at least one exercise."
      );
      return;
    }

    // Get the selected exercise objects
    const selectedExerciseObjects = exercises.filter((ex) =>
      selectedExercises.includes(ex.id)
    );

    if (isReplaceMode && replaceIndex !== null) {
      // TODO: Handle replace mode if needed
      router.back();
    } else {
      // Store exercises in temporary buffer and navigate back
      // This maintains clean navigation stack while passing data
      setTempExercises(selectedExerciseObjects);
      router.back();
    }
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

  const handleFilterChange = (
    field: keyof typeof selectedFilters,
    value: string
  ) => {
    setSelectedFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const createDropdownOptions = (
    field: keyof Exercise,
    placeholder: string
  ): DropdownOption[] => {
    return [{ label: placeholder, value: "" }, ...getUniqueValues(field)];
  };

  const handleImageClick = (exerciseId: string, event: any) => {
    event.stopPropagation();
    router.push({
      pathname: "/home/exercise-detail",
      params: { id: exerciseId }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Header
              MText="Exercise List"
              SText={
                loading
                  ? "Loading..."
                  : `${exercises.length} exercises available`
              }
            />
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
              <MaterialCommunityIcons
                name="filter"
                size={20}
                color={primaryColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-2 rounded-lg"
              onPress={handleAddOrReplace}
            >
              <Text className="text-white font-pmedium">
                {isReplaceMode ? "Replace" : "Add to Workout"}
                {selectedExercises.length > 0 && ` (${selectedExercises.length})`}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <View className="flex-1">
              <CustomDropdown
                placeholder="Any Muscles"
                value={selectedFilters.primaryMuscles}
                options={createDropdownOptions("primaryMuscles", "Any Muscles")}
                onSelect={(value) =>
                  handleFilterChange("primaryMuscles", value)
                }
                primaryColor={primaryColor}
              />
            </View>

            <View className="flex-1">
              <CustomDropdown
                placeholder="Any Equipment"
                value={selectedFilters.equipment}
                options={createDropdownOptions("equipment", "Any Equipment")}
                onSelect={(value) => handleFilterChange("equipment", value)}
                primaryColor={primaryColor}
              />
            </View>

            <View className="flex-1">
              <CustomDropdown
                placeholder="Any Difficulty"
                value={selectedFilters.level}
                options={createDropdownOptions("level", "Any Difficulty")}
                onSelect={(value) => handleFilterChange("level", value)}
                primaryColor={primaryColor}
              />
            </View>
          </View>

          {showAdditionalFilters && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 8,
              }}
            >
              <View className="flex-1">
                <CustomDropdown
                  placeholder="Any Force"
                  value={selectedFilters.force_measure}
                  options={createDropdownOptions("force_measure", "Any Force")}
                  onSelect={(value) =>
                    handleFilterChange("force_measure", value)
                  }
                  primaryColor={primaryColor}
                />
              </View>

              <View className="flex-1">
                <CustomDropdown
                  placeholder="Any Mechanic"
                  value={selectedFilters.mechanic}
                  options={createDropdownOptions("mechanic", "Any Mechanic")}
                  onSelect={(value) => handleFilterChange("mechanic", value)}
                  primaryColor={primaryColor}
                />
              </View>

              <View className="flex-1">
                <CustomDropdown
                  placeholder="Any Category"
                  value={selectedFilters.category}
                  options={createDropdownOptions("category", "Any Category")}
                  onSelect={(value) => handleFilterChange("category", value)}
                  primaryColor={primaryColor}
                />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={primaryColor} />
            <Text className="text-white mt-4">Loading exercises...</Text>
          </View>
        ) : filteredExercises.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MaterialCommunityIcons
              name="dumbbell"
              size={50}
              color={primaryColor}
            />
            <Text className="text-white font-pmedium text-lg mt-4">
              No exercises found
            </Text>
            <Text className="text-gray-100 text-center mt-2">
              Try adjusting your filters or search terms
            </Text>
            <Text className="text-gray-100 text-sm mt-4">
              {exercises.length} total exercises available
            </Text>
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
                    backgroundColor: isSelected
                      ? `${primaryColor}20`
                      : tertiaryColor,
                    borderWidth: isSelected ? 1 : 0,
                    borderColor: isSelected ? primaryColor : "transparent",
                  }}
                  onPress={() => handleExerciseClick(exercise.id)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={(event) => handleImageClick(exercise.id, event)}
                    activeOpacity={0.8}
                  >
                    {images.length > 0 ? (
                      <>
                        <Image
                          source={images[0]}
                          style={[
                            styles.exerciseImage,
                            { opacity: imageIndex === 0 ? 1 : 0 },
                          ]}
                          resizeMode="cover"
                        />
                        {images.length > 1 && (
                          <Image
                            source={images[1]}
                            style={[
                              styles.exerciseImage,
                              { opacity: imageIndex === 1 ? 1 : 0 },
                            ]}
                            resizeMode="cover"
                          />
                        )}
                      </>
                    ) : (
                      <View className="w-full h-full rounded-lg bg-black-200 items-center justify-center">
                        <MaterialCommunityIcons
                          name="dumbbell"
                          size={30}
                          color="#7b7b8b"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-lg">
                      {exercise.name}
                    </Text>
                    <Text
                      style={{ color: primaryColor }}
                      className="text-sm mt-1"
                    >
                      <Text className="font-semibold">Target Muscle:</Text>{" "}
                      <Text className="text-gray-100">
                        {exercise.primaryMuscles}
                      </Text>
                    </Text>
                    {exercise.secondaryMuscles && (
                      <Text style={{ color: primaryColor }} className="text-sm">
                        <Text className="font-semibold">Secondary:</Text>{" "}
                        <Text className="text-gray-100">
                          {exercise.secondaryMuscles}
                        </Text>
                      </Text>
                    )}
                  </View>
                  <View className="justify-center">
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center`}
                      style={{
                        borderColor: primaryColor,
                        backgroundColor: isSelected
                          ? primaryColor
                          : "transparent",
                      }}
                    >
                      {isSelected && (
                        <FontAwesome5 name="check" size={10} color="white" />
                      )}
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
          <TouchableOpacity
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2"
          >
            <FontAwesome5
              name="chevron-left"
              size={16}
              color={currentPage === 1 ? "#7b7b8b" : "white"}
            />
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
                      backgroundColor:
                        pageNumber === currentPage ? primaryColor : "#232533",
                    }}
                  >
                    <Text className="text-white">{pageNumber}</Text>
                  </TouchableOpacity>
                );
              }
              return null;
            })}
          </View>
          <TouchableOpacity
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2"
          >
            <FontAwesome5
              name="chevron-right"
              size={16}
              color={currentPage === totalPages ? "#7b7b8b" : "white"}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 96,
    height: 96,
    marginRight: 16,
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "#232533",
  },
  exerciseImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    borderRadius: 8,
  }
});

export default ExerciseList;