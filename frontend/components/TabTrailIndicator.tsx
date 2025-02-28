import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface TabTrailIndicatorProps {
  activeIndex: number;
  numTabs: number;
  color: string;
  dotSize?: number;
  tabBarHeight?: number;
  // We won't rely heavily on animationDuration since we do distance-based timing,
  // but we'll keep it for a default base time.
  animationDuration?: number;
  fadeOutDuration?: number;
  maxTrailLength?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Background color to which we fade the trail
const BACKGROUND_COLOR = '#161622';

const TabTrailIndicator: React.FC<TabTrailIndicatorProps> = ({
  activeIndex,
  numTabs,
  color,
  dotSize = 2,
  tabBarHeight = 80,
  fadeOutDuration = 800,
  maxTrailLength = 50,
}) => {
  // Animated values for the circle’s position
  const dotPositionX = useRef(new Animated.Value(0)).current;
  const dotPositionY = useRef(new Animated.Value(0)).current;

  // We store the circle's position in state for building the path
  const [circleX, setCircleX] = useState(0);
  const [circleY, setCircleY] = useState(0);

  // For deciding when to add path points
  const lastDirectionRef = useRef<'up' | 'down' | 'none'>('none');
  const lastSlopeRef = useRef(0);

  // The array of points that builds the trailing path
  const [pathPoints, setPathPoints] = useState<{
    x: number;
    y: number;
    timestamp: number;
    isKeyPoint?: boolean;
  }[]>([]);

  // Track the previous tab to know when it changed
  const prevActiveIndexRef = useRef(activeIndex);

  // Calculate the new X position for the target tab
  const tabWidth = screenWidth / numTabs;
  const targetX = activeIndex * tabWidth + tabWidth / 2;

  // On mount, set initial position
  useEffect(() => {
    dotPositionX.setValue(targetX);
    dotPositionY.setValue(0);
    setCircleX(targetX);
    setCircleY(0);

    // Start the path with an initial point
    setPathPoints([{ x: targetX, y: 0, timestamp: Date.now() }]);
  }, []);

  useEffect(() => {
    // If the activeIndex changed, we animate from current -> new
    if (prevActiveIndexRef.current !== activeIndex) {
      prevActiveIndexRef.current = activeIndex;

      // Clear existing path points on each tab change (optional)
      setPathPoints([{ x: circleX, y: circleY, timestamp: Date.now() }]);

      // 1) Compute distance & direction
      const startX = circleX;
      const endX = targetX;
      const distX = endX - startX; // could be negative if going left
      const distance = Math.abs(distX);

      // 2) We'll define a total horizontal travel time based on distance.
      //    This is a simple linear formula: let speed ~ 2ms per px plus a small base time.
      const baseTime = 50; // minimal base
      const speedFactor = 2; // ms per px
      const totalHorizontalTime = baseTime + distance * speedFactor;

      // 3) Animate dotPositionX from startX to endX over that total time
      const moveHorizontally = Animated.timing(dotPositionX, {
        toValue: endX,
        duration: totalHorizontalTime,
        easing: Easing.out(Easing.ease), //change to inOut if u want it to start slow, but thats not as cool.
        useNativeDriver: false,
      });

      // 4) We want the heartbeat in the *middle* of that horizontal move.
      //    The heartbeat is a fixed shape over ~400ms. We simply run Y up/down
      //    in the middle portion of the X travel. The circle keeps moving forward in X.
      //    We'll do:
      //      - Delay for half of the leftover time
      //      - Heartbeat (400ms)
      //      - Delay for the remaining time
      //
      //    If totalHorizontalTime < 400, we'll clamp to avoid negative delays.
      const heartbeatDuration = 200;
      const spareTime = Math.max(0, totalHorizontalTime - heartbeatDuration);
      const halfDelay = spareTime / 1.5;

      // Our specific heartbeat shape:
      //    0 -> -5   (slight up)
      //    -5 -> 10  (down)
      //    10 -> -15 (bigger up)
      //    -15 -> 20 (bigger down)
      //    20 -> -30 (way up)
      //    -30 -> 12 (down less)
      //    12 -> -8  (up a bit)
      //    -8 -> 0   (back to baseline)
      // We'll define durations that sum ~400ms total.
      const heartbeatKeyframes = [
        { toValue: -5,   duration: 10 }, //20 dureation for pc but 10 for amazing mobile cream :weary:
        { toValue: 10,   duration: 10 },
        { toValue: -15,  duration: 10 },
        { toValue: 20,   duration: 10 },
        { toValue: -30,  duration: 10 },
        { toValue: 12,   duration: 10 },
        { toValue: -8,   duration: 10 },
        { toValue: 0,    duration: 10 },
      ];
      // Turn that into a single Animated.sequence
      const heartbeatAnims = heartbeatKeyframes.map((step) =>
        Animated.timing(dotPositionY, {
          toValue: step.toValue,
          duration: step.duration,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      const heartbeatSequence = Animated.sequence(heartbeatAnims);

      // Combine the middle delay + heartbeat + trailing delay
      const ySequence = Animated.sequence([
        Animated.delay(halfDelay),
        heartbeatSequence,
        Animated.delay(halfDelay),
      ]);

      // 5) Run X and Y in parallel
      Animated.parallel([moveHorizontally, ySequence]).start();
    }
  }, [activeIndex, targetX]);

  // Update circleX/circleY whenever dotPositionX or dotPositionY changes
  useEffect(() => {
    const xSub = dotPositionX.addListener(({ value }) => setCircleX(value));
    const ySub = dotPositionY.addListener(({ value }) => setCircleY(value));

    return () => {
      dotPositionX.removeListener(xSub);
      dotPositionY.removeListener(ySub);
    };
  }, [dotPositionX, dotPositionY]);

  /**
   * Continuously sample the circle’s position for the trailing path.
   */
  useEffect(() => {
    let rafId: number;

    const updatePath = () => {
      if (pathPoints.length > 0) {
        const lastPoint = pathPoints[pathPoints.length - 1];
        const dx = circleX - lastPoint.x;
        const dy = circleY - lastPoint.y;

        // Basic direction detection
        let currentDirection: 'up' | 'down' | 'none' = 'none';
        if (dy > 0.5) currentDirection = 'down';
        else if (dy < -0.5) currentDirection = 'up';

        // Slope
        let currentSlope = 0;
        if (Math.abs(dx) > 0.1) {
          currentSlope = dy / dx;
        }

        // Distance from last point
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Time since last point
        const timeSinceLast = Date.now() - lastPoint.timestamp;

        // Decide if we add a new point
        const directionChanged =
          lastDirectionRef.current !== currentDirection && currentDirection !== 'none';
        const slopeChanged = Math.abs(currentSlope - lastSlopeRef.current) > 0.5;
        const movedEnough = dist > 3;
        const tooLong = timeSinceLast > 50;

        if (directionChanged || slopeChanged || movedEnough || tooLong) {
          const now = Date.now();
          const isKeyPoint = directionChanged || Math.abs(dy) > 10 || Math.abs(circleY) > 20;

          setPathPoints((prev) => {
            const newPoint = { x: circleX, y: circleY, timestamp: now, isKeyPoint };
            const updated = [...prev, newPoint];

            // Fade out older points
            const cutoff = now - fadeOutDuration;
            const filtered = updated.filter((p) => p.timestamp >= cutoff);

            // Limit total points
            if (filtered.length > maxTrailLength) {
              return filtered.slice(filtered.length - maxTrailLength);
            }
            return filtered;
          });

          lastDirectionRef.current = currentDirection;
          lastSlopeRef.current = currentSlope;
        }
      }
      rafId = requestAnimationFrame(updatePath);
    };

    rafId = requestAnimationFrame(updatePath);
    return () => cancelAnimationFrame(rafId);
  }, [circleX, circleY, pathPoints, fadeOutDuration, maxTrailLength]);

  /**
   * Fades the line segments quickly after ~20% of life, fully by 40%.
   */
  const getNonLinearFade = (linearPercent: number) => {
    const fadeStart = 0.2;
    const fadeEnd = 0.4;
    if (linearPercent < fadeStart) return 0;
    if (linearPercent >= fadeEnd) return 1;
    const t = (linearPercent - fadeStart) / (fadeEnd - fadeStart);
    return Math.pow(t, 1.75);
  };

  /**
   * Interpolate the segment color from the main color to BACKGROUND_COLOR over time.
   */
  const interpolateColor = (linearPercent: number) => {
    const fadePercent = getNonLinearFade(linearPercent);

    const r1 = parseInt(color.slice(1, 3), 16);
    const g1 = parseInt(color.slice(3, 5), 16);
    const b1 = parseInt(color.slice(5, 7), 16);

    const r2 = parseInt(BACKGROUND_COLOR.slice(1, 3), 16);
    const g2 = parseInt(BACKGROUND_COLOR.slice(3, 5), 16);
    const b2 = parseInt(BACKGROUND_COLOR.slice(5, 7), 16);

    const r = Math.round(r1 + fadePercent * (r2 - r1));
    const g = Math.round(g1 + fadePercent * (g2 - g1));
    const b = Math.round(b1 + fadePercent * (b2 - b1));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`;
  };

  // Build path segments
  const now = Date.now();
  const segments = [];

  for (let i = 1; i < pathPoints.length; i++) {
    const p1 = pathPoints[i - 1];
    const p2 = pathPoints[i];

    const midTime = (p1.timestamp + p2.timestamp) / 2;
    const age = now - midTime;

    if (age < fadeOutDuration) {
      const fadeRatio = age / fadeOutDuration;
      const segmentColor = interpolateColor(fadeRatio);

      // Convert local y=0 (circle baseline) to top-based for SVG
      const p1y = screenHeight - (tabBarHeight + p1.y);
      const p2y = screenHeight - (tabBarHeight + p2.y);

      const isImportant = p1.isKeyPoint || p2.isKeyPoint;
      const strokeWidth = isImportant ? dotSize - 3 : dotSize - 3;

      segments.push(
        <Path
          key={`segment-${i}`}
          d={`M ${p1.x} ${p1y} L ${p2.x} ${p2y}`}
          stroke={segmentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
  }

  // The circle's SVG y-position
  const circleTopY = screenHeight - (tabBarHeight + circleY);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        {segments}
        <Circle cx={circleX} cy={circleTopY} r={dotSize / 2} fill={color} />
      </Svg>
    </View>
  );
};

export default TabTrailIndicator;
