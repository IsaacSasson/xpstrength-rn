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
  Modal,
  ScrollView,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { router } from "expo-router";
import { loadExercises } from "@/utils/loadExercises";

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
  originalExerciseId?: string; // Add this to track the original exercise from the database
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onUpdate: (id: string, field: keyof Exercise, value: any) => void;
  onRemove: (id: string) => void;
}

/* -------------------------------------------------------------------------- */
/*                             Expandable Section                            */
/* -------------------------------------------------------------------------- */
const ExpandableSection: React.FC<{
  isExpanded: boolean;
  children: React.ReactNode;
}> = ({ isExpanded, children }) => {
  const [contentHeight, setContentHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const onMeasure = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      setContentHeight(height);
    }
  };

  useEffect(() => {
    if (contentHeight > 0) {
      Animated.timing(animation, {
        toValue: isExpanded ? contentHeight : 0,
        duration: isExpanded ? 300 : 0, // Instant closing
        useNativeDriver: false,
      }).start();
    }
  }, [isExpanded, contentHeight]);

  return (
    <Animated.View style={{ height: isExpanded ? undefined : animation, overflow: 'hidden' }}>
      <View onLayout={onMeasure}>
        {children}
      </View>
    </Animated.View>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Exercise Card                                */
/* -------------------------------------------------------------------------- */
const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  index,
  onUpdate,
  onRemove,
}) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [exerciseImages, setExerciseImages] = useState<number[]>([]);
  
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  // Load exercise images
  useEffect(() => {
    if (exercise.originalExerciseId) {
      const exercises = loadExercises();
      const originalExercise = exercises.find((ex: any) => ex.id === exercise.originalExerciseId);
      if (originalExercise && originalExercise.images) {
        setExerciseImages(originalExercise.images);
      }
    }
  }, [exercise.originalExerciseId]);

  // Image flickering effect
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

  const handleSetUpdate = (setIndex: number, field: keyof ExerciseSet, value: string) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    onUpdate(exercise.id, "sets", newSets);
  };

  const handleAddSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSets = [...exercise.sets, { reps: "10", weight: "0 lbs" }];
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

  const handleNotesUpdate = (notes: string) => {
    onUpdate(exercise.id, "notes", notes);
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
        params: { id: exercise.originalExerciseId }
      });
    } else {
      Alert.alert("No Instructions", "Exercise instructions are not available for this exercise.");
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

  // Calculate stats for display
  const getStatsDisplay = () => {
    const repsArray = exercise.sets.map(set => parseInt(set.reps) || 0);
    const weightsArray = exercise.sets.map(set => {
      // Extract numbers from weight string (handles "135 lbs", "135", etc.)
      const match = set.weight.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    });

    const minReps = Math.min(...repsArray);
    const maxReps = Math.max(...repsArray);
    const minWeight = Math.min(...weightsArray);
    const maxWeight = Math.max(...weightsArray);

    const repsDisplay = minReps === maxReps ? `${minReps}` : `${minReps}-${maxReps}`;
    const weightDisplay = minWeight === maxWeight ? `${minWeight}` : `${minWeight}-${maxWeight}`;

    return `${exercise.sets.length} sets • ${repsDisplay} reps • ${weightDisplay} lbs`;
  };

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
                overflow: 'hidden',
                backgroundColor: '#232533',
              }}
            >
              {exerciseImages.length > 0 ? (
                <>
                  <Image
                    source={exerciseImages[0]}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      opacity: imageIndex === 0 ? 1 : 0,
                    }}
                    resizeMode="cover"
                  />
                  {exerciseImages.length > 1 && (
                    <Image
                      source={exerciseImages[1]}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: imageIndex === 1 ? 1 : 0,
                      }}
                      resizeMode="cover"
                    />
                  )}
                </>
              ) : (
                <View style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: primaryColor,
                }}>
                  <Text style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}>
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
              
              {/* Quick Stats */}
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
              {/* Separator Line */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#232533",
                  marginBottom: 16,
                }}
              />

              {/* Sets - No scroll limit, let it scale */}
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
                    {/* Nicer set numbering */}
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
                      <Text style={{ color: primaryColor, fontSize: 12, fontWeight: "600" }}>
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
                            const numericValue = text.replace(/[^0-9]/g, '');
                            handleSetUpdate(setIndex, "reps", numericValue);
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text style={{ color: "#7b7b8b", fontSize: 12, textAlign: "center", marginTop: 2 }}>
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
                          value={set.weight.replace(/[^0-9\.]/g, '')}
                          onChangeText={(text) => {
                            const numericValue = text.replace(/[^0-9\.]/g, '');
                            handleSetUpdate(setIndex, "weight", numericValue ? `${numericValue} lbs` : "0 lbs");
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                        />
                        <Text style={{ color: "#7b7b8b", fontSize: 12, textAlign: "center", marginTop: 2 }}>
                          weight (lbs)
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

                {/* Add Set Button */}
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
                  <Text style={{ color: primaryColor, fontSize: 14, fontWeight: "500", marginLeft: 8 }}>
                    Add Set
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ExpandableSection>

          {/* Notes Section - Always Visible */}
          {exercise.notes && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 }}>
              <View
                style={{
                  backgroundColor: primaryColor + "10",
                  borderRadius: 8,
                  padding: 12,
                  borderLeftWidth: 3,
                  borderLeftColor: primaryColor,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <FontAwesome5 name="sticky-note" size={12} color={primaryColor} />
                  <Text style={{ color: primaryColor, fontSize: 12, fontWeight: "500", marginLeft: 6 }}>
                    Notes
                  </Text>
                </View>
                <Text style={{ color: "#CDCDE0", fontSize: 14, lineHeight: 18 }}>
                  {exercise.notes}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
          {/* Modal Header */}
          <View style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            justifyContent: "space-between",
            padding: 16,
            paddingTop: 60,
            backgroundColor: tertiaryColor,
            borderBottomWidth: 1,
            borderBottomColor: "#232533"
          }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
              {exercise.name}
            </Text>
            <TouchableOpacity
              onPress={() => setShowOptionsModal(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#CDCDE020",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome5 name="times" size={14} color="#CDCDE0" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            {/* View Instructions Button */}
            <TouchableOpacity
              onPress={handleViewInstructions}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: tertiaryColor,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="information" size={20} color={primaryColor} />
              <Text style={{ color: "white", fontSize: 16, fontWeight: "500", marginLeft: 12, flex: 1 }}>
                View Exercise Instructions
              </Text>
              <FontAwesome5 name="chevron-right" size={14} color="#CDCDE0" />
            </TouchableOpacity>

            {/* Delete Exercise Button */}
            <TouchableOpacity
              onPress={handleRemove}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FF4D4D15",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="trash" size={16} color="#FF4D4D" />
              <Text style={{ color: "#FF4D4D", fontSize: 16, fontWeight: "500", marginLeft: 12, flex: 1 }}>
                Remove Exercise
              </Text>
              <FontAwesome5 name="chevron-right" size={14} color="#FF4D4D" />
            </TouchableOpacity>

 {/* Notes Section */}
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: "#CDCDE0", fontSize: 16, fontWeight: "500", flex: 1 }}>
                  Exercise Notes
                </Text>
                <View style={{
                  backgroundColor: "#FFA50020",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}>
                  <Text style={{ color: "#FFA500", fontSize: 10, fontWeight: "500" }}>
                    SESSION ONLY
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: tertiaryColor,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#3A3A4A",
                  minHeight: 120,
                }}
              >
                <TextInput
                  style={{
                    color: "white",
                    fontSize: 16,
                    padding: 16,
                    fontWeight: "400",
                    textAlignVertical: "top",
                  }}
                  placeholder="Add notes about form, tempo, rest time, modifications..."
                  placeholderTextColor="#7b7b8b"
                  multiline
                  numberOfLines={6}
                  value={exercise.notes}
                  onChangeText={handleNotesUpdate}
                />
              </View>
              <Text style={{ color: "#7b7b8b", fontSize: 12, marginTop: 8 }}>
                ⚠️ Notes are for this session only and won't be saved to your workout template.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default ExerciseCard;