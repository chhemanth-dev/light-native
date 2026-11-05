/**
 * The main animated orb — changes appearance based on assistant state.
 * Idle: soft pulsing glow
 * Listening: ripple rings
 * Thinking: rotating arc
 * Speaking: wave bars
 */
import React, { useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import type { AssistantState } from "../lib/assistant";

type Props = {
  state: AssistantState;
  onPress: () => void;
  size?: number;
};

export function OrbAnimation({ state, onPress, size = 120 }: Props) {
  const pulse = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);
    cancelAnimation(ring1);
    cancelAnimation(ring2);
    cancelAnimation(ring3);
    cancelAnimation(rotate);

    if (state === "idle") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      );
    } else if (state === "listening") {
      setTimeout(() => { ring1.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1); }, 0);
      setTimeout(() => { ring2.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1); }, 600);
      setTimeout(() => { ring3.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1); }, 1200);
    } else if (state === "thinking") {
      rotate.value = withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }),
        -1
      );
    } else if (state === "speaking") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      );
    }
  }, [state]);

  const coreStyle = useAnimatedStyle(() => {
    const scale =
      state === "idle"
        ? interpolate(pulse.value, [0, 1], [1, 1.06])
        : state === "speaking"
        ? interpolate(pulse.value, [0, 1], [0.95, 1.08])
        : 1;
    return { transform: [{ scale }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity =
      state === "idle" ? interpolate(pulse.value, [0, 1], [0.3, 0.7]) :
      state === "speaking" ? interpolate(pulse.value, [0, 1], [0.4, 0.85]) :
      state === "listening" ? 0.7 :
      state === "thinking" ? 0.5 : 0.3;
    return { opacity };
  });

  // Rings — defined at top level (rules of hooks respected)
  const ring1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring1.value, [0, 0.3, 1], [0.8, 0.6, 0]),
    transform: [{ scale: interpolate(ring1.value, [0, 1], [1, 2.2]) }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring2.value, [0, 0.3, 1], [0.8, 0.6, 0]),
    transform: [{ scale: interpolate(ring2.value, [0, 1], [1, 2.2]) }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    opacity: interpolate(ring3.value, [0, 0.3, 1], [0.8, 0.6, 0]),
    transform: [{ scale: interpolate(ring3.value, [0, 1], [1, 2.2]) }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const orbColor =
    state === "idle" ? "#3B82F6" :
    state === "listening" ? "#22D3EE" :
    state === "thinking" ? "#A78BFA" :
    state === "speaking" ? "#34D399" :
    "#EF4444";

  const s = size;
  const ringBase = { position: "absolute" as const, width: s, height: s, borderRadius: s / 2, borderWidth: 2, borderColor: orbColor };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Pulse rings for listening */}
      {state === "listening" && (
        <>
          <Animated.View style={[ringBase, ring1Style]} />
          <Animated.View style={[ringBase, ring2Style]} />
          <Animated.View style={[ringBase, ring3Style]} />
        </>
      )}

      {/* Glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: s * 1.4,
            height: s * 1.4,
            borderRadius: (s * 1.4) / 2,
            backgroundColor: orbColor,
          },
          glowStyle,
        ]}
      />

      {/* Core orb */}
      <Animated.View style={coreStyle}>
        <View
          style={[
            styles.orb,
            {
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: "#0A0F1E",
              borderWidth: 2,
              borderColor: orbColor,
            },
          ]}
        >
          {/* Thinking spinner arc */}
          {state === "thinking" && (
            <Animated.View style={[StyleSheet.absoluteFill, styles.center, spinStyle]}>
              <Svg width={s * 0.7} height={s * 0.7} viewBox="0 0 100 100">
                <Path
                  d="M 50 10 A 40 40 0 0 1 90 50"
                  stroke={orbColor}
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          )}

          {/* Mic icon when idle/listening */}
          {(state === "idle" || state === "listening") && (
            <Svg width={s * 0.35} height={s * 0.35} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
                stroke={orbColor}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Path
                d="M5 10a7 7 0 0 0 14 0"
                stroke={orbColor}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <Path
                d="M12 19v3M9 22h6"
                stroke={orbColor}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
          )}

          {/* Sound waves when speaking */}
          {state === "speaking" && (
            <View style={styles.waveBars}>
              {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
                <WaveBar key={i} height={h} color={orbColor} index={i} />
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function WaveBar({ height, color, index }: { height: number; color: string; index: number }) {
  const anim = useSharedValue(height);
  useEffect(() => {
    anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 + index * 60 }),
        withTiming(height, { duration: 300 + index * 60 })
      ),
      -1
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    height: anim.value * 28,
    backgroundColor: color,
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  }));
  return <Animated.View style={style} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
  },
  orb: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    position: "absolute",
    opacity: 0.3,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  waveBars: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },
});
