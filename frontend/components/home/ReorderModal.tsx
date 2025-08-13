// Path: /components/home/ReorderModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import * as Haptics from "expo-haptics";
import { loadExercises } from "@/utils/loadExercises";

interface ReorderModalProps {
  visible: boolean;
  onClose: () => void;
  exercises: any[];
  onReorderComplete: (reorderedExercises: any[]) => void;
  primaryColor: string;
  tertiaryColor: string;
}

interface AnimatedValues {
  translateY: Animated.Value;
  scale: Animated.Value;
}

const EXERCISE_HEIGHT = 76; // Height of each exercise item including margin

const ReorderModal: React.FC<ReorderModalProps> = ({
  visible,
  onClose,
  exercises,
  onReorderComplete,
  primaryColor,
  tertiaryColor,
}) => {
  // Local state to manage exercises within the modal
  const [localExercises, setLocalExercises] = useState<any[]>(exercises);
  const [isAnimating, setIsAnimating] = useState(false);

  // Track which item is currently "lifted" (for zIndex/elevation styling without animation)
  const [movingIndex, setMovingIndex] = useState<number | null>(null);

  // Animated values for each exercise
  const animatedValuesRef = useRef<AnimatedValues[]>([]);

  /**
   * Map of exercise.id -> first image source (number).
   * We resolve by:
   *  1) originalExerciseId exact match
   *  2) name match (case/trim-insensitive)
   */
  const [exerciseImages, setExerciseImages] = useState<{
    [key: string]: number | undefined;
  }>({});

  // Initialize animated values for exercises
  const initializeAnimatedValues = (exerciseCount: number) => {
    animatedValuesRef.current = Array.from({ length: exerciseCount }, () => ({
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
    }));
  };

  // Load exercise images for display
  useEffect(() => {
    const allExercises = loadExercises();
    const imageMap: { [key: string]: number | undefined } = {};

    // Pre-index by id and by normalized name for faster lookups
    const byId = new Map<any, any>();
    const byName = new Map<string, any>();
    for (const ex of allExercises) {
      byId.set(ex.id, ex);
      if (ex?.name) {
        byName.set(String(ex.name).trim().toLowerCase(), ex);
      }
    }

    exercises.forEach((exercise) => {
      let resolvedImage: number | undefined;

      // 1) Try originalExerciseId
      if (
        exercise.originalExerciseId &&
        byId.has(exercise.originalExerciseId)
      ) {
        const original = byId.get(exercise.originalExerciseId);
        if (original?.images?.length) resolvedImage = original.images[0];
      }

      // 2) Fallback by name (case-insensitive, trimmed)
      if (!resolvedImage && exercise?.name) {
        const key = String(exercise.name).trim().toLowerCase();
        const nameMatch = byName.get(key);
        if (nameMatch?.images?.length) resolvedImage = nameMatch.images[0];
      }

      imageMap[exercise.id] = resolvedImage;
    });

    setExerciseImages(imageMap);
  }, [exercises]);

  // Update local state when modal opens with new exercises
  useEffect(() => {
    if (visible) {
      setLocalExercises(exercises);
      initializeAnimatedValues(exercises.length);
      setMovingIndex(null);
      setIsAnimating(false);
    }
  }, [visible, exercises]);

  const animateReorder = (fromIndex: number, toIndex: number) => {
    if (isAnimating || fromIndex === toIndex) return;

    setIsAnimating(true);
    setMovingIndex(fromIndex);

    const movingItemAnimated = animatedValuesRef.current[fromIndex];
    if (!movingItemAnimated) return;

    const distance = (toIndex - fromIndex) * EXERCISE_HEIGHT;

    // Phase 1: Scale up the moving item
    Animated.timing(movingItemAnimated.scale, {
      toValue: 1.05,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Phase 2: Move the item and shift others
      const animations: Animated.CompositeAnimation[] = [];

      // Animate the moving item to its destination
      animations.push(
        Animated.timing(movingItemAnimated.translateY, {
          toValue: distance,
          duration: 300,
          useNativeDriver: true,
        })
      );

      // Calculate which items need to shift
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      // Animate other items to shift
      for (let i = start; i <= end; i++) {
        if (i !== fromIndex) {
          const itemAnimated = animatedValuesRef.current[i];
          if (!itemAnimated) continue;

          let shiftDistance = 0;

          if (fromIndex < toIndex) {
            // Moving down: items between fromIndex and toIndex move up
            if (i > fromIndex && i <= toIndex) {
              shiftDistance = -EXERCISE_HEIGHT;
            }
          } else {
            // Moving up: items between toIndex and fromIndex move down
            if (i >= toIndex && i < fromIndex) {
              shiftDistance = EXERCISE_HEIGHT;
            }
          }

          animations.push(
            Animated.timing(itemAnimated.translateY, {
              toValue: shiftDistance,
              duration: 300,
              useNativeDriver: true,
            })
          );
        }
      }

      Animated.parallel(animations).start(() => {
        // Phase 3: Defer state update to avoid useInsertionEffect warning
        const newExercises = [...localExercises];
        const [movedExercise] = newExercises.splice(fromIndex, 1);
        newExercises.splice(toIndex, 0, movedExercise);
        
        // Schedule state update outside animation callback
        setTimeout(() => {
          setLocalExercises(newExercises);
        }, 0);

        // Phase 4: Scale down the moving item smoothly
        Animated.timing(movingItemAnimated.scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Phase 5: Clean up after scale down completes
          setTimeout(() => {
            setMovingIndex(null);
            setIsAnimating(false);
          }, 0);

          // Use requestAnimationFrame to ensure React has re-rendered with new state
          // before resetting the animated values
          requestAnimationFrame(() => {
            // Reset all animated values - now they'll align with the new array order
            animatedValuesRef.current.forEach((animated) => {
              animated.translateY.setValue(0);
              animated.scale.setValue(1);
            });

            // Reinitialize for new order
            initializeAnimatedValues(newExercises.length);
          });
        });
      });
    });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    animateReorder(fromIndex, toIndex);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0 && !isAnimating) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < localExercises.length - 1 && !isAnimating) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleReorder(index, index + 1);
    }
  };

  const handleMoveToTop = (index: number) => {
    if (index > 0 && !isAnimating) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleReorder(index, 0);
    }
  };

  const handleMoveToBottom = (index: number) => {
    if (index < localExercises.length - 1 && !isAnimating) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleReorder(index, localExercises.length - 1);
    }
  };

  const handleClose = () => {
    if (isAnimating) return;
    // Pass the final reordered array to parent
    onReorderComplete(localExercises);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            paddingTop: 60,
            backgroundColor: tertiaryColor,
            borderBottomWidth: 1,
            borderBottomColor: "#232533",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            Reorder Exercises
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isAnimating}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#CDCDE020",
              alignItems: "center",
              justifyContent: "center",
              opacity: isAnimating ? 0.5 : 1,
            }}
          >
            <FontAwesome5 name="times" size={14} color="#CDCDE0" />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={{ padding: 16, backgroundColor: tertiaryColor }}>
          <Text style={{ color: "#CDCDE0", fontSize: 14 }}>
            Use the arrows to reorder your exercises. Changes are applied when
            you close this modal.
          </Text>
        </View>

        {/* Exercise List */}
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          // Avoid accidental taps while animating
          pointerEvents={isAnimating ? "none" : "auto"}
        >
          {localExercises.map((exercise, index) => {
            const imgSrc = exerciseImages[exercise.id];
            const animatedValues = animatedValuesRef.current[index];

            // Fallbacks in case values haven't been initialized yet
            const translateY =
              animatedValues?.translateY ?? new Animated.Value(0);
            const scale = animatedValues?.scale ?? new Animated.Value(1);

            // Lifted card gets higher zIndex/elevation WITHOUT animation
            const lifted = movingIndex === index;

            return (
              <Animated.View
                key={exercise.id} // Use stable key to prevent re-mounting
                style={{
                  backgroundColor: tertiaryColor,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  transform: [{ translateY }, { scale }],
                  // Non-animated zIndex/elevation to avoid native/JS mixing
                  zIndex: lifted ? 10 : 1,
                  elevation: lifted ? 10 : 1, // Android shadow
                  shadowColor: "#000",
                  shadowOpacity: lifted ? 0.3 : 0.15,
                  shadowOffset: { width: 0, height: lifted ? 6 : 2 },
                  shadowRadius: lifted ? 8 : 3,
                }}
              >
                {/* Image-only avatar (no numeric fallback) */}
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    marginRight: 12,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={imgSrc}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 2,
                    }}
                    numberOfLines={1}
                  >
                    {exercise.name}
                  </Text>
                  <Text style={{ color: "#CDCDE0", fontSize: 12 }}>
                    {exercise.sets.length} sets
                  </Text>
                </View>

                {/* Control Buttons */}
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {/* Move to Top */}
                  <TouchableOpacity
                    onPress={() => handleMoveToTop(index)}
                    disabled={index === 0 || isAnimating}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        index === 0 || isAnimating
                          ? "#CDCDE020"
                          : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === 0 || isAnimating ? 0.5 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="angle-double-up"
                      size={14}
                      color={
                        index === 0 || isAnimating ? "#CDCDE0" : primaryColor
                      }
                    />
                  </TouchableOpacity>

                  {/* Move Up */}
                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0 || isAnimating}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        index === 0 || isAnimating
                          ? "#CDCDE020"
                          : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === 0 || isAnimating ? 0.5 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="chevron-up"
                      size={14}
                      color={
                        index === 0 || isAnimating ? "#CDCDE0" : primaryColor
                      }
                    />
                  </TouchableOpacity>

                  {/* Move Down */}
                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={
                      index === localExercises.length - 1 || isAnimating
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        index === localExercises.length - 1 || isAnimating
                          ? "#CDCDE020"
                          : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity:
                        index === localExercises.length - 1 || isAnimating
                          ? 0.5
                          : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="chevron-down"
                      size={14}
                      color={
                        index === localExercises.length - 1 || isAnimating
                          ? "#CDCDE0"
                          : primaryColor
                      }
                    />
                  </TouchableOpacity>

                  {/* Move to Bottom */}
                  <TouchableOpacity
                    onPress={() => handleMoveToBottom(index)}
                    disabled={
                      index === localExercises.length - 1 || isAnimating
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        index === localExercises.length - 1 || isAnimating
                          ? "#CDCDE020"
                          : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity:
                        index === localExercises.length - 1 || isAnimating
                          ? 0.5
                          : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="angle-double-down"
                      size={14}
                      color={
                        index === localExercises.length - 1 || isAnimating
                          ? "#CDCDE0"
                          : primaryColor
                      }
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Done Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isAnimating}
            style={{
              marginBottom: 40,
              backgroundColor: primaryColor,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              opacity: isAnimating ? 0.7 : 1,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              {isAnimating ? "Reordering..." : "Done"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReorderModal;