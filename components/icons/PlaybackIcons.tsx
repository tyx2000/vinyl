import type { PlayMode } from "@/context/types";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import ReAnimated, {
  Easing,
  cancelAnimation,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import Svg, { Circle, Path, Polyline, Rect } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  animated?: boolean;
};

const styles = StyleSheet.create({
  waveWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  waveBar: {
    borderRadius: 999,
  },
  modeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  modeLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});

const AnimatedSvgPath = ReAnimated.createAnimatedComponent(Path);

const buildWavePath = (phase: number) => {
  "worklet";
  const left = 2;
  const right = 22;
  const centerY = 12;
  const amplitude = 2.6;
  const cycles = 1.65;
  let d = `M ${left} ${centerY}`;

  for (let x = left; x <= right; x += 1) {
    const t = (x - left) / (right - left);
    const base = Math.sin(t * cycles * Math.PI * 2 + phase) * amplitude;
    const detail = Math.sin(t * cycles * Math.PI * 4 + phase * 1.35) * 0.55;
    const y = centerY + base + detail;
    d += ` L ${x} ${y}`;
  }

  return d;
};

function iconStroke(strokeWidth: number) {
  return {
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth,
  };
}

export function PlayIcon({ size = 24, color = "#1F1F28" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8.4 6.4C8.4 5.4 9.5 4.8 10.4 5.4L17.7 10.1C18.6 10.7 18.6 12 17.7 12.6L10.4 17.3C9.5 17.9 8.4 17.3 8.4 16.3V6.4Z" fill={color} />
    </Svg>
  );
}

export function PauseIcon({ size = 24, color = "#1F1F28" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={7} y={5.6} width={4.2} height={12.8} rx={2.1} fill={color} />
      <Rect x={12.8} y={5.6} width={4.2} height={12.8} rx={2.1} fill={color} />
    </Svg>
  );
}

export function PreviousIcon({ size = 24, color = "#1F1F28" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={6.1} y={5.8} width={2.4} height={12.4} rx={1.2} fill={color} />
      <Path d="M17.2 6.6C17.2 5.8 16.3 5.2 15.6 5.8L9.8 10.4C9.2 10.9 9.2 11.9 9.8 12.4L15.6 17C16.3 17.6 17.2 17 17.2 16.2V6.6Z" fill={color} />
    </Svg>
  );
}

export function NextIcon({ size = 24, color = "#1F1F28" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={15.5} y={5.8} width={2.4} height={12.4} rx={1.2} fill={color} />
      <Path d="M6.8 6.6C6.8 5.8 7.7 5.2 8.4 5.8L14.2 10.4C14.8 10.9 14.8 11.9 14.2 12.4L8.4 17C7.7 17.6 6.8 17 6.8 16.2V6.6Z" fill={color} />
    </Svg>
  );
}

export function TimerIcon({
  size = 24,
  color = "#1F1F28",
  strokeWidth = 1.75,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={13} r={7.2} fill="none" stroke={color} {...iconStroke(strokeWidth)} />
      <Path d="M9.3 3.8H14.7" fill="none" stroke={color} {...iconStroke(strokeWidth)} />
      <Path d="M12 13V9.5" fill="none" stroke={color} {...iconStroke(strokeWidth)} />
      <Path d="M12 13L15 14.7" fill="none" stroke={color} {...iconStroke(strokeWidth)} />
    </Svg>
  );
}

export function RepeatIcon({
  size = 24,
  color = "#1F1F28",
  strokeWidth = 1.75,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4.8 12H18.3" fill="none" stroke={color} {...iconStroke(strokeWidth)} />
      <Polyline points="15.3,9.1 19.2,12 15.3,14.9" fill="none" stroke={color} {...iconStroke(strokeWidth)} />
    </Svg>
  );
}

export function RepeatOneIcon({
  size = 24,
  color = "#1F1F28",
  strokeWidth = 1.75,
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.7 12C17.7 15.2 15.2 17.7 12 17.7C9.2 17.7 6.9 15.8 6.3 13.3"
        fill="none"
        stroke={color}
        {...iconStroke(strokeWidth)}
      />
      <Path
        d="M6.3 12C6.3 8.8 8.8 6.3 12 6.3C14.8 6.3 17.1 8.2 17.7 10.7"
        fill="none"
        stroke={color}
        {...iconStroke(strokeWidth)}
      />
      <Polyline
        points="6.1,16.7 6.2,13.1 9.4,14.2"
        fill="none"
        stroke={color}
        {...iconStroke(strokeWidth)}
      />
    </Svg>
  );
}

export function NowPlayingIcon({
  size = 24,
  color = "#1F1F28",
  animated = true,
}: IconProps) {
  const phase = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      cancelAnimation(phase);
      return;
    }

    const start = phase.value % (Math.PI * 2);
    phase.value = withRepeat(
      withTiming(start + Math.PI * 2, {
        duration: 1450,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(phase);
    };
  }, [animated, phase]);

  const animatedProps = useAnimatedProps(() => ({
    d: buildWavePath(phase.value),
  }));

  return (
    <View style={[styles.waveWrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <AnimatedSvgPath
          animatedProps={animatedProps}
          fill="none"
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function PlayModeIcon({
  mode,
  size = 24,
  color = "#1F1F28",
}: {
  mode: PlayMode;
  size?: number;
  color?: string;
}) {
  const loopAlpha = useSharedValue(mode === "loop" ? 1 : 0);
  const singleAlpha = useSharedValue(mode === "single" ? 1 : 0);

  useEffect(() => {
    loopAlpha.value = withTiming(mode === "loop" ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    });
    singleAlpha.value = withTiming(mode === "single" ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    });
  }, [mode, loopAlpha, singleAlpha]);

  const layerStyle = (alpha: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: alpha.value,
      transform: [
        { scale: 0.92 + alpha.value * 0.08 },
        { rotate: `${(1 - alpha.value) * -8}deg` },
      ],
    }));

  const loopStyle = layerStyle(loopAlpha);
  const singleStyle = layerStyle(singleAlpha);

  return (
    <View
      style={[
        styles.modeWrap,
        { width: size, height: size },
      ]}
    >
      <ReAnimated.View
        style={[
          styles.modeLayer,
          { width: size, height: size },
          loopStyle,
        ]}
      >
        <RepeatIcon size={size} color={color} />
      </ReAnimated.View>
      <ReAnimated.View
        style={[
          styles.modeLayer,
          { width: size, height: size },
          singleStyle,
        ]}
      >
        <RepeatOneIcon size={size} color={color} />
      </ReAnimated.View>
    </View>
  );
}
