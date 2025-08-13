// Path: /components/home/ReorderModal.tsx
import React, { useState, useEffect } from "react";
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /**
   * Map of exercise.id -> first image source (number).
   */
  const [exerciseImages, setExerciseImages] = useState<{
    [key: string]: number | undefined;
  }>({});

  // Load exercise images for display
  useEffect(() => {
    const allExercises = loadExercises();
    const imageMap: { [key: string]: number | undefined } = {};

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

      if (
        exercise.originalExerciseId &&
        byId.has(exercise.originalExerciseId)
      ) {
        const original = byId.get(exercise.originalExerciseId);
        if (original?.images?.length) resolvedImage = original.images[0];
      }

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
      setSelectedIndex(null);
    }
  }, [visible, exercises]);

  // Move exercise up one position
  const moveUp = (index: number) => {
    if (index > 0) {
      const newExercises = [...localExercises];
      [newExercises[index], newExercises[index - 1]] = [
        newExercises[index - 1],
        newExercises[index],
      ];
      setLocalExercises(newExercises);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Move exercise down one position
  const moveDown = (index: number) => {
    if (index < localExercises.length - 1) {
      const newExercises = [...localExercises];
      [newExercises[index], newExercises[index + 1]] = [
        newExercises[index + 1],
        newExercises[index],
      ];
      setLocalExercises(newExercises);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Move exercise to top
  const moveToTop = (index: number) => {
    if (index > 0) {
      const newExercises = [...localExercises];
      const [exercise] = newExercises.splice(index, 1);
      newExercises.unshift(exercise);
      setLocalExercises(newExercises);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Move exercise to bottom
  const moveToBottom = (index: number) => {
    if (index < localExercises.length - 1) {
      const newExercises = [...localExercises];
      const [exercise] = newExercises.splice(index, 1);
      newExercises.push(exercise);
      setLocalExercises(newExercises);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Handle item selection for swap mode
  const handleItemSelect = (index: number) => {
    if (selectedIndex === null) {
      // First selection
      setSelectedIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (selectedIndex === index) {
      // Deselect same item
      setSelectedIndex(null);
    } else {
      // Swap items
      const newExercises = [...localExercises];
      [newExercises[selectedIndex], newExercises[index]] = [
        newExercises[index],
        newExercises[selectedIndex],
      ];
      setLocalExercises(newExercises);
      setSelectedIndex(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleClose = () => {
    onReorderComplete(localExercises);
    onClose();
  };

  const renderExerciseItem = (exercise: any, index: number) => {
    const imgSrc = exerciseImages[exercise.id];
    const isSelected = selectedIndex === index;
    const isFirst = index === 0;
    const isLast = index === localExercises.length - 1;

    return (
      <View
        key={exercise.id}
        style={{
          backgroundColor: isSelected ? primaryColor + "20" : tertiaryColor,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? primaryColor : "transparent",
        }}
      >
        {/* Exercise Info Row */}
        <TouchableOpacity
          onPress={() => handleItemSelect(index)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
          activeOpacity={0.7}
        >
          {/* Order Number */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: primaryColor + "30",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text
              style={{ color: primaryColor, fontSize: 14, fontWeight: "600" }}
            >
              {index + 1}
            </Text>
          </View>

          {/* Image */}
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

          {/* Exercise Info */}
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

          {/* Selection Indicator */}
          {isSelected && (
            <View
              style={{
                backgroundColor: primaryColor,
                borderRadius: 10,
                padding: 6,
                marginLeft: 8,
              }}
            >
              <FontAwesome5 name="check" size={12} color="white" />
            </View>
          )}
        </TouchableOpacity>

        {/* Control Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {/* Move to Top */}
          <TouchableOpacity
            onPress={() => moveToTop(index)}
            disabled={isFirst}
            style={{
              flex: 1,
              backgroundColor: isFirst ? "#CDCDE020" : primaryColor + "20",
              borderRadius: 8,
              padding: 10,
              alignItems: "center",
              opacity: isFirst ? 0.5 : 1,
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name="angle-double-up"
              size={14}
              color={isFirst ? "#CDCDE0" : primaryColor}
            />
          </TouchableOpacity>

          {/* Move Up */}
          <TouchableOpacity
            onPress={() => moveUp(index)}
            disabled={isFirst}
            style={{
              flex: 1,
              backgroundColor: isFirst ? "#CDCDE020" : primaryColor + "20",
              borderRadius: 8,
              padding: 10,
              alignItems: "center",
              opacity: isFirst ? 0.5 : 1,
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name="chevron-up"
              size={14}
              color={isFirst ? "#CDCDE0" : primaryColor}
            />
          </TouchableOpacity>

          {/* Move Down */}
          <TouchableOpacity
            onPress={() => moveDown(index)}
            disabled={isLast}
            style={{
              flex: 1,
              backgroundColor: isLast ? "#CDCDE020" : primaryColor + "20",
              borderRadius: 8,
              padding: 10,
              alignItems: "center",
              opacity: isLast ? 0.5 : 1,
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name="chevron-down"
              size={14}
              color={isLast ? "#CDCDE0" : primaryColor}
            />
          </TouchableOpacity>

          {/* Move to Bottom */}
          <TouchableOpacity
            onPress={() => moveToBottom(index)}
            disabled={isLast}
            style={{
              flex: 1,
              backgroundColor: isLast ? "#CDCDE020" : primaryColor + "20",
              borderRadius: 8,
              padding: 10,
              alignItems: "center",
              opacity: isLast ? 0.5 : 1,
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name="angle-double-down"
              size={14}
              color={isLast ? "#CDCDE0" : primaryColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
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
          <Text style={{ color: "#CDCDE0", fontSize: 14, marginBottom: 8 }}>
            • Use the buttons to move exercises up/down or to top/bottom
          </Text>
          <Text style={{ color: "#CDCDE0", fontSize: 14 }}>
            • Tap an exercise to select it, then tap another to swap positions
          </Text>
          {selectedIndex !== null && (
            <Text
              style={{
                color: primaryColor,
                fontSize: 14,
                marginTop: 8,
                fontWeight: "500",
              }}
            >
              Exercise {selectedIndex + 1} selected - tap another to swap!
            </Text>
          )}
        </View>

        {/* Exercise List */}
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {localExercises.map((exercise, index) =>
            renderExerciseItem(exercise, index)
          )}
        </ScrollView>

        {/* Done Button */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={handleClose}
            style={{
              marginBottom: 40,
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
