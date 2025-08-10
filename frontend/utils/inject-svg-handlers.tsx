import React from "react";

type Handlers = Record<string, () => void>;

type InjectOptions = {
  // Debug overlay (cyan fill & stroke on hit shapes)
  debug?: boolean;
  debugColor?: string;
  // Optional: when NOT in debug, force a consistent base fill on leaf shapes
  fillColor?: string;     // e.g., "#ccccccff"
  forceFill?: boolean;    // if true, overwrite existing fill with fillColor
  onCollectedIds?: (ids: string[]) => void;
};

// Leaf shapes we’ll attach presses to
const LEAF_TAGS = new Set([
  "Path","Rect","Circle","Ellipse","Line","Polygon","Polyline",
  "path","rect","circle","ellipse","line","polygon","polyline",
]);

// Containers we never make clickable
const NON_HITTABLE_TAGS = new Set([
  "G","Defs","ClipPath","Mask","Symbol","Title","Desc",
  "g","defs","clipPath","mask","symbol","title","desc",
]);

function isClassComponent(type: any): boolean {
  return !!(type && type.prototype && type.prototype.isReactComponent);
}

/** Safely “resolve” a function component (not class) to its rendered tree */
function resolveElement(node: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(node)) return node;
  const el = node as React.ReactElement<any>;
  const type: any = el.type;

  if (typeof type === "function" && !isClassComponent(type)) {
    try {
      const rendered = type({ ...el.props });
      return resolveElement(rendered);
    } catch {
      return el;
    }
  }
  return el;
}

export function injectHandlersIntoSvg(
  element: React.ReactElement,
  handlers: Handlers,
  options: InjectOptions = {}
): React.ReactElement {
  const {
    debug = false,
    debugColor = "#00E5FF",
    fillColor,
    forceFill = false,
    onCollectedIds,
  } = options;

  const collected: string[] = [];

  // Attach press handler to leaf shapes under a target group
  function attachToDescendants(node: React.ReactNode, press: () => void): React.ReactNode {
    if (!React.isValidElement(node)) return node;

    const el = node as React.ReactElement<any>;
    const typeName =
      typeof el.type === "string"
        ? el.type
        : (el.type as any)?.displayName || (el.type as any)?.name;

    const propsAny: any = el.props ?? {};
    const kids = propsAny.children;

    if (LEAF_TAGS.has(typeName)) {
      const extra: Record<string, any> = {
        // Always attach press to leaf shapes
        onPress: propsAny.onPress ?? press,
        pointerEvents: "auto",
      };

      if (debug) {
        // Force a cyan overlay regardless of original fill/opacity
        extra.stroke = debugColor;
        extra.strokeWidth = 2;
        extra.strokeOpacity = 0.95;
        extra.fill = debugColor;
        extra.fillOpacity = 0.20;
        extra.vectorEffect = "non-scaling-stroke";
      } else if (fillColor) {
        // Non-debug: unify fill across leaf shapes in the target group
        if (forceFill || propsAny.fill == null) {
          extra.fill = fillColor;
        }
        // preserve existing opacity unless you want to normalize it too
      }

      return React.cloneElement(el, extra, kids);
    }

    if (NON_HITTABLE_TAGS.has(typeName)) {
      const walked = React.Children.map(kids, (child) => attachToDescendants(child, press));
      const extra: Record<string, any> = { pointerEvents: "box-none" };
      return React.cloneElement(el, extra, walked);
    }

    const walked = React.Children.map(kids, (child) => attachToDescendants(child, press));
    return React.cloneElement(el, {}, walked);
  }

  function walk(node: React.ReactNode): React.ReactNode {
    if (!React.isValidElement(node)) return node;

    const el = node as React.ReactElement<any>;
    const propsAny: any = el.props ?? {};
    const id: string | undefined = propsAny.id;
    const kids: React.ReactNode = propsAny.children;

    if (id) collected.push(id);

    if (id && handlers[id]) {
      const press = handlers[id];
      const groupExtras: Record<string, any> = { pointerEvents: "box-none" };
      const walked = React.Children.map(kids, (child) => attachToDescendants(child, press));
      return React.cloneElement(el, groupExtras, walked);
    }

    const walked = React.Children.map(kids, walk);
    return React.cloneElement(el, {}, walked);
  }

  // Resolve the SVGR component to its rendered tree, then walk it
  const resolved = (() => {
    try { return resolveElement(element) as React.ReactElement; }
    catch { return element; }
  })();

  const out = walk(resolved) as React.ReactElement;

  if (onCollectedIds) onCollectedIds(Array.from(new Set(collected)));

  return out;
}