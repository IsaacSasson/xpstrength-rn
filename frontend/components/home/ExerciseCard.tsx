// Path: /components/home/ExerciseCard.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  LayoutChangeEvent,
  ScrollView,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import { router } from "expo-router";
import { loadExercises } from "@/utils/loadExercises";
import ReorderModal from "./ReorderModal";
import DraggableBottomSheet from "../DraggableBottomSheet";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */
export interface ExerciseSet {
  reps: string;
  weight: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes: string;
  originalExerciseId?: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onUpdate: (id: string, field: keyof Exercise, value: any) => void;
  onRemove: (id: string) => void;
  onReplace: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onReorderComplete: (reorderedExercises: Exercise[]) => void;
  totalExercises: number;
  allExercises: Exercise[]; // Added for reorder modal
}

/* -------------------------------------------------------------------------- */
/*                             Expandable Section                              */
/* -------------------------------------------------------------------------- */
const ExpandableSection: React.FC<{
  isExpanded: boolean;
  children: React.ReactNode;
}> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) setContentHeight(height);
  };

  useEffect(() => {
    if (contentHeight > 0) {
      Animated.timing(animation, {
        toValue: isExpanded ? contentHeight : 0,
        duration: isExpanded ? 300 : 0,
        useNativeDriver: false,
      }).start();
    }
  }, [isExpanded, contentHeight]);

  return (
    <Animated.View
      style={{ height: isExpanded ? undefined : animation, overflow: "hidden" }}
    >
      <View onLayout={onMeasure}>{children}</View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Exercise Card                                  */
/* -------------------------------------------------------------------------- */
const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  onUpdate,
  onRemove,
  onReplace,
  onReorder,
  onReorderComplete,
  totalExercises,
  allExercises,
}) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const { convertWeight, parseWeight, formatWeight, convertWeightString, unitSystem } = useWorkouts();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [exerciseImages, setExerciseImages] = useState<number[]>([]);
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (exercise.originalExerciseId) {
      const exercises = loadExercises();
      const originalExercise = exercises.find(
        (ex: any) => ex.id === exercise.originalExerciseId
      );
      if (originalExercise && originalExercise.images) {
        setExerciseImages(originalExercise.images);
      }
    }
  }, [exercise.originalExerciseId]);

  useEffect(() => {
    if (exerciseImages.length > 1) {
      const interval = setInterval(() => {
        setImageIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [exerciseImages]);

  const handleToggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const handleRemove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Remove Exercise",
      `Remove "${exercise.name}" from your workout?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowOptionsModal(false);
            onRemove(exercise.id);
          },
        },
      ]
    );
  };

  const handleReplace = () => {
    setShowOptionsModal(false);
    onReplace(exercise.id);
  };

  const handleShowReorder = () => {
    setShowOptionsModal(false);
    setShowReorderModal(true);
  };

  const handleSetUpdate = (
    setIndex: number,
    field: keyof ExerciseSet,
    value: string
  ) => {
    const newSets = [...exercise.sets];
    
    if (field === "weight") {
      // Convert the entered value to the user's preferred unit format
      const convertedValue = convertWeightString(value, unitSystem);
      newSets[setIndex] = { ...newSets[setIndex], [field]: convertedValue };
    } else {
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    }
    
    onUpdate(exercise.id, "sets", newSets);
  };

  const handleAddSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const weightUnit = unitSystem === "metric" ? "kg" : "lbs";
    const newSets = [...exercise.sets, { reps: "10", weight: `0 ${weightUnit}` }];
    onUpdate(exercise.id, "sets", newSets);
  };

  const handleRemoveSet = (setIndex: number) => {
    if (exercise.sets.length <= 1) {
      Alert.alert("Cannot Remove", "Exercise must have at least one set.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSets = exercise.sets.filter((_, index) => index !== setIndex);
    onUpdate(exercise.id, "sets", newSets);
  };

  const handleShowOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowOptionsModal(true);
  };

  const handleViewInstructions = () => {
    if (exercise.originalExerciseId) {
      setShowOptionsModal(false);
      router.push({
        pathname: "/home/exercise-detail",
        params: { id: exercise.originalExerciseId, scrollTo: "bottom" },
      });
    } else {
      Alert.alert(
        "No Instructions",
        "Exercise instructions are not available for this exercise."
      );
    }
  };

  const animatePress = (pressed: boolean) => {
    Animated.spring(scaleAnimation, {
      toValue: pressed ? 0.98 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getStatsDisplay = () => {
    const repsArray = exercise.sets.map((set) => parseInt(set.reps) || 0);
    const weightsArray = exercise.sets.map((set) => {
      const parsed = parseWeight(set.weight);
      return parsed.value;
    });

    const minReps = Math.min(...repsArray);
    const maxReps = Math.max(...repsArray);
    const minWeight = Math.min(...weightsArray);
    const maxWeight = Math.max(...weightsArray);

    const repsDisplay =
      minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;
    
    // Format weights in user's preferred unit
    const minWeightFormatted = formatWeight(minWeight, unitSystem);
    const maxWeightFormatted = formatWeight(maxWeight, unitSystem);
    const weightDisplay = minWeight === maxWeight 
      ? minWeightFormatted.replace(/\s(kg|lbs)/, '')
      : `${minWeightFormatted.replace(/\s(kg|lbs)/, '')}-${maxWeightFormatted.replace(/\s(kg|lbs)/, '')}`;
    
    const weightUnit = unitSystem === "metric" ? "kg" : "lbs";

    return `${exercise.sets.length} sets • ${repsDisplay} reps • ${weightDisplay} ${weightUnit}`;
  };

  const weightUnit = unitSystem === "metric" ? "kg" : "lbs";

  return (
    <>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnimation }],
          marginBottom: 16,
        }}
      >
        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: tertiaryColor,
            borderWidth: isExpanded ? 1 : 0,
            borderColor: isExpanded ? primaryColor + "30" : "transparent",
          }}
        >
          {/* Header */}
          <TouchableOpacity
            onPress={handleToggleExpand}
            onPressIn={() => animatePress(true)}
            onPressOut={() => animatePress(false)}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              minHeight: 72,
            }}
          >
            {/* Exercise Image Badge */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                marginRight: 12,
                overflow: "hidden",
                backgroundColor: "#232533",
              }}
            >
              {exerciseImages.length > 0 ? (
                <>
                  <Image
                    source={exerciseImages[0]}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      opacity: imageIndex === 0 ? 1 : 0,
                    }}
                    resizeMode="cover"
                  />
                  {exerciseImages.length > 1 && (
                    <Image
                      source={exerciseImages[1]}
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        opacity: imageIndex === 1 ? 1 : 0,
                      }}
                      resizeMode="cover"
                    />
                  )}
                </>
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: primaryColor,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
                  >
                    {index + 1}
                  </Text>
                </View>
              )}
            </View>

            {/* Exercise Info */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
              <Text style={{ color: "#CDCDE0", fontSize: 14 }}>
                {getStatsDisplay()}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={handleShowOptions}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#CDCDE015",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                }}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="ellipsis-h" size={14} color="#CDCDE0" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleExpand}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#CDCDE015",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.7}
              >
                <FontAwesome5
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="#CDCDE0"
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Expandable Details */}
          <ExpandableSection isExpanded={isExpanded}>
            <View style={{ padding: 16, paddingTop: 0 }}>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#232533",
                  marginBottom: 16,
                }}
              />

              <View style={{ gap: 12 }}>
                {exercise.sets.map((set, setIndex) => (
                  <View
                    key={setIndex}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#232533",
                      borderRadius: 12,
                      padding: 12,
                      gap: 12,
                    }}
                  >
                    {/* Numbering */}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: primaryColor + "20",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: primaryColor + "40",
                      }}
                    >
                      <Text
                        style={{
                          color: primaryColor,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {setIndex + 1}
                      </Text>
                    </View>

                    <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <TextInput
                          style={{
                            backgroundColor: "#3A3A4A",
                            borderRadius: 8,
                            color: "white",
                            fontSize: 14,
                            padding: 8,
                            textAlign: "center",
                            fontWeight: "500",
                          }}
                          placeholder="10"
                          placeholderTextColor="#7b7b8b"
                          value={set.reps}
                          onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9]/g, "");
                            handleSetUpdate(setIndex, "reps", numericValue);
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text
                          style={{
                            color: "#7b7b8b",
                            fontSize: 12,
                            textAlign: "center",
                            marginTop: 2,
                          }}
                        >
                          reps
                        </Text>
                      </View>

                      <View style={{ flex: 1.5 }}>
                        <TextInput
                          style={{
                            backgroundColor: "#3A3A4A",
                            borderRadius: 8,
                            color: "white",
                            fontSize: 14,
                            padding: 8,
                            textAlign: "center",
                            fontWeight: "500",
                          }}
                          placeholder="0"
                          placeholderTextColor="#7b7b8b"
                          value={parseWeight(set.weight).value.toString()}
                          onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9\.]/g, "");
                            const formattedWeight = numericValue 
                              ? `${numericValue} ${weightUnit}` 
                              : `0 ${weightUnit}`;
                            handleSetUpdate(setIndex, "weight", formattedWeight);
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text
                          style={{
                            color: "#7b7b8b",
                            fontSize: 12,
                            textAlign: "center",
                            marginTop: 2,
                          }}
                        >
                          weight ({weightUnit})
                        </Text>
                      </View>
                    </View>

                    {exercise.sets.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveSet(setIndex)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: "#FF4D4D20",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        activeOpacity={0.7}
                      >
                        <FontAwesome5 name="minus" size={12} color="#FF4D4D" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  onPress={handleAddSet}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: primaryColor + "20",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: primaryColor + "40",
                    borderStyle: "dashed",
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome5 name="plus" size={14} color={primaryColor} />
                  <Text
                    style={{
                      color: primaryColor,
                      fontSize: 14,
                      fontWeight: "500",
                      marginLeft: 8,
                    }}
                  >
                    Add Set
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ExpandableSection>
        </View>
      </Animated.View>

      {/* Options Bottom Sheet */}
      <DraggableBottomSheet
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        heightRatio={0.45}
        primaryColor={primaryColor}
        scrollable
      >
        {[
          {
            label: "View Exercise Instructions",
            icon: "information-outline",
            onPress: handleViewInstructions,
          },
          {
            label: "Replace Exercise",
            icon: "swap-horizontal",
            onPress: handleReplace,
          },
          ...(totalExercises > 1 ? [{
            label: "Reorder Exercises",
            icon: "sort-variant",
            onPress: handleShowReorder,
          }] : []),
          {
            label: "Remove Exercise",
            icon: "delete-outline",
            onPress: handleRemove,
            danger: true,
          },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.label}
            className="flex-row items-center p-4 border-b border-black-200"
            onPress={opt.onPress}
          >
            <MaterialCommunityIcons
              name={opt.icon as any}
              size={24}
              color={(opt as any).danger ? "#FF4D4D" : primaryColor}
            />
            <Text
              className="text-lg font-pmedium ml-3"
              style={{ color: (opt as any).danger ? "#FF4D4D" : "white" }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </DraggableBottomSheet>

      {/* Reorder Modal */}
      <ReorderModal
        visible={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        exercises={allExercises}
        onReorderComplete={onReorderComplete}
        primaryColor={primaryColor}
        tertiaryColor={tertiaryColor}
      />
    </>
  );
};

export default ExerciseCard;