import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useThemeContext } from "@/context/ThemeContext";

interface CalenderProps {
  restDays?: Date[];
  missedDays?: Date[];
  selectedDate: Date;
  onSelectDate?: (date: Date) => void;
}

const Calender: React.FC<CalenderProps> = ({
  restDays = [],
  missedDays = [],
  selectedDate,
  onSelectDate,
}) => {
  const { primaryColor } = useThemeContext();

  /* ----------------------------- Colors --------------------------------- */
  const restColor = "#3e2759";
  const defaultCircle = "#2c2b37";
  const missedCircle = "#ffffff";
  const missedText = "#0F0E1A";

  /* ----------------------------- Helpers -------------------------------- */
  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const restSet = useMemo(() => new Set(restDays.map(dateKey)), [restDays]);
  const missedSet = useMemo(
    () => new Set(missedDays.map(dateKey)),
    [missedDays]
  );

  const today = new Date();
  const sunday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay()
  );

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [sunday]);

  /* --------------------------- Render Circles --------------------------- */
  const renderDay = (date: Date) => {
    const key = dateKey(date);
    const isToday = key === dateKey(today);

    let circleStyle = { backgroundColor: defaultCircle };
    let textStyle: { color?: string } = { color: "#ffffff" };

    if (isToday) {
      circleStyle.backgroundColor = primaryColor;
      textStyle.color = "#0F0E1A";
    } else if (restSet.has(key)) {
      circleStyle.backgroundColor = restColor;
    } else if (missedSet.has(key)) {
      circleStyle.backgroundColor = missedCircle;
      textStyle.color = missedText;
    }

    return (
      <TouchableOpacity
        key={key}
        onPress={() => onSelectDate?.(date)}
        activeOpacity={0.8}
        style={styles.dayContainer}
      >
        <View style={[styles.circle, circleStyle]}>
          <Text style={[styles.dayNumber, textStyle]}>{date.getDate()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* ------------------------- JSX --------------------------------------- */
  const selectedIdx = selectedDate.getDay();

  return (
    <View style={styles.wrapper}>
      {/* Weekday letters (selected letter tinted) */}
      <View style={styles.labelRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((l, i) => (
          <Text
            key={`${l}-${i}`}
            style={[
              styles.labelText,
              i === selectedIdx && { color: primaryColor },
            ]}
          >
            {l}
          </Text>
        ))}
      </View>

      {/* Day circles (current week only) */}
      <View style={styles.circleRow}>{weekDates.map(renderDay)}</View>
    </View>
  );
};

/* --------------------------- Styles ------------------------------------ */
const CIRCLE_SIZE = 40;

const styles = StyleSheet.create({
  wrapper: { width: "100%", alignItems: "center", marginBottom: 18 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 6,
  },
  labelText: {
    color: "#9e9e9e",
    fontSize: 14,
    width: CIRCLE_SIZE,
    textAlign: "center",
  },
  circleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  dayContainer: { alignItems: "center", width: CIRCLE_SIZE },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumber: { fontSize: 16 },
});

export default Calender;
