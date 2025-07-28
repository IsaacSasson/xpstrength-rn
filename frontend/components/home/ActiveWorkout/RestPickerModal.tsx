// Path: /components/home/modals/RestPickerModal.tsx
import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";

interface Props {
  visible: boolean;
  durMin: number;
  durSec: number;
  primaryColor: string;
  onChangeMin: (v: number) => void;
  onChangeSec: (v: number) => void;
  onDone: () => void;
}

const RestPickerModal: React.FC<Props> = ({
  visible,
  durMin,
  durSec,
  primaryColor,
  onChangeMin,
  onChangeSec,
  onDone,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end">
        <View className="pt-4 pb-6 rounded-t-2xl" style={{ backgroundColor: "#161622", paddingHorizontal: 24 }}>
          <Text className="text-white text-center font-psemibold mb-2">Set Rest Timer</Text>
          <View className="flex-row justify-center">
            <Picker
              selectedValue={durMin}
              onValueChange={onChangeMin}
              style={{ width: 120, color: "#FFF" }}
              itemStyle={{ color: "#FFF" }}
            >
              {[0, 1, 2, 3, 4, 5].map((m) => (
                <Picker.Item key={m} label={`${m} min`} value={m} />
              ))}
            </Picker>
            <Picker
              selectedValue={durSec}
              onValueChange={onChangeSec}
              style={{ width: 120, color: "#FFF" }}
              itemStyle={{ color: "#FFF" }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map((s) => (
                <Picker.Item key={s} label={`${s}s`} value={s} />
              ))}
            </Picker>
          </View>
          <TouchableOpacity
            onPress={onDone}
            className="mt-4 mx-auto mb-5 px-6 py-2 rounded-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <Text className="text-white font-pmedium">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default RestPickerModal;
