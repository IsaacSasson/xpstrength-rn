// Path: /components/home/QuickActionsCustomizer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Animated,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

/* Enable LayoutAnimation on Android */
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface ActionDefinition {
  id: string;
  title: string;
  icon: string;
  iconType?: "material" | "fontawesome";
  onPress: () => void;
}

interface Props {
  visible: boolean;
  actions: ActionDefinition[];
  slotIds: (string | null)[]; // up to 4 ids or nulls
  onChangeSlotIds: (ids: (string | null)[]) => void;
  onRequestClose: () => void;
  primaryColor: string;
  tertiaryColor: string;
}

const MAX_SLOTS = 4;
const MIN_REQUIRED = 2;

const QuickActionsCustomizer: React.FC<Props> = ({
  visible,
  actions,
  slotIds,
  onChangeSlotIds,
  onRequestClose,
  primaryColor,
  tertiaryColor,
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // normalize slots to exactly 4 positions
  const normalizedSlots = useMemo(() => {
    const copy = [...slotIds];
    while (copy.length < MAX_SLOTS) copy.push(null);
    return copy.slice(0, MAX_SLOTS);
  }, [slotIds]);

  const filledCount = useMemo(
    () => normalizedSlots.filter(Boolean).length,
    [normalizedSlots]
  );

  const usedIds = useMemo(
    () => normalizedSlots.filter((id): id is string => !!id),
    [normalizedSlots]
  );

  const paletteActions = useMemo(
    () => actions.filter((a) => !usedIds.includes(a.id)),
    [actions, usedIds]
  );

  const getAction = (id: string) => actions.find((a) => a.id === id)!;

  // Fade open/close
  useEffect(() => {
    Animated.timing(fade, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) setSelectedId(null);
    });
  }, [visible, fade]);

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  /* ---------- handlers ---------- */
  const handlePalettePress = (id: string) => {
    // toggle select/deselect
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleSlotPress = (slotIndex: number) => {
    if (selectedId) {
      // place selectedId into slot
      animate();
      const newSlots = [...normalizedSlots];

      // make sure selectedId isn't already in another slot
      const oldIdx = newSlots.findIndex((sid) => sid === selectedId);
      if (oldIdx !== -1) newSlots[oldIdx] = null;

      newSlots[slotIndex] = selectedId;
      onChangeSlotIds(newSlots);
      // auto-deselect
      setSelectedId(null);
    } else {
      // no selection -> clear slot (if allowed)
      if (normalizedSlots[slotIndex] === null) return; // already empty
      if (filledCount <= MIN_REQUIRED) {
        Alert.alert(
          "Need at least 2 actions",
          `You must keep at least ${MIN_REQUIRED} quick actions.`
        );
        return;
      }
      animate();
      const newSlots = [...normalizedSlots];
      newSlots[slotIndex] = null;
      onChangeSlotIds(newSlots);
    }
  };

  const handleDone = () => {
    if (filledCount < MIN_REQUIRED) {
      Alert.alert(
        "Need at least 2 actions",
        `You must keep at least ${MIN_REQUIRED} quick actions before closing.`
      );
      return;
    }
    onRequestClose();
  };

  const clearSelection = () => setSelectedId(null);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onRequestClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          opacity: fade,
        }}
      >
        {/* Tap background to deselect (NOT close, just deselect) */}
        <TouchableWithoutFeedback
          onPress={() => {
            // tap outside: if something selected, just deselect;
            // else close
            if (selectedId) clearSelection();
            else onRequestClose();
          }}
        >
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
        </TouchableWithoutFeedback>

        {/* Header */}
        <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "600" }}>
            Customize Quick Actions
          </Text>
          <Text style={{ color: "#bbb", marginTop: 4 }}>
            Tap a tile below to select, then tap a slot to place. Tap a slot with nothing
            selected to clear it. (Min {MIN_REQUIRED})
          </Text>

          {/* X Close */}
          <TouchableOpacity
            onPress={onRequestClose}
            style={{ position: "absolute", right: 20, top: 60, padding: 8 }}
          >
            <FontAwesome5 name="times" size={22} color="#fff" />
          </TouchableOpacity>

          
        </View>

        {/* Slots */}
        <View
          style={{
            marginHorizontal: 16,
            padding: 12,
            borderRadius: 16,
            backgroundColor: "#1c1b29",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, marginBottom: 8, fontWeight: "500" }}>
            Your Slots
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {normalizedSlots.map((id, idx) => {
              const a = id ? getAction(id) : null;
              return (
                <SlotTile
                  key={`slot-${idx}`}
                  action={a}
                  onPress={() => handleSlotPress(idx)}
                  highlighted={!!selectedId}
                  primaryColor={primaryColor}
                  tertiaryColor={tertiaryColor}
                />
              );
            })}
          </View>
        </View>

        {/* Palette */}
        <ScrollView
          style={{ flex: 1, marginTop: 16 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              color: "white",
              fontSize: 18,
              marginBottom: 8,
              fontWeight: "500",
              paddingLeft: 4,
            }}
          >
            Available Actions
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {paletteActions.map((a) => (
              <SelectablePaletteTile
                key={a.id}
                action={a}
                selected={selectedId === a.id}
                onPress={() => handlePalettePress(a.id)}
                primaryColor={primaryColor}
                tertiaryColor={tertiaryColor}
              />
            ))}
          </View>
        </ScrollView>

        {/* Done button */}
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={handleDone}
            style={{
              backgroundColor: filledCount < MIN_REQUIRED ? "#555" : primaryColor,
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 24,
              opacity: filledCount < MIN_REQUIRED ? 0.6 : 1,
            }}
            activeOpacity={filledCount < MIN_REQUIRED ? 1 : 0.85}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Done</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

