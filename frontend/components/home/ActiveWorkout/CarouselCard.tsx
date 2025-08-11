import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ExerciseAnatomy from "@/components/home/ActiveWorkout/ExerciseAnatomy";
import { useWorkouts } from "@/context/WorkoutContext";

const MAX_FIELD_VALUE = 9999;

export interface SetItem {
  id: number;
  lbs: number; // internal base stays in lbs
  reps: number;
  checked?: boolean;
}

export interface ExerciseItem {
  id: string;
  name: string;
  instructions: string;
  images?: number[];
  sets: SetItem[];
  notes?: string;
  primaryMuscles?: string | string[] | null;
  secondaryMuscles?: string | string[] | null;
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

  // rest timer state
  restLeft: number;
  restRunning: boolean;

  // actions from parent
  onOpenOptions: (exIdx: number) => void;
  onToggleSetChecked: (exIdx: number, setIdx: number) => void;
  onUpdateSetField: (
    exIdx: number,
    setIdx: number,
    field: "reps" | "lbs",
    value: number // value is always passed back in INTERNAL BASE (lbs)
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
  restLeft,
  restRunning,
  onOpenOptions,
  onToggleSetChecked,
  onUpdateSetField,
  onAddSet,
  onRemoveSet,
}) => {
  const editableBg = "rgba(255,255,255,0.08)";
  const listRef = useRef<ScrollView | null>(null);

  // Single source of truth for units + helpers
  const { unitSystem, convertWeight, formatWeight } = useWorkouts();

  // Convert internal lbs to the current display unit
  const toDisplayWeight = useCallback(
    (lbs: number) => convertWeight(lbs, "imperial", unitSystem),
    [convertWeight, unitSystem]
  );

  // Convert a value from the display unit back to internal lbs (rounded)
  const fromDisplayToLbs = useCallback(
    (displayVal: number) => {
      const lbsVal =
        unitSystem === "metric"
          ? convertWeight(displayVal, "metric", "imperial")
          : displayVal;
      return Math.round(lbsVal);
    },
    [convertWeight, unitSystem]
  );

  // Local editing controller
  const [editing, setEditing] = useState<EditingState>(null);
  const [editingValue, setEditingValue] = useState("");

  // Image cycling state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cycle images if present
  useEffect(() => {
    if (exercise.images && exercise.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) =>
          prev === exercise.images!.length - 1 ? 0 : prev + 1
        );
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [exercise.images]);

  const beginEdit = (setIdx: number, field: "reps" | "lbs", current: number) => {
    setEditing({ setIdx, field });
    setEditingValue(String(current));
  };

  const commitEdit = () => {
    if (!editing) return;

    // Allow decimal for kg display input; strip non-numeric except dot.
    let num = Number(editingValue.replace(/[^\d.]/g, ""));
    if (isNaN(num)) {
      setEditing(null);
      setEditingValue("");
      return;
    }

    const cappedDisplay = Math.max(0, Math.min(num, MAX_FIELD_VALUE));

    if (editing.field === "lbs") {
      // Convert back to internal lbs and clamp, rounding to whole pounds
      const internalLbs = fromDisplayToLbs(cappedDisplay);
      const clampedInternal = Math.max(0, Math.min(internalLbs, MAX_FIELD_VALUE));
      onUpdateSetField(exIdx, editing.setIdx, "lbs", clampedInternal);
    } else {
      // Reps are integers
      const clampedReps = Math.round(Math.max(0, Math.min(cappedDisplay, MAX_FIELD_VALUE)));
      onUpdateSetField(exIdx, editing.setIdx, "reps", clampedReps);
    }

    setEditing(null);
    setEditingValue("");
  };

  const handleAddSet = () => {
    const before = exercise.sets.length;
    onAddSet(exIdx);
    const after = before + 1;
    if (after > 4) {
      requestAnimationFrame(() => {
        setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 60);
      });
    }
  };

  // Reserve ~half the card height for anatomy
  const ANATOMY_HEIGHT = Math.max(120, Math.floor(CARD_HEIGHT * 0.4));

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
      {/* Header row with image, centered name, and options */}
      <View style={{ position: "relative", height: 48, marginBottom: 16, justifyContent: "center" }}>
        {/* Exercise Image (left) */}
        {exercise.images && exercise.images.length > 0 && (
          <View style={[styles.imageContainer, { position: "absolute", left: 0, top: 4 }]}>
            {exercise.images.map((image, index) => (
              <Image
                key={index}
                source={image}
                style={[
                  styles.exerciseImage,
                  { opacity: currentImageIndex === index ? 1 : 0 },
                ]}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* Exercise Name (center) */}
        <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 60 }}>
          <Text
            className="text-2xl font-pbold text-center"
            style={{ color: secondaryColor }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {exercise.name}
          </Text>
        </View>

        {/* Options button (right) */}
        <TouchableOpacity onPress={() => onOpenOptions(exIdx)} style={{ position: "absolute", right: 0, top: 14 }}>
          <MaterialCommunityIcons name="dots-vertical" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Notes */}
      {exercise.notes && exercise.notes.trim() && (
        <View className="mb-3 p-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          <View className="flex-row items-center mb-1">
            <MaterialCommunityIcons name="note-text-outline" size={16} color={primaryColor} />
            <Text className="text-sm font-pmedium ml-1" style={{ color: primaryColor }}>
              Notes:
            </Text>
          </View>
          <Text className="text-gray-100 text-sm">{exercise.notes}</Text>
        </View>
      )}

      {/* Table header */}
      <View className="flex-row py-1 mb-2 rounded-lg" style={{ borderColor: secondaryColor, borderWidth: 0.3 }}>
        <View style={{ width: CHECK_COL_WIDTH }} />
        <View style={{ width: COL_WIDTH, alignItems: "center" }}>
          <Text className="text-white font-pmedium">SET</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text className="text-white font-pmedium">REPS</Text>
        </View>
        <View style={{ width: COL_WIDTH, alignItems: "center" }}>
          <Text className="text-white font-pmedium">WEIGHT</Text>
        </View>
      </View>

      {/* Sets list */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={(ref) => {
            listRef.current = ref;
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {exercise.sets.map((s, setIdx) => {
            // Convert internal lbs -> display unit for both label and editor
            const displayWeight = toDisplayWeight(s.lbs);
            // String with correct unit and rounding via context formatter
            const displayWeightLabel = formatWeight(displayWeight);

            return (
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
                      name={s.checked ? "check-circle" : "checkbox-blank-circle-outline"}
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
                  {editing && editing.setIdx === setIdx && editing.field === "reps" ? (
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
                  {editing && editing.setIdx === setIdx && editing.field === "lbs" ? (
                    <TextInput
                      value={editingValue}
                      onChangeText={setEditingValue}
                      onBlur={commitEdit}
                      onSubmitEditing={commitEdit}
                      keyboardType="numeric"
                      autoFocus
                      maxLength={5} // allow a decimal in kg
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
                      onPress={() => beginEdit(setIdx, "lbs", displayWeight)}
                      style={{
                        backgroundColor: editableBg,
                        paddingVertical: 2,
                        paddingHorizontal: 6,
                        borderRadius: 10,
                        minWidth: 60,
                      }}
                    >
                      <Text className="text-gray-100" style={{ textAlign: "center" }}>
                        {displayWeightLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Anatomy */}
      <View style={{ height: ANATOMY_HEIGHT, marginTop: 6, marginBottom: 10 }}>
        <ExerciseAnatomy
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          primaryMuscles={exercise.primaryMuscles}
          secondaryMuscles={exercise.secondaryMuscles}
          height={ANATOMY_HEIGHT}
        />
      </View>

      {/* Add / Remove */}
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

const styles = StyleSheet.create({
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#232533",
  },
  exerciseImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
});

export default ActiveWorkoutCard;