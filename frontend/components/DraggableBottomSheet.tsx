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
  /** Called when the sheet should close (tap-away or drag down) */
  onClose: () => void;
  /** Fraction of screen height the sheet should occupy (0 – 1). Default 0.5 */
  heightRatio?: number;
  /** Accent colour for border / drag-handle */
  primaryColor: string;
  /** Content to render inside the sheet */
  children: React.ReactNode;
  /**
   * Fraction of keyboard height to raise the sheet by when the
   * keyboard opens (0 – 1). Default 0 – no lift.
   */
  keyboardOffsetRatio?: number;
  /**
   * If true, the children are wrapped in a ScrollView so long
   * lists can scroll without pushing the sheet off-screen.
   */
  scrollable?: boolean;
  /** Sheet background colour. Default “#1A1925” */
  backgroundColor?: string;
  /** Height (px) of the draggable header area. Default 32 */
  dragZoneHeight?: number;
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
  dragZoneHeight = 32,
}) => {
  /* ───────── Layout constants ───────── */
  const SCREEN_HEIGHT = Dimensions.get("window").height;
  const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * heightRatio);

  /* ───────── Animated value ───────── */
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const animateTo = (toValue: number, cb?: () => void) =>
    Animated.timing(translateY, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(cb);

  /* Track value at drag start so we can offset correctly (esp. after keyboard push) */
  const dragStartVal = useRef(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCurrentVal = () => ((translateY as any).__getValue?.() ?? 0);

  /* ───────── Open / close ───────── */
  useEffect(() => {
    if (visible) animateTo(0);
    else animateTo(SHEET_HEIGHT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, SHEET_HEIGHT]);

  /* ───────── Drag to close (header only) ───────── */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        dragStartVal.current = getCurrentVal();
      },
      onPanResponderMove: (_, g) => {
        // Only allow dragging downward (positive dy)
        if (g.dy > 0) translateY.setValue(dragStartVal.current + g.dy);
      },
      onPanResponderRelease: (_, g) => {
        const finalVal = dragStartVal.current + g.dy;
        if (finalVal > SHEET_HEIGHT * 0.35) {
          animateTo(SHEET_HEIGHT, onClose);
        } else {
          animateTo(0);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Tap-away area */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0)" }} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ justifyContent: "flex-end" }}
      >
        <Animated.View
          style={{
            transform: [{ translateY }],
            height: SHEET_HEIGHT,           // <<< fixed height
            maxHeight: SHEET_HEIGHT,        // <<< cap just in case
            width: "100%",
            backgroundColor,
            paddingHorizontal: 24,
            paddingTop: 0,
            paddingBottom: 32,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopColor: primaryColor,
            borderTopWidth: 2,
            overflow: "hidden",             // <<< keep content inside to allow internal scroll
          }}
        >
          {/* ───── Draggable Header (ONLY this part takes pan handlers) ───── */}
          <View
            {...panResponder.panHandlers}
            style={{
              height: dragZoneHeight,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 12,
              marginBottom: 12,
            }}
          >
            {/* Drag-handle */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: primaryColor,
              }}
            />
          </View>

          {/* Content area gets remaining height */}
          <View style={{ flex: 1 }}>
            {scrollable ? (
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              // If you pass your own ScrollView as children (like in WeeklyPlan),
              // it'll now scroll within the fixed-height sheet.
              children
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DraggableBottomSheet;
