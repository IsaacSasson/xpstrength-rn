import React, { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import FrontSvg from "@/assets/svg/front.svg";
import { injectHandlersIntoSvg } from "@/utils/inject-svg-handlers";

interface RecoveryProps {
  color: string;         // primaryColor
  tertiaryColor: string; // unused for now
}

// Debug off
const DEBUG_SVG = false;
// Default unified fill for target groups' leaf paths
const DEFAULT_MUSCLE_FILL = "#ccccccff";

const Recovery: React.FC<RecoveryProps> = ({ color }) => {
  const daysSinceLastWorkout: number = 2;
  const freshMuscleGroups: number = 5;
  const totalMuscleGroups: number = 8;

  const [side] = useState<"front" | "back">("front");

  const navigateToGroup = (muscleGroupId: string) => {
    const cleanId = muscleGroupId.replace(/^muscle-/, "");
    router.push(`/(tabs)/stats/muscle-group?group=${cleanId}`);
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

  const SvgWithHandlers = useMemo(() => {
    return injectHandlersIntoSvg(
      <FrontSvg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />,
      frontHandlers,
      {
        debug: DEBUG_SVG,
        fillColor: DEFAULT_MUSCLE_FILL,
        forceFill: true, // ensure consistent gray even if original fills differ
        // onCollectedIds: (ids) => console.log("[SVG ids found]", ids), // uncomment if needed
      }
    );
  }, [frontHandlers]);

  const labelColor = "#A1A1AA";
  const numberColor = color;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <View style={{ flex: 1, position: "relative" }}>
        {side === "front" && SvgWithHandlers}

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
      </View>
    </View>
  );
};

export default Recovery;