import React from "react";
import { log } from "@/utils/devLog";

// Import SVG components and utilities from ExerciseAnatomy
// Note: These imports need to match the actual paths in your project
import FrontSvg from "@/assets/svg/front.svg";
import BackSvg from "@/assets/svg/back.svg";

// Muscle name to group ID mapping (copied from ExerciseAnatomy)
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

// Helper functions (copied from ExerciseAnatomy)
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

// SVG processing functions (copied from ExerciseAnatomy)
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

function makeFillKey(
  side: "front" | "back",
  fillById: Record<string, string>
): string {
  const entries = Object.keys(fillById)
    .sort()
    .map((id) => `${id}:${fillById[id]}`)
    .join(";");
  return `${side}|${entries}`;
}

interface Exercise {
  id: string | number;
  name: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}

// Import the LRU cache from ExerciseAnatomy
// This is a bit tricky since we need to access the same cache instance
// We'll need to create a way to access the cache from ExerciseAnatomy
let svgCache: any = null;

// Function to set the cache reference (called from ExerciseAnatomy)
export function setSVGCacheReference(cache: any) {
  svgCache = cache;
}

export function preloadExerciseSVGs(
  exercises: Exercise[],
  primaryColor: string,
  secondaryColor: string
): void {
  // Skip if cache not available
  if (!svgCache) {
    log("[SVG] Cache not available, skipping preload");
    return;
  }

  log("[SVG] Starting preload for", exercises.length, "exercises");

  // Process each exercise with a small delay to avoid blocking
  exercises.forEach((exercise, index) => {
    setTimeout(() => {
      try {
        preloadSingleExercise(exercise, primaryColor, secondaryColor);
      } catch (error) {
        log("[SVG] Error preloading exercise", exercise.name, error);
      }
    }, index * 50); // 50ms delay between each exercise
  });
}

function preloadSingleExercise(
  exercise: Exercise,
  primaryColor: string,
  secondaryColor: string
): void {
  const primaryIds = new Set<string>();
  const secondaryIds = new Set<string>();

  // Process primary muscles
  toArray(exercise.primaryMuscles).forEach((name) => {
    const ids = NAME_TO_GROUP_IDS[normName(name)];
    if (ids) ids.forEach((id) => primaryIds.add(id));
  });

  // Process secondary muscles
  toArray(exercise.secondaryMuscles).forEach((name) => {
    const ids = NAME_TO_GROUP_IDS[normName(name)];
    if (ids) ids.forEach((id) => secondaryIds.add(id));
  });

  // Primary overrides secondary on conflicts
  [...primaryIds].forEach((id) => secondaryIds.delete(id));

  // Skip if no muscles to highlight
  if (primaryIds.size === 0 && secondaryIds.size === 0) {
    return;
  }

  // Create fill mapping
  const fillById: Record<string, string> = {};
  primaryIds.forEach((id) => (fillById[id] = primaryColor));
  secondaryIds.forEach((id) => { if (!fillById[id]) fillById[id] = secondaryColor; });

  // Generate cache keys
  const fillKeyFront = makeFillKey("front", fillById);
  const fillKeyBack = makeFillKey("back", fillById);

  // Check if already cached
  if (svgCache.has(fillKeyFront) && svgCache.has(fillKeyBack)) {
    return;
  }

  try {
    // Preload front SVG
    if (!svgCache.has(fillKeyFront)) {
      const frontElement = applyFills(
        React.createElement(FrontSvg, { 
          width: "100%", 
          height: "100%", 
          preserveAspectRatio: "xMidYMid meet" 
        }),
        fillById
      );
      svgCache.set(fillKeyFront, frontElement);
    }

    // Preload back SVG
    if (!svgCache.has(fillKeyBack)) {
      const backElement = applyFills(
        React.createElement(BackSvg, { 
          width: "100%", 
          height: "100%", 
          preserveAspectRatio: "xMidYMid meet" 
        }),
        fillById
      );
      svgCache.set(fillKeyBack, backElement);
    }

    log("[SVG] Preloaded anatomy for", exercise.name);
  } catch (error) {
    log("[SVG] Failed to preload", exercise.name, error);
  }
}