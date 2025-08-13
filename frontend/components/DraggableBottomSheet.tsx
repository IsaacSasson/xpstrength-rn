import React, { useEffect, useRef } from "react";
import {
  Animated,
  Keyboard,
  KeyboardEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
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
   *
   * If > 0, this component handles keyboard lifting itself
   * (KeyboardAvoidingView is not used to avoid double-adjusting).
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
  /** Backdrop opacity when the sheet is open (0–1). Default 0.35 */
  backdropOpacity?: number;
  /** If true, taps on the backdrop do not close the sheet */
  disableBackdropClose?: boolean;
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
  backdropOpacity = 0.35,
  disableBackdropClose = false,
}) => {
  /* ───────── Dynamic sizing (handles rotation & window resizes) ───────── */
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const SHEET_HEIGHT = Math.round(Math.max(0, Math.min(1, heightRatio)) * SCREEN_HEIGHT);

  /* ───────── Animated state ───────── */
  // translateY is the absolute Y offset from the bottom anchor.
  // 0    -> fully open (bottom-aligned)
  // >0   -> pushed downward (toward closed)
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Base position when no keyboard is present: 0 if open, SHEET_HEIGHT if closed.
  const baseYRef = useRef(visible ? 0 : SHEET_HEIGHT);

  // Current keyboard lift (negative value moves the sheet upward).
  const keyboardLiftRef = useRef(0);

  const timing = (toValue: number, cb?: () => void) =>
    Animated.timing(translateY, {
      toValue,
      duration: 260,
      useNativeDriver: true,
    }).start(() => cb?.());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getY = () => ((translateY as any).__getValue?.() ?? 0);

  /* ───────── Helpers to ensure clean closing and state reset ───────── */
  const resetLift = () => {
    keyboardLiftRef.current = 0;
  };

  const performClose = () => {
    // Always dismiss the keyboard and clear the lift before closing
    Keyboard.dismiss();
    resetLift();
    baseYRef.current = SHEET_HEIGHT;
    timing(SHEET_HEIGHT, onClose);
  };

  /* ───────── Visibility open/close ───────── */
  useEffect(() => {
    // If we're transitioning to hidden, proactively dismiss keyboard and clear lift
    if (!visible) {
      Keyboard.dismiss();
      resetLift();
    }

    baseYRef.current = visible ? 0 : SHEET_HEIGHT;
    const target = baseYRef.current + keyboardLiftRef.current;
    // Animate to the correct position but DO NOT call onClose here;
    // onClose should be invoked only by user interactions (drag/backdrop).
    timing(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, SHEET_HEIGHT]);

  /* ───────── React to window height changes (keeps sheet size correct) ───────── */
  useEffect(() => {
    // Re-apply the current logical state when sizes change (e.g., rotation).
    const target = (visible ? 0 : SHEET_HEIGHT) + keyboardLiftRef.current;
    translateY.setValue(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SHEET_HEIGHT]);

  /* ───────── Keyboard handling (manual lift to avoid double adjustments) ───────── */
  const pushUpForKeyboard = (e: KeyboardEvent) => {
    if (!visible) return; // no-op if hidden
    const lift = -Math.round(e.endCoordinates.height * Math.max(0, Math.min(1, keyboardOffsetRatio)));
    keyboardLiftRef.current = lift;
    timing(baseYRef.current + lift);
  };

  const resetForKeyboard = () => {
    // IMPORTANT: Always clear the lift, even if hidden, so the next open is baseline.
    resetLift();
    if (visible) {
      timing(baseYRef.current);
    }
  };

  useEffect(() => {
    if (keyboardOffsetRatio <= 0) return;

    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const s = Keyboard.addListener(showEvt, pushUpForKeyboard);
    const h = Keyboard.addListener(hideEvt, resetForKeyboard);
    return () => {
      s.remove();
      h.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardOffsetRatio, visible]);

  /* ───────── Drag to close (header-only gesture to avoid scroll conflicts) ───────── */
  const dragStartVal = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        dragStartVal.current = getY();
      },
      onPanResponderMove: (_, g) => {
        // Allow only downward dragging; clamp so we never go below fully closed.
        if (g.dy > 0) {
          const next = dragStartVal.current + g.dy;
          const max = SHEET_HEIGHT; // fully closed
          translateY.setValue(Math.min(next, max));
        }
      },
      onPanResponderRelease: () => {
        const y = getY();
        const lift = keyboardLiftRef.current; // negative or 0
        // Compare against a threshold measured from the "lifted baseline".
        const closeThreshold = (SHEET_HEIGHT * 0.35) + lift;
        if (y > closeThreshold) {
          performClose();
        } else {
          timing(baseYRef.current + lift);
        }
      },
    })
  ).current;

  /* ───────── Backdrop press handling ───────── */
  const handleBackdropPress = () => {
    if (disableBackdropClose) return;
    performClose();
  };

  /* ───────── Render ───────── */
  // When manually lifting for the keyboard, do not also use KeyboardAvoidingView.
  const shouldUseKAV = keyboardOffsetRatio <= 0;
  const containerBehavior = Platform.OS === "ios" ? "padding" : "height";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={performClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        onPress={handleBackdropPress}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: `rgba(0,0,0,${backdropOpacity})`,
        }}
      />

      {/* Bottom sheet */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* Optional basic keyboard avoidance when manual lift is disabled */}
        <View
          style={{
            justifyContent: "flex-end",
          }}
          // @ts-expect-error – RN types don't allow dynamic behavior on <View>,
          // this is a no-op on Android and used by iOS via native props.
          behavior={shouldUseKAV ? containerBehavior : undefined}
        >
          <Animated.View
            style={{
              transform: [{ translateY }],
              height: SHEET_HEIGHT,
              maxHeight: SHEET_HEIGHT,
              width: "100%",
              backgroundColor,
              paddingHorizontal: 24,
              paddingTop: 0,
              paddingBottom: 32,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopColor: primaryColor,
              borderTopWidth: 2,
              overflow: "hidden",
            }}
          >
            {/* Drag handle header (gesture bound here to avoid ScrollView conflicts) */}
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
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: primaryColor,
                }}
              />
            </View>

            {/* Content */}
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
                children
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default DraggableBottomSheet;
