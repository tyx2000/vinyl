import { mainColor, textPrimary, textSecondary } from "@/constants/Colors";
import { usePlayerContext } from "@/context/PlayerContext";
import { usePlayerRuntimeContext } from "@/context/PlayerRuntimeContext";
import { AudioItem, AudioLike } from "@/context/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReAnimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  miniButton: {
    width: "92%",
  },
  miniContent: {
    width: "100%",
    minHeight: 62,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#E7ECF5",
    shadowColor: "#0A0E1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  audioName: {
    flexShrink: 1,
    fontWeight: "700",
    fontSize: 14,
    color: textPrimary,
  },
  playTimeMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  timeTextMini: {
    fontSize: 11,
    fontWeight: "600",
    color: textSecondary,
    fontVariant: ["tabular-nums"],
  },
  miniControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  controlIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});

const formatSeconds = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "00:00";
  const minutes = Math.floor(s / 60);
  const seconds = s - minutes * 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${Math.floor(seconds)}`;
};

export default function PlayerFoot({
  playingAudio,
  playRequestId,
  playNext,
  playPrevious,
  sleepTimerEndsAt,
  clearSleepTimer,
}: {
  playingAudio: AudioLike;
  playRequestId: number;
  playNext: () => AudioItem | null;
  playPrevious: () => AudioItem | null;
  sleepTimerEndsAt: number | null;
  clearSleepTimer: () => void;
}) {
  const { setPlayingAudio } = usePlayerContext();
  const { setRuntimeStatus, setRuntimeActions } = usePlayerRuntimeContext();

  const playerRef = useRef<AudioPlayer>(null);
  const statusListenerRef = useRef<{ remove: () => void } | null>(null);

  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const title = useMemo(() => String(playingAudio.name ?? "Unknown"), [playingAudio.name]);
  const hasBottomTabBar = segments[0] === "(tabs)";
  const isPlayerRoute = segments[0] === "player";
  const miniPlayerBottom = insets.bottom + (hasBottomTabBar ? 86 : 12);

  const wrapperBottom = useSharedValue(miniPlayerBottom);
  const swipeX = useSharedValue(0);

  const wrapperStyle = useAnimatedStyle(() => ({
    bottom: wrapperBottom.value,
  }));
  const miniSwipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }],
  }));

  const restartCurrentTrack = async () => {
    if (!playerRef.current) return;
    try {
      await playerRef.current.seekTo(0);
      playerRef.current.play();
      setCurrentTime(0);
      setPlaying(true);
    } catch (error) {
      console.log("restart track error", error);
    }
  };

  const togglePlayer = (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (playerRef.current.playing) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  const previousAudio = async (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    const prevTrack = playPrevious();
    if (prevTrack && prevTrack.uri === playingAudio.uri) {
      await restartCurrentTrack();
    }
  };

  const nextAudio = async (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    const nextTrack = playNext();
    if (nextTrack && nextTrack.uri === playingAudio.uri) {
      await restartCurrentTrack();
    }
  };

  const seekToSeconds = (seconds: number) => {
    if (!playerRef.current || !Number.isFinite(seconds) || seconds < 0) return;
    playerRef.current
      .seekTo(seconds)
      .then(() => {
        setCurrentTime(seconds);
      })
      .catch((error) => {
        console.log("seek error", error);
      });
  };

  const playerStatusUpdate = async (status: AudioStatus) => {
    setPlaying(status.playing);
    setCurrentTime(status.currentTime);
    setDuration(status.duration);
    if (status.didJustFinish) {
      const nextTrack = playNext();
      if (!nextTrack) {
        setPlaying(false);
        clearSleepTimer();
        return;
      }
      if (nextTrack.uri === playingAudio.uri) {
        await restartCurrentTrack();
      }
    }
  };

  const initPlayer = async () => {
    if (typeof playingAudio.uri !== "string") return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "doNotMix",
      });
      const player = createAudioPlayer(playingAudio.uri, { updateInterval: 250 });
      playerRef.current = player;
      statusListenerRef.current = player.addListener(
        "playbackStatusUpdate",
        playerStatusUpdate,
      );
      player.play();
      setPlaying(true);
    } catch (error) {
      console.log("init player error", error);
    }
  };

  const clearPlayer = () => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (!playerRef.current) return;
    statusListenerRef.current?.remove();
    statusListenerRef.current = null;
    playerRef.current.pause();
    playerRef.current.remove();
    playerRef.current = null;
  };

  const dismissPlaybackBySwipe = () => {
    clearSleepTimer();
    setPlayingAudio({});
  };

  const swipeDismissGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-16, 16])
    .onUpdate((event) => {
      swipeX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldDismiss =
        Math.abs(event.translationX) > windowWidth * 0.28 ||
        Math.abs(event.velocityX) > 700;
      if (shouldDismiss) {
        const toX = event.translationX >= 0 ? windowWidth : -windowWidth;
        swipeX.value = withTiming(toX, { duration: 180 }, (finished) => {
          if (finished) {
            runOnJS(dismissPlaybackBySwipe)();
          }
        });
        return;
      }
      swipeX.value = withTiming(0, { duration: 220, easing: Easing.inOut(Easing.quad) });
    });

  useEffect(() => {
    initPlayer();
    return () => {
      clearPlayer();
    };
  }, [playingAudio.uri, title, playRequestId]);

  useEffect(() => {
    wrapperBottom.value = withTiming(miniPlayerBottom, {
      duration: 320,
      easing: Easing.inOut(Easing.quad),
    });
  }, [miniPlayerBottom]);

  useEffect(() => {
    if (!sleepTimerEndsAt) return;
    const timer = setInterval(() => {
      const now = Date.now();
      if (sleepTimerEndsAt <= now) {
        if (playerRef.current?.playing) {
          playerRef.current.pause();
        }
        setPlaying(false);
        clearSleepTimer();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerEndsAt, clearSleepTimer]);

  useEffect(() => {
    setRuntimeStatus({ playing, currentTime, duration });
  }, [playing, currentTime, duration, setRuntimeStatus]);

  useEffect(() => {
    setRuntimeActions({
      togglePlayback: () => togglePlayer(),
      playPreviousTrack: () => {
        void previousAudio();
      },
      playNextTrack: () => {
        void nextAudio();
      },
      seekTo: seekToSeconds,
    });
  }, [setRuntimeActions, playingAudio.uri, playNext, playPrevious]);

  useEffect(() => {
    swipeX.value = 0;
  }, [playingAudio.uri, swipeX]);

  if (!playingAudio || typeof playingAudio.uri !== "string") {
    return null;
  }

  if (isPlayerRoute) {
    return null;
  }

  return (
    <ReAnimated.View
      style={[styles.wrapper, wrapperStyle]}
    >
      <GestureDetector gesture={swipeDismissGesture}>
        <ReAnimated.View style={[styles.miniButton, miniSwipeStyle]}>
          <Pressable onPress={() => router.push("/player")}>
            <View style={styles.miniContent}>
              <View style={styles.titleWrapper}>
                <Text style={styles.audioName} numberOfLines={1} ellipsizeMode="middle">
                  {title}
                </Text>
                <View style={styles.playTimeMini}>
                  <Text style={styles.timeTextMini}>{formatSeconds(currentTime)}</Text>
                  <Text style={styles.timeTextMini}>/</Text>
                  <Text style={styles.timeTextMini}>{formatSeconds(duration)}</Text>
                </View>
              </View>
              <View style={styles.miniControls}>
                <Pressable onPress={previousAudio} style={styles.controlIcon}>
                  <FontAwesome size={22} color={mainColor} name="backward" />
                </Pressable>
                <Pressable onPress={togglePlayer} style={styles.controlIcon}>
                  <FontAwesome size={22} color={mainColor} name={playing ? "pause" : "play"} />
                </Pressable>
                <Pressable onPress={nextAudio} style={styles.controlIcon}>
                  <FontAwesome size={22} color={mainColor} name="forward" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        </ReAnimated.View>
      </GestureDetector>
    </ReAnimated.View>
  );
}
