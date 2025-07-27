// Path: /components/home/ActiveWorkoutCard.tsx
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const MAX_FIELD_VALUE = 9999;

export interface SetItem {
  id: number;
  lbs: number;
  reps: number;
  checked?: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  instructions: string;
  sets: SetItem[];
}

interface Props {
  exercise: ExerciseItem;
  exIdx: number;

  // styling / layout
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  CARD_HEIGHT: number;
  COL_WIDTH: number;
  CHECK_COL_WIDTH: number;

  // actions from parent
  onOpenOptions: (exIdx: number) => void;
  onToggleSetChecked: (exIdx: number, setIdx: number) => void;
  onUpdateSetField: (
    exIdx: number,
    setIdx: number,
    field: "reps" | "lbs",
    value: number
  ) => void;
  onAddSet: (exIdx: number) => void;
  onRemoveSet: (exIdx: number) => void;
}

type EditingState = { setIdx: number; field: "reps" | "lbs" } | null;

const ActiveWorkoutCard: React.FC<Props> = ({
  exercise,
  exIdx,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  CARD_HEIGHT,
  COL_WIDTH,
  CHECK_COL_WIDTH,
  onOpenOptions,
  onToggleSetChecked,
  onUpdateSetField,
  onAddSet,
  onRemoveSet,
}) => {
  const editableBg = "rgba(255,255,255,0.08)";
  const listRef = useRef<ScrollView | null>(null);

  // Local editing controller (UI only; values saved via onUpdateSetField)
  const [editing, setEditing] = useState<EditingState>(null);
  const [editingValue, setEditingValue] = useState("");

  const beginEdit = (setIdx: number, field: "reps" | "lbs", current: number) => {
    setEditing({ setIdx, field });
    setEditingValue(String(current));
  };

  const commitEdit = () => {
    if (!editing) return;
    let num = parseInt(editingValue, 10);
    if (isNaN(num)) {
      setEditing(null);
      setEditingValue("");
      return;
    }
    num = Math.max(0, Math.min(num, MAX_FIELD_VALUE));
    onUpdateSetField(exIdx, editing.setIdx, editing.field, num);
    setEditing(null);
    setEditingValue("");
  };

  const handleAddSet = () => {
    const before = exercise.sets.length;
    onAddSet(exIdx);
    const after = before + 1;
    if (after > 4) {
      // Let React commit, then scroll
      requestAnimationFrame(() => {
        setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 60);
      });
    }
  };

  return (
    <View
      className="rounded-2xl p-4 mt-10"
      style={{
        backgroundColor: tertiaryColor,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        shadowColor: primaryColor,
        shadowOpacity: 0.2,
        shadowRadius: 13,
        shadowOffset: { width: 0, height: 4 },
        height: CARD_HEIGHT,
      }}
    >
      {/* Card header */}
      <View className="flex-row items-center mb-4">
        <View className="flex-1 items-center">
          <Text
            className="text-2xl font-pbold text-center"
            style={{ color: secondaryColor }}
          >
            {exercise.name}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onOpenOptions(exIdx)}>
          <MaterialCommunityIcons name="dots-vertical" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Table header */}
      <View
        className="flex-row py-1 mb-2 rounded-lg"
        style={{ borderColor: secondaryColor, borderWidth: 0.3 }}
      >
        <View style={{ width: CHECK_COL_WIDTH }} />
        <Text style={{ width: COL_WIDTH }} className="text-white font-pmedium">
          SET
        </Text>
        <Text
          style={{ flex: 1, textAlign: "center", marginRight: 15 }}
          className="text-white font-pmedium"
        >
          REPS
        </Text>
        <Text
          style={{ width: COL_WIDTH, textAlign: "right", marginRight: 15 }}
          className="text-white font-pmedium"
        >
          WEIGHT
        </Text>
      </View>

      {/* Sets list */}
      <ScrollView
        ref={(ref) => { listRef.current = ref; }}
        style={{ flex: 1, marginBottom: 250 }}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {exercise.sets.map((s, setIdx) => (
          <View
            key={s.id}
            className="flex-row mb-2"
            style={{ minHeight: 32, alignItems: "center" }}
          >
            {/* Checkmark */}
            <View
              style={{
                width: CHECK_COL_WIDTH,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => onToggleSetChecked(exIdx, setIdx)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={
                    s.checked
                      ? "check-circle"
                      : "checkbox-blank-circle-outline"
                  }
                  size={22}
                  color={s.checked ? primaryColor : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>

            {/* Set # */}
            <View style={{ width: COL_WIDTH, alignItems: "center" }}>
              <Text className="text-gray-100">{s.id}</Text>
            </View>

            {/* Reps */}
            <View style={{ flex: 1, alignItems: "center" }}>
              {editing &&
              editing.setIdx === setIdx &&
              editing.field === "reps" ? (
                <TextInput
                  value={editingValue}
                  onChangeText={setEditingValue}
                  onBlur={commitEdit}
                  onSubmitEditing={commitEdit}
                  keyboardType="numeric"
                  autoFocus
                  maxLength={4}
                  style={{
                    color: "#FFFFFF",
                    backgroundColor: editableBg,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                    borderRadius: 10,
                    minWidth: 60,
                    textAlign: "center",
                  }}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => beginEdit(setIdx, "reps", s.reps)}
                  style={{
                    backgroundColor: editableBg,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                    borderRadius: 10,
                    minWidth: 60,
                  }}
                >
                  <Text className="text-gray-100" style={{ textAlign: "center" }}>
                    {s.reps}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Weight */}
            <View style={{ width: COL_WIDTH, alignItems: "center" }}>
              {editing &&
              editing.setIdx === setIdx &&
              editing.field === "lbs" ? (
                <TextInput
                  value={editingValue}
                  onChangeText={setEditingValue}
                  onBlur={commitEdit}
                  onSubmitEditing={commitEdit}
                  keyboardType="numeric"
                  autoFocus
                  maxLength={4}
                  style={{
                    color: "#FFFFFF",
                    backgroundColor: editableBg,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                    borderRadius: 10,
                    minWidth: 60,
                    textAlign: "center",
                  }}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => beginEdit(setIdx, "lbs", s.lbs)}
                  style={{
                    backgroundColor: editableBg,
                    paddingVertical: 2,
                    paddingHorizontal: 6,
                    borderRadius: 10,
                    minWidth: 60,
                  }}
                >
                  <Text className="text-gray-100" style={{ textAlign: "center" }}>
                    {s.lbs} lbs
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add / Remove buttons */}
      <View className="flex-row justify-between">
        <TouchableOpacity
          onPress={() => onRemoveSet(exIdx)}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: "#FF4C4C" }}
        >
          <Text className="text-white font-pmedium">Remove Set</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddSet}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Text className="text-white font-pmedium">Add Set</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActiveWorkoutCard;
