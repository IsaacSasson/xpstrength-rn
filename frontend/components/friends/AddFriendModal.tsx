import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSendRequest: (username: string) => Promise<void>;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onClose,
  onSendRequest,
}) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendRequest = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSendRequest(username.trim());
      setUsername("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to send friend request");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername("");
    setError("");
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={handleClose}
          />
          
          <View
            className="rounded-t-3xl p-6 pb-8"
            style={{ backgroundColor: "#1A1928" }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-psemibold">
                Add Friend
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <FontAwesome5 name="times" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Input Section */}
            <View className="mb-4">
              <Text className="text-gray-100 text-sm mb-2 font-pmedium">
                Enter username
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3"
                style={{ backgroundColor: tertiaryColor }}
              >
                <FontAwesome5
                  name="user-plus"
                  size={18}
                  color={primaryColor}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  className="flex-1 text-white font-pregular text-base"
                  placeholder="Username"
                  placeholderTextColor="#888"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-900/20 rounded-lg p-3 mb-4">
                <Text className="text-red-400 text-sm font-pmedium">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Info Text */}
            <Text className="text-gray-100 text-sm mb-6 font-pregular">
              You can send a friend request by entering their username. They'll
              receive a notification and can accept or decline your request.
            </Text>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 rounded-xl py-4"
                style={{ backgroundColor: tertiaryColor }}
                onPress={handleClose}
                disabled={loading}
              >
                <Text className="text-white text-center font-pmedium">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 rounded-xl py-4"
                style={{
                  backgroundColor: loading ? `${primaryColor}80` : primaryColor,
                }}
                onPress={handleSendRequest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-pmedium">
                    Send Request
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddFriendModal;