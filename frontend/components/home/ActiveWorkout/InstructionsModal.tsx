// Path: /components/home/ActiveWorkout/InstructionsModal.tsx
import React, { useState, useEffect } from "react";
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  visible: boolean;
  text: string;
  onDismiss: () => void;
  onSave?: (notes: string) => void; // Add save callback for notes
  isEditable?: boolean; // Add flag to determine if this is for editing notes
  title?: string; // Custom title
}

const InstructionsModal: React.FC<Props> = ({ 
  visible, 
  text, 
  onDismiss,
  onSave,
  isEditable = false,
  title = "Instructions"
}) => {
  const [editableText, setEditableText] = useState(text);

  // Update local state when text prop changes
  useEffect(() => {
    setEditableText(text);
  }, [text]);

  const handleSave = () => {
    if (onSave && isEditable) {
      onSave(editableText);
    } else {
      onDismiss();
    }
  };

  const handleCancel = () => {
    // Reset to original text if cancelling
    setEditableText(text);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
          {/* Header */}
          <View
            style={{
              backgroundColor: "#232533",
              paddingTop: 60,
              paddingBottom: 16,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#3A3A4A",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                {isEditable ? "Exercise Notes" : title}
              </Text>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name="close" size={18} color="#CDCDE0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1, padding: 16 }}>
            {isEditable ? (
              <>
                <Text style={{ color: "#CDCDE0", marginBottom: 12 }}>
                  Add notes about this exercise (form cues, weight progressions, etc.)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: "#232533",
                    color: "white",
                    padding: 16,
                    borderRadius: 12,
                    fontSize: 16,
                    textAlignVertical: "top",
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#3A3A4A",
                  }}
                  placeholder="Enter your notes here..."
                  placeholderTextColor="#7b7b8b"
                  value={editableText}
                  onChangeText={setEditableText}
                  multiline
                  autoFocus
                />
              </>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ color: "white", fontSize: 16, lineHeight: 24 }}>
                  {text}
                </Text>
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          <View
            style={{
              backgroundColor: "#232533",
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: "#3A3A4A",
            }}
          >
            {isEditable ? (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "500" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={{
                    flex: 1,
                    backgroundColor: "#007AFF",
                    padding: 16,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                    Save Notes
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={onDismiss}
                style={{
                  backgroundColor: "#007AFF",
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                  Done
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default InstructionsModal;