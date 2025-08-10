// Path: /components/home/ReorderModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// NOTE: MaterialCommunityIcons import removed because it's not used here.
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

  /**
   * Map of exercise.id -> first image source (number).
   * We resolve by:
   *  1) originalExerciseId exact match
   *  2) name match (case/trim-insensitive)
   */
  const [exerciseImages, setExerciseImages] = useState<{ [key: string]: number | undefined }>({});

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
      if (exercise.originalExerciseId && byId.has(exercise.originalExerciseId)) {
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
    }
  }, [visible, exercises]);

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newExercises = [...localExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setLocalExercises(newExercises);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < localExercises.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleReorder(index, index + 1);
    }
  };

  const handleMoveToTop = (index: number) => {
    if (index > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleReorder(index, 0);
    }
  };

  const handleMoveToBottom = (index: number) => {
    if (index < localExercises.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleReorder(index, localExercises.length - 1);
    }
  };

  const handleClose = () => {
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

        {/* Instructions */}
        <View style={{ padding: 16, backgroundColor: tertiaryColor }}>
          <Text style={{ color: "#CDCDE0", fontSize: 14 }}>
            Use the arrows to reorder your exercises. Changes are applied when you close this modal.
          </Text>
        </View>

        {/* Exercise List */}
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {localExercises.map((exercise, index) => {
            const imgSrc = exerciseImages[exercise.id];

            return (
              <View
                key={exercise.id}
                style={{
                  backgroundColor: tertiaryColor,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
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
                    // Keep subtle bg to avoid layout jump even if image missing
                    backgroundColor: primaryColor,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {imgSrc ? (
                    <Image
                      source={imgSrc}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    // No index text fallback—leave empty to honor "images only"
                    <></>
                  )}
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {/* Move to Top */}
                  <TouchableOpacity
                    onPress={() => handleMoveToTop(index)}
                    disabled={index === 0}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: index === 0 ? "#CDCDE020" : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === 0 ? 0.5 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="angle-double-up"
                      size={14}
                      color={index === 0 ? "#CDCDE0" : primaryColor}
                    />
                  </TouchableOpacity>

                  {/* Move Up */}
                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: index === 0 ? "#CDCDE020" : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === 0 ? 0.5 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="chevron-up"
                      size={14}
                      color={index === 0 ? "#CDCDE0" : primaryColor}
                    />
                  </TouchableOpacity>

                  {/* Move Down */}
                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={index === localExercises.length - 1}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        index === localExercises.length - 1 ? "#CDCDE020" : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === localExercises.length - 1 ? 0.5 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="chevron-down"
                      size={14}
                      color={index === localExercises.length - 1 ? "#CDCDE0" : primaryColor}
                    />
                  </TouchableOpacity>

                  {/* Move to Bottom */}
                  <TouchableOpacity
                    onPress={() => handleMoveToBottom(index)}
                    disabled={index === localExercises.length - 1}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        index === localExercises.length - 1 ? "#CDCDE020" : primaryColor + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: index === localExercises.length - 1 ? 0.5 : 1,
                    }}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5
                      name="angle-double-down"
                      size={14}
                      color={index === localExercises.length - 1 ? "#CDCDE0" : primaryColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Done Button */}
        <View style={{ padding: 16, backgroundColor: tertiaryColor }}>
          <TouchableOpacity
            onPress={handleClose}
            style={{
              backgroundColor: primaryColor,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ReorderModal;
