// Path: /components/PasswordModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useThemeContext } from "@/context/ThemeContext";

interface PasswordModalProps {
  visible: boolean;
  onConfirm: (password: string) => Promise<boolean>;
  onCancel: () => void;
  title?: string;
  message?: string;
  actionLabel?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  title = "Enter Password",
  message = "Please enter your current password to continue.",
  actionLabel = "Confirm",
}) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      Alert.alert("Error", "Password is required.");
      return;
    }

    setIsLoading(true);
    try {
      const success = await onConfirm(password);
      if (success) {
        setPassword("");
        onCancel(); // Close the modal
      }
    } catch (error) {
      console.error("Password confirmation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={handleCancel}
      >
        <View
          style={{
            width: "90%",
            maxWidth: 400,
            backgroundColor: tertiaryColor,
            borderRadius: 20,
            padding: 24,
          }}
          onStartShouldSetResponder={() => true}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
          
          <Text
            style={{
              color: "#CCC",
              fontSize: 14,
              marginBottom: 20,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {message}
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Current password"
            placeholderTextColor="#666"
            secureTextEntry
            autoFocus
            style={{
              backgroundColor: "rgba(0,0,0,0.3)",
              color: "#FFF",
              padding: 12,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 16,
            }}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#666",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#CCC", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading || !password.trim()}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                backgroundColor: primaryColor,
                alignItems: "center",
                opacity: isLoading || !password.trim() ? 0.6 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={{ color: "#FFF", fontWeight: "600" }}>
                  {actionLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};