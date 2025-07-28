// Path: /components/home/modals/InstructionsModal.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  visible: boolean;
  text: string;
  onDismiss: () => void;
}

const InstructionsModal: React.FC<Props> = ({ visible, text, onDismiss }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/50">
        <View
          style={{
            width: SCREEN_WIDTH * 0.9,
            height: SCREEN_WIDTH,
            backgroundColor: "#161622",
            padding: 20,
            borderRadius: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text className="text-white font-pbold text-xl">Instructions</Text>
            <TouchableOpacity onPress={onDismiss} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-gray-100 font-pmedium pr-2 text-base">{text}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default InstructionsModal;
