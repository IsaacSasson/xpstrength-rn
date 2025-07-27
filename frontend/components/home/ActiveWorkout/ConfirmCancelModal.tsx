// Path: /components/home/modals/ConfirmCancelModal.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity, Dimensions } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  visible: boolean;
  primaryColor: string;
  tertiaryColor: string;
  onNo: () => void;
  onYes: () => void;
}

const ConfirmCancelModal: React.FC<Props> = ({
  visible,
  primaryColor,
  tertiaryColor,
  onNo,
  onYes,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View
          style={{
            width: SCREEN_WIDTH * 0.75,
            backgroundColor: "#161622",
            padding: 24,
            borderRadius: 20,
          }}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={primaryColor}
            style={{ alignSelf: "center" }}
          />
          <Text className="text-white font-pbold text-xl text-center mt-4">
            End workout?
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            All unsaved progress will be lost.
          </Text>

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity
              onPress={onNo}
              className="px-5 py-3 rounded-lg"
              style={{ backgroundColor: tertiaryColor }}
            >
              <Text className="text-white font-pmedium">No, Keep Going</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onYes}
              className="px-5 py-3 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Yes, Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmCancelModal;
