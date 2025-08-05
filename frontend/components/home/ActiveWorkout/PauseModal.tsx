// Path: /components/home/ActiveWorkout/PauseModal.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface Props {
  visible: boolean;
  primaryColor: string;
  onResume: () => void;
}

const PauseModal: React.FC<Props> = ({ visible, primaryColor, onResume }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="items-center p-6 rounded-2xl" style={{ backgroundColor: "#161622" }}>
          <MaterialCommunityIcons name="pause-circle-outline" size={72} color={primaryColor} />
          <Text className="text-white font-pbold text-xl mt-4">Workout Paused</Text>
          <TouchableOpacity
            onPress={onResume}
            className="mt-6 px-8 py-3 rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-pmedium">Resume</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PauseModal;