import React, { useMemo } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import FrontSvg from "@/assets/svg/front.svg";
import BackSvg from "@/assets/svg/back.svg";

type Props = {
  primaryColor: string;
  secondaryColor: string;
  primaryMuscles?: string | string[] | null;
  secondaryMuscles?: string | string[] | null;
  height?: number;
  style?: ViewStyle;
};

const NAME_TO_GROUP_IDS: Record<string, string[]> = {
  "abdominals": ["muscle-abdominals"],
  "abductors": ["muscle-abductors"],
  "adductors": ["muscle-adductors"],
  "biceps": ["muscle-biceps"],
  "calves": ["muscle-calves"],
  "chest": ["muscle-chest"],
  "forearms": ["muscle-forearms"],
  "glutes": ["muscle-glutes"],
  "hamstrings": ["muscle-hamstrings"],
  "lats": ["muscle-lats"],
  "lower back": ["muscle-lower-back"],
  "middle back": ["muscle-middle-back"],
  "neck": ["muscle-neck"],
  "quadriceps": ["muscle-quadriceps"],
  "shoulders": ["muscle-shoulders"],
  "traps": ["muscle-traps"],
  "triceps": ["muscle-triceps"],
};

function normName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}
function toArray(value?: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(/[,/]/g).map((x) => x.trim()).filter(Boolean);
}

const LEAF_TAGS = new Set([
  "Path","Rect","Circle","Ellipse","Line","Polygon","Polyline",
  "path","rect","circle","ellipse","line","polygon","polyline",
]);

function resolveFunctionComponent(el: React.ReactElement<any>): React.ReactElement<any> {
  const type: any = el.type;
  if (typeof type === "function" && !(type.prototype && type.prototype.isReactComponent)) {
    const rendered = type({ ...el.props });
    return React.isValidElement(rendered) ? rendered : el;
  }
  return el;
}

function applyFills(
  element: React.ReactElement<any>,
  fillByGroupId: Record<string, string>
): React.ReactElement<any> {
  const resolved = resolveFunctionComponent(element);

  function colorDescendants(node: React.ReactNode, color: string): React.ReactNode {
    if (!React.isValidElement(node)) return node;
    const el = node as React.ReactElement<any>;
    const typeName =
      typeof el.type === "string"
        ? el.type
        : (el.type as any)?.displayName || (el.type as any)?.name;

    const kids = (el.props ?? {}).children;

    if (LEAF_TAGS.has(typeName)) {
      return React.cloneElement(el, { fill: color }, kids);
    }
    const walked = React.Children.map(kids, (child) => colorDescendants(child, color));
    return React.cloneElement(el, {}, walked);
  }

  function walk(node: React.ReactNode): React.ReactNode {
    if (!React.isValidElement(node)) return node;
    const el = node as React.ReactElement<any>;
    const props: any = el.props ?? {};
    const id: string | undefined = props.id;
    const kids = props.children;

    if (id && fillByGroupId[id]) {
      const color = fillByGroupId[id];
      const walked = React.Children.map(kids, (child) => colorDescendants(child, color));
      return React.cloneElement(el, {}, walked);
    }

    const walked = React.Children.map(kids, walk);
    return React.cloneElement(el, {}, walked);
  }

  return walk(resolved) as React.ReactElement<any>;
}

const ExerciseAnatomy: React.FC<Props> = ({
  primaryColor,
  secondaryColor,
  primaryMuscles,
  secondaryMuscles,
  height = 140,
  style,
}) => {
  const { primaryIds, secondaryIds } = useMemo(() => {
    const p = new Set<string>();
    const s = new Set<string>();
    toArray(primaryMuscles).forEach((name) => {
      const ids = NAME_TO_GROUP_IDS[normName(name)];
      if (ids) ids.forEach((id) => p.add(id));
    });
    toArray(secondaryMuscles).forEach((name) => {
      const ids = NAME_TO_GROUP_IDS[normName(name)];
      if (ids) ids.forEach((id) => s.add(id));
    });
    [...p].forEach((id) => s.delete(id)); // primary wins
    return { primaryIds: p, secondaryIds: s };
  }, [primaryMuscles, secondaryMuscles]);

  if (primaryIds.size === 0 && secondaryIds.size === 0) return null;

  const fillById = useMemo(() => {
    const map: Record<string, string> = {};
    primaryIds.forEach((id) => (map[id] = primaryColor));
    secondaryIds.forEach((id) => { if (!map[id]) map[id] = secondaryColor; });
    return map;
  }, [primaryIds, secondaryIds, primaryColor, secondaryColor]);

  const Front = useMemo(
    () => applyFills(<FrontSvg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />, fillById),
    [fillById]
  );
  const Back = useMemo(
    () => applyFills(<BackSvg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />, fillById),
    [fillById]
  );

  return (
    <View style={[styles.row, { height }, style]}>
      <View style={styles.side}>{Front}</View>
      <View style={styles.side}>{Back}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { width: "100%", flexDirection: "row", gap: 0 },
  side: {
    flex: 1,
    // no background, no radius — fully transparent
  },
});

export default ExerciseAnatomy;