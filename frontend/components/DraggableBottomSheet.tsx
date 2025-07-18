// Path: /components/DraggableBottomSheet.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface Props {
  /** Show / hide the sheet */
  visible: boolean;
  /** Called when the sheet should close (tap‑away or drag down) */
  onClose: () => void;
  /** Fraction of screen height the sheet should occupy (0 – 1). Default 0.5 */
  heightRatio?: number;
  /** Accent colour for border / drag‑handle */
  primaryColor: string;
  /** Content to render inside the sheet */
  children: React.ReactNode;
  /**
   * Fraction of keyboard height to raise the sheet by when the
   * keyboard opens (0 – 1). Default 0 – no lift.
   */
  keyboardOffsetRatio?: number;
  /**
   * If true, the children are wrapped in a ScrollView so long
   * lists can scroll without pushing the sheet off‑screen.
   */
  scrollable?: boolean;
  /** Sheet background colour. Default “#1A1925” */
  backgroundColor?: string;
}

const DraggableBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  heightRatio = 0.5,
  primaryColor,
  children,
  keyboardOffsetRatio = 0,
  scrollable = false,
  backgroundColor = "#1A1925",
}) => {
  /* ───────── Layout constants ───────── */
  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const SHEET_HEIGHT = SCREEN_HEIGHT * heightRatio;

  /* ───────── Animated value ───────── */
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const animateTo = (toValue: number, cb?: () => void) =>
    Animated.timing(translateY, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(cb);

  /* ───────── Open / close ───────── */
  useEffect(() => {
    if (visible) animateTo(0);
    else animateTo(SHEET_HEIGHT);
  }, [visible]);

  /* ───────── Drag to close ───────── */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SHEET_HEIGHT * 0.35) animateTo(SHEET_HEIGHT, onClose);
        else animateTo(0);
      },
    })
  ).current;

  /* ───────── Keyboard handling ───────── */
  const pushUpForKeyboard = (e: KeyboardEvent) =>
    animateTo(-e.endCoordinates.height * keyboardOffsetRatio);

  useEffect(() => {
    if (keyboardOffsetRatio === 0) return;

    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvt, pushUpForKeyboard);
    const hideSub = Keyboard.addListener(hideEvt, () => animateTo(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffsetRatio]);

  /* ───────── Render ───────── */
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Tap‑away area */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ justifyContent: "flex-end" }}
      >
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY }],
            backgroundColor,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 32,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopColor: primaryColor,
            borderTopWidth: 2,
          }}
        >
          {/* Drag‑handle */}
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: primaryColor,
              marginBottom: 12,
            }}
          />

          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DraggableBottomSheet;
