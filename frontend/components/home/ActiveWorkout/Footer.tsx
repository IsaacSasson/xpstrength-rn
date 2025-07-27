// Path: /components/home/ActiveWorkoutFooter.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { Picker } from "@react-native-picker/picker";

interface Props {
  /* Timer duration */
  durMin: number;
  durSec: number;

  /* Colors */
  tertiaryColor: string;
  primaryColor: string;

  /* Rest countdown state */
  restLeft: number;
  restVisible: boolean;

  /* Picker sheet state (replaces RestPickerModal) */
  pickerVisible: boolean;

  /* Actions */
  onPause: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onChangeMin: (v: number) => void;
  onChangeSec: (v: number) => void;
  onApplyPicker: () => void; // call parent's applyPicker
  onStartRest: () => void;
  onCloseRest: () => void; // should also stop/reset in parent
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
    2,
    "0"
  )}`;

const ActiveWorkoutFooter: React.FC<Props> = ({
  durMin,
  durSec,
  tertiaryColor,
  primaryColor,
  restLeft,
  restVisible,
  pickerVisible,
  onPause,
  onOpenPicker,
  onClosePicker,
  onChangeMin,
  onChangeSec,
  onApplyPicker,
  onStartRest,
  onCloseRest,
}) => {
  return (
    <>
      {/* Bottom timer bar */}
      <View
        style={{
          marginBottom: 8,
          alignSelf: "center",
          width: 260,
          backgroundColor: tertiaryColor,
          borderRadius: 9999,
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 6,
        }}
      >
        {/* Pause */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <TouchableOpacity onPress={onPause}>
            <Text className="text-white font-pmedium">Pause</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View
          style={{
            width: 1,
            height: "60%",
            backgroundColor: "#2E2E42",
          }}
        />

        {/* Clock / picker */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <TouchableOpacity onPress={onOpenPicker}>
            <Text className="text-white font-pmedium">
              {durMin}:{String(durSec).padStart(2, "0")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View
          style={{
            width: 1,
            height: "60%",
            backgroundColor: "#2E2E42",
          }}
        />

        {/* Start */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <TouchableOpacity
            onPress={onStartRest}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text className="text-white font-pmedium">Start</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest timer as a DraggableBottomSheet */}
      <DraggableBottomSheet
        visible={restVisible}
        onClose={onCloseRest}
        primaryColor={primaryColor}
        heightRatio={0.35}
      >
        {restLeft > 0 ? (
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <Text className="text-white p-2 font-pbold text-6xl">
              {fmt(restLeft)}
            </Text>
            <Text className="text-white font-pmedium mt-4">
              Rest timer running
            </Text>

            <TouchableOpacity
              onPress={onCloseRest}
              className="mt-6 px-10 py-3 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <Text className="text-white font-pbold text-3xl mt-2">
              Time is up!
            </Text>
            <TouchableOpacity
              onPress={onCloseRest}
              className="mt-6 px-10 py-3 rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <Text className="text-white font-pmedium">Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </DraggableBottomSheet>

      {/* Rest duration picker as a DraggableBottomSheet (replaces RestPickerModal) */}
      <DraggableBottomSheet
        visible={pickerVisible}
        onClose={onClosePicker}
        primaryColor={primaryColor}
        heightRatio={0.45}
      >
        <Text className="text-white text-center font-psemibold mb-2">
          Set Rest Timer
        </Text>
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
          onPress={onApplyPicker}
          className="mt-4 mx-auto mb-2 px-6 py-2 rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Text className="text-white font-pmedium">Done</Text>
        </TouchableOpacity>
      </DraggableBottomSheet>
    </>
  );
};

export default ActiveWorkoutFooter;
