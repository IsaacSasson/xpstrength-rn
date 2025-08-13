import React, { useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FrontSvg from "@/assets/svg/front.svg";
import BackSvg from "@/assets/svg/back.svg";
import { injectHandlersIntoSvg } from "@/utils/inject-svg-handlers";

interface RecoveryProps {
  color: string;         // primaryColor
  tertiaryColor: string; // unused for now
}

// Debug off
const DEBUG_SVG = false;
// Default unified fill for target groups' leaf paths
const DEFAULT_MUSCLE_FILL = "#ccccccff";

const FADE_DURATION = 100; // simple fade timing

const Recovery: React.FC<RecoveryProps> = ({ color, tertiaryColor }) => {
  const daysSinceLastWorkout: number = 2;
  const freshMuscleGroups: number = 5;
  const totalMuscleGroups: number = 8;

  const [side, setSide] = useState<"front" | "back">("front");
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation value: opacity only (no scale)
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  const navigateToGroup = (muscleGroupId: string) => {
    const cleanId = muscleGroupId.replace(/^muscle-/, "");
    router.push(`/(tabs)/stats/muscle-group?group=${cleanId}`);
  };

  const toggleSide = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // Fade out
    Animated.timing(opacityAnimation, {
      toValue: 0.5,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      // Swap side at midpoint
      setSide((prev) => (prev === "front" ? "back" : "front"));

      // Fade in
      Animated.timing(opacityAnimation, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => setIsAnimating(false));
    });
  };

  const frontHandlers = useMemo(
    () => ({
      "muscle-abdominals": () => navigateToGroup("muscle-abdominals"),
      "muscle-biceps": () => navigateToGroup("muscle-biceps"),
      "muscle-chest": () => navigateToGroup("muscle-chest"),
      "muscle-forearms": () => navigateToGroup("muscle-forearms"),
      "muscle-neck": () => navigateToGroup("muscle-neck"),
      "muscle-quadriceps": () => navigateToGroup("muscle-quadriceps"),
      "muscle-shoulders": () => navigateToGroup("muscle-shoulders"),
      "muscle-traps": () => navigateToGroup("muscle-traps"),
    }),
    []
  );

  const backHandlers = useMemo(
    () => ({
      "muscle-abductors": () => navigateToGroup("muscle-abductors"),
      "muscle-adductors": () => navigateToGroup("muscle-adductors"),
      "muscle-calves": () => navigateToGroup("muscle-calves"),
      "muscle-glutes": () => navigateToGroup("muscle-glutes"),
      "muscle-hamstrings": () => navigateToGroup("muscle-hamstrings"),
      "muscle-lats": () => navigateToGroup("muscle-lats"),
      "muscle-lower-back": () => navigateToGroup("muscle-lower-back"),
      "muscle-middle-back": () => navigateToGroup("muscle-middle-back"),
      "muscle-shoulders": () => navigateToGroup("muscle-shoulders"),
      "muscle-traps": () => navigateToGroup("muscle-traps"),
      "muscle-triceps": () => navigateToGroup("muscle-triceps"),
    }),
    []
  );

  const FrontSvgWithHandlers = useMemo(() => {
    return injectHandlersIntoSvg(
      <FrontSvg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />,
      frontHandlers,
      {
        debug: DEBUG_SVG,
        fillColor: DEFAULT_MUSCLE_FILL,
        forceFill: true,
      }
    );
  }, [frontHandlers]);

  const BackSvgWithHandlers = useMemo(() => {
    return injectHandlersIntoSvg(
      <BackSvg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />,
      backHandlers,
      {
        debug: DEBUG_SVG,
        fillColor: DEFAULT_MUSCLE_FILL,
        forceFill: true,
      }
    );
  }, [backHandlers]);

  const animatedStyle = {
    opacity: opacityAnimation,
  };

  const labelColor = "#A1A1AA";
  const numberColor = color;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <View style={{ flex: 1, position: "relative" }}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {side === "front" ? FrontSvgWithHandlers : BackSvgWithHandlers}
        </Animated.View>

        {/* Top-left tiny overlay */}
        <View style={{ position: "absolute", top: 8, left: 10 }}>
          <Text style={{ color: labelColor, fontSize: 10, fontWeight: "500" }}>
            Days since
          </Text>
          <Text style={{ color: numberColor, fontSize: 18, lineHeight: 22, fontWeight: "700" }}>
            {daysSinceLastWorkout}
          </Text>
          <Text style={{ color: labelColor, fontSize: 10, marginTop: 2 }}>
            {daysSinceLastWorkout === 0
              ? "today"
              : daysSinceLastWorkout === 1
              ? "yesterday"
              : `${daysSinceLastWorkout} days ago`}
          </Text>
        </View>

        {/* Top-right tiny overlay */}
        <View style={{ position: "absolute", top: 8, right: 10, alignItems: "flex-end" }}>
          <Text style={{ color: labelColor, fontSize: 10, fontWeight: "500" }}>
            Fresh groups
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={{ color: numberColor, fontSize: 16, fontWeight: "700" }}>
              {freshMuscleGroups}
            </Text>
            <Text style={{ color: labelColor, fontSize: 12, marginLeft: 4 }}>
              / {totalMuscleGroups}
            </Text>
          </View>
          <View style={{ width: 90, height: 3, borderRadius: 999, backgroundColor: "#262637", marginTop: 6 }}>
            <View
              style={{
                height: 3,
                borderRadius: 999,
                width: `${(freshMuscleGroups / totalMuscleGroups) * 100}%`,
                backgroundColor: numberColor,
              }}
            />
          </View>
        </View>

        {/* Flip button - positioned in bottom center */}
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={toggleSide}
            disabled={isAnimating}
            style={{
              backgroundColor: tertiaryColor,
              borderRadius: 25,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
              opacity: isAnimating ? 0.7 : 1,
            }}
          >
            <Ionicons name="sync" size={24} color={color} />
          </TouchableOpacity>

          {/* Optional label below the button */}
          <Text style={{ color: "#A1A1AA", fontSize: 10, marginTop: 4, textAlign: "center" }}>
            {side === "front" ? "View Back" : "View Front"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Recovery;