/* ---------------------- Palette Tile (Selectable) ---------------------- */
interface PaletteTileProps {
  action: ActionDefinition;
  selected: boolean;
  onPress: () => void;
  primaryColor: string;
  tertiaryColor: string;
}

const SelectablePaletteTile: React.FC<PaletteTileProps> = ({
  action,
  selected,
  onPress,
  primaryColor,
  tertiaryColor,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.08 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 120,
    }).start();
  }, [selected, scale]);

  return (
    <View style={{ width: "50%", padding: 8 }}>
      <AnimatedTouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={{
          transform: [{ scale }],
          backgroundColor: tertiaryColor,
          borderRadius: 16,
          height: 90,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? primaryColor : "transparent",
          shadowColor: selected ? primaryColor : "transparent",
          shadowOpacity: selected ? 0.6 : 0,
          shadowRadius: selected ? 6 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: selected ? 6 : 0,
        }}
      >
        {action.iconType === "material" ? (
          <MaterialCommunityIcons name={action.icon as any} size={28} color={primaryColor} />
        ) : (
          <FontAwesome5 name={action.icon as any} size={24} color={primaryColor} />
        )}
        <Text style={{ color: "white", marginTop: 8, textAlign: "center" }}>{action.title}</Text>
      </AnimatedTouchableOpacity>
    </View>
  );
};

/* ---------------------- Slot Tile (Clickable) ---------------------- */
interface SlotTileProps {
  action: ActionDefinition | null;
  onPress: () => void;
  highlighted: boolean;
  primaryColor: string;
  tertiaryColor: string;
}

const SlotTile: React.FC<SlotTileProps> = ({
  action,
  onPress,
  highlighted,
  primaryColor,
  tertiaryColor,
}) => {
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const empty = !action;

  return (
    <View style={{ width: "50%", padding: 8 }}>
      <AnimatedTouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          transform: [{ scale: pressScale }],
          backgroundColor: tertiaryColor,
          borderRadius: 16,
          height: 90,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
          borderWidth: highlighted ? 3 : 0,
          borderColor: highlighted ? primaryColor : "transparent",
          shadowColor: highlighted ? primaryColor : "transparent",
          shadowOpacity: highlighted ? 0.5 : 0,
          shadowRadius: highlighted ? 6 : 0,
          shadowOffset: { width: 0, height: 0 },
          elevation: highlighted ? 5 : 0,
          opacity: empty ? 0.5 : 1,
        }}
      >
        {empty ? (
          <>
            <FontAwesome5 name="plus" size={24} color={primaryColor} />
            <Text style={{ color: "white", marginTop: 8, textAlign: "center" }}>Empty</Text>
          </>
        ) : (
          <>
            {action.iconType === "material" ? (
              <MaterialCommunityIcons name={action.icon as any} size={28} color={primaryColor} />
            ) : (
              <FontAwesome5 name={action.icon as any} size={24} color={primaryColor} />
            )}
            <Text style={{ color: "white", marginTop: 8, textAlign: "center" }}>
              {action.title}
            </Text>
          </>
        )}
      </AnimatedTouchableOpacity>
    </View>
  );
};

/* ---------------------- Animated Touchable ---------------------- */
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default QuickActionsCustomizer;
