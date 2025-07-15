// Path: /components/DraggableBottomSheet.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  Animated,
  ScrollView,
  PanResponder,
  useWindowDimensions,
} from "react-native";

interface Props {
  /** Show / hide the sheet */
  visible: boolean;
  /** Called after the sheet fully closes */
  onClose: () => void;
  /** Sheet contents */
  children: React.ReactNode;
  /** Accent color for the top border */
  primaryColor: string;
  /** 0 – 1 of screen height to occupy (default 0.45) */
  heightRatio?: number;
}

const DraggableBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  children,
  primaryColor,
  heightRatio = 0.45,
}) => {
  const { height } = useWindowDimensions();
  const sheetHeight = height * heightRatio;

  /* -- animated Y for slide‑up / drag‑down -- */
  const translateY = useRef(new Animated.Value(sheetHeight)).current;

  /* show / hide animation */
  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetHeight);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  /* drag gesture */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        translateY.extractOffset();
        translateY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        if (g.dy >= 0) translateY.setValue(g.dy); // only drag down
      },
      onPanResponderRelease: (_, g) => {
        translateY.flattenOffset();
        const shouldClose = g.dy > sheetHeight * 0.25 || g.vy > 0.8;
        Animated.timing(translateY, {
          toValue: shouldClose ? sheetHeight : 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => shouldClose && onClose());
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* dark scrim */}
      <View style={{ flex: 1 }} pointerEvents="none" />

      {/* sheet */}
      <Animated.View
        style={{
          transform: [{ translateY }],
          height: sheetHeight,
          backgroundColor: "#1C1B29",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 2,
          borderColor: primaryColor,
        }}
      >
        {/* handle bar */}
        <View
          {...panResponder.panHandlers}
          style={{ alignItems: "center", paddingTop: 8, paddingBottom: 12 }}
        >
          <View
            style={{
              width: 64,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#999",
              opacity: 0.5,
            }}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

export default DraggableBottomSheet;
