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
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { Exercise } from "./ExerciseCard";

interface ReorderModalProps {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onReorderComplete: (reorderedExercises: Exercise[]) => void;
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
  const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises);

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
          {localExercises.map((exercise, index) => (
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
              {/* Exercise Number & Info */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: primaryColor,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text
                  style={{ color: "white", fontSize: 14, fontWeight: "600" }}
                >
                  {index + 1}
                </Text>
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
                    backgroundColor: index === localExercises.length - 1 ? "#CDCDE020" : primaryColor + "20",
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
                    backgroundColor: index === localExercises.length - 1 ? "#CDCDE020" : primaryColor + "20",
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
          ))}
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