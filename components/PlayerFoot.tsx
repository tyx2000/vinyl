import {
  divider,
  onMainColor,
  surfaceSecondary,
  textPrimary,
  textSecondary,
} from "@/constants/Colors";
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon } from "@/components/icons/PlaybackIcons";
import { usePlayerContext } from "@/context/PlayerContext";
import { usePlayerRuntimeContext } from "@/context/PlayerRuntimeContext";
import { AudioItem, AudioLike, PlayMode } from "@/context/types";
import { getLocalValue, normalizeAudioName, setLocalValue } from "@/utils/helper";
import { File } from "expo-file-system";
import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import { useRouter, useSegments } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AppState,
    AppStateStatus,
    GestureResponderEvent,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
  useWindowDimensions
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReAnimated, {
  Easing,
  FadeIn,
  FadeOut,
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
    borderColor: divider,
    backgroundColor: surfaceSecondary,
    shadowColor: "#0A0E1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
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
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTransition: {
    width: 24,
    height: 24,
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

const PLAYER_STATE_KEY = "vinyl-player-state";

type PersistedPlayerState = {
  playingAudio?: AudioItem;
  currentPlaylist: AudioItem[];
  currentIndex: number;
  playMode: PlayMode;
  currentTime: number;
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
  const {
    setPlayingAudio,
    currentPlaylist,
    currentIndex,
    playMode,
    setPlayMode,
    playFromQueue,
  } = usePlayerContext();
  const { setRuntimeStatus, setRuntimeActions } = usePlayerRuntimeContext();

  const playerRef = useRef<AudioPlayer>(null);
  const statusListenerRef = useRef<{ remove: () => void } | null>(null);
  const sleepTimerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreRef = useRef<{
    uri: string;
    currentTime: number;
  } | null>(null);
  const persistStateRef = useRef<PersistedPlayerState | null>(null);
  const runtimeActionRef = useRef({
    togglePlayback: () => {},
    playPreviousTrack: () => {},
    playNextTrack: () => {},
    seekTo: (_seconds: number) => {},
  });

  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [hydrated, setHydrated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const title = useMemo(
    () =>
      normalizeAudioName(
        typeof playingAudio.name === "string" ? playingAudio.name : "",
        typeof playingAudio.uri === "string" ? playingAudio.uri : undefined,
      ),
    [playingAudio.name, playingAudio.uri],
  );
  const isPlayerRoute = segments[0] === "player";
  const miniPlayerBottom = insets.bottom + 12;

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

  const savePlayerState = useCallback(async (next: PersistedPlayerState) => {
    try {
      await setLocalValue(PLAYER_STATE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log("save player state error", error);
    }
  }, []);

  const buildPersistedState = (): PersistedPlayerState => {
    const activeAudio =
      typeof playingAudio.uri === "string" && typeof playingAudio.name === "string"
        ? {
            uri: playingAudio.uri,
            name: normalizeAudioName(playingAudio.name, playingAudio.uri),
          }
        : undefined;

    return {
      playingAudio: activeAudio,
      currentPlaylist: currentPlaylist.map((item) => ({
        ...item,
        name: normalizeAudioName(item.name, item.uri),
      })),
      currentIndex,
      playMode,
      currentTime,
    };
  };

  const flushPlayerState = useCallback(() => {
    if (!hydrated || !persistStateRef.current) return;
    void savePlayerState(persistStateRef.current);
  }, [hydrated, savePlayerState]);

  const stopPlayback = (clearTimer = false) => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
    setPlaying(false);
    if (clearTimer) {
      clearSleepTimer();
    }
    flushPlayerState();
  };

  const togglePlayer = (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    if (!playerRef.current) return;
    if (playerRef.current.playing) {
      playerRef.current.pause();
    } else {
      const isTrackFinished = duration > 0 && currentTime >= duration - 0.2;
      if (isTrackFinished) {
        void restartCurrentTrack();
        return;
      }
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

  runtimeActionRef.current.togglePlayback = () => {
    togglePlayer();
  };
  runtimeActionRef.current.playPreviousTrack = () => {
    void previousAudio();
  };
  runtimeActionRef.current.playNextTrack = () => {
    void nextAudio();
  };
  runtimeActionRef.current.seekTo = (seconds: number) => {
    seekToSeconds(seconds);
  };

  const playerStatusUpdate = async (status: AudioStatus) => {
    setPlaying(status.playing);
    setCurrentTime(status.currentTime);
    setDuration(status.duration);
    if (status.didJustFinish) {
      const nextTrack = playNext();
      if (!nextTrack) {
        stopPlayback(true);
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
      const player = createAudioPlayer(playingAudio.uri, {
        updateInterval: 250,
        keepAudioSessionActive: true,
      });
      playerRef.current = player;
      statusListenerRef.current = player.addListener(
        "playbackStatusUpdate",
        playerStatusUpdate,
      );

      const restore = restoreRef.current;
      if (restore?.uri === playingAudio.uri) {
        if (restore.currentTime > 0) {
          await player.seekTo(restore.currentTime);
          setCurrentTime(restore.currentTime);
        }
        setPlaying(false);
        restoreRef.current = null;
      } else {
        player.play();
        setPlaying(true);
      }
    } catch (error) {
      console.log("init player error", error);
    }
  };

  const clearPlayer = () => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }
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
    if (!hydrated) return;
    initPlayer();
    return () => {
      clearPlayer();
    };
  }, [hydrated, playingAudio.uri, playRequestId]);

  useEffect(() => {
    const hydratePlayer = async () => {
      try {
        const raw = await getLocalValue(PLAYER_STATE_KEY);
        if (!raw) {
          setHydrated(true);
          return;
        }

        const parsed = JSON.parse(raw) as PersistedPlayerState;
        const playlist = Array.isArray(parsed.currentPlaylist)
          ? parsed.currentPlaylist
              .filter(
                (item): item is AudioItem =>
                  !!item &&
                  typeof item.uri === "string" &&
                  typeof item.name === "string",
              )
              .map((item) => ({
                ...item,
                name: normalizeAudioName(item.name, item.uri),
              }))
          : [];

        const restoredAudio =
          parsed.playingAudio &&
          typeof parsed.playingAudio.uri === "string" &&
          typeof parsed.playingAudio.name === "string"
            ? {
                uri: parsed.playingAudio.uri,
                name: normalizeAudioName(
                  parsed.playingAudio.name,
                  parsed.playingAudio.uri,
                ),
              }
            : undefined;

        const verifiedRestoredAudio =
          restoredAudio &&
          (!restoredAudio.uri.startsWith("file:") || new File(restoredAudio.uri).exists)
            ? restoredAudio
            : undefined;

        if (parsed.playMode) {
          setPlayMode(parsed.playMode);
        }

        const verifiedQueue = playlist.filter(
          (item) => !item.uri.startsWith("file:") || new File(item.uri).exists,
        );

        if (verifiedRestoredAudio) {
          const queue = verifiedQueue.length > 0 ? verifiedQueue : [verifiedRestoredAudio];
          const fallbackIndex = queue.findIndex(
            (item) => item.uri === verifiedRestoredAudio.uri,
          );
          const index =
            typeof parsed.currentIndex === "number" &&
            parsed.currentIndex >= 0 &&
            parsed.currentIndex < queue.length
              ? parsed.currentIndex
              : Math.max(fallbackIndex, 0);

          restoreRef.current = {
            uri: verifiedRestoredAudio.uri,
            currentTime:
              typeof parsed.currentTime === "number" && parsed.currentTime > 0
                ? parsed.currentTime
                : 0,
          };

          playFromQueue(queue, index);
        }
      } catch (error) {
        console.log("hydrate player state error", error);
      } finally {
        setHydrated(true);
      }
    };

    hydratePlayer();
  }, []);

  useEffect(() => {
    wrapperBottom.value = withTiming(miniPlayerBottom, {
      duration: 320,
      easing: Easing.inOut(Easing.quad),
    });
  }, [miniPlayerBottom]);

  useEffect(() => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }
    if (!sleepTimerEndsAt) return;

    const remainingMs = sleepTimerEndsAt - Date.now();
    if (remainingMs <= 0) {
      stopPlayback(true);
      return;
    }

    sleepTimerTimeoutRef.current = setTimeout(() => {
      sleepTimerTimeoutRef.current = null;
      stopPlayback(true);
    }, remainingMs);

    return () => {
      if (sleepTimerTimeoutRef.current) {
        clearTimeout(sleepTimerTimeoutRef.current);
        sleepTimerTimeoutRef.current = null;
      }
    };
  }, [sleepTimerEndsAt]);

  useEffect(() => {
    setRuntimeStatus({ playing, currentTime, duration });
  }, [playing, currentTime, duration, setRuntimeStatus]);

  useEffect(() => {
    setRuntimeActions({
      togglePlayback: () => runtimeActionRef.current.togglePlayback(),
      playPreviousTrack: () => runtimeActionRef.current.playPreviousTrack(),
      playNextTrack: () => runtimeActionRef.current.playNextTrack(),
      seekTo: (seconds: number) => runtimeActionRef.current.seekTo(seconds),
    });
  }, [setRuntimeActions]);

  useEffect(() => {
    swipeX.value = 0;
  }, [playingAudio.uri, swipeX]);

  useEffect(() => {
    persistStateRef.current = buildPersistedState();
  }, [
    playingAudio.uri,
    playingAudio.name,
    currentPlaylist,
    currentIndex,
    playMode,
    currentTime,
  ]);

  useEffect(() => {
    flushPlayerState();
  }, [
    hydrated,
    playingAudio.uri,
    playingAudio.name,
    currentPlaylist,
    currentIndex,
    playMode,
    playing,
    flushPlayerState,
  ]);

  useEffect(() => {
    if (!hydrated || !playing || typeof playingAudio.uri !== "string") {
      return;
    }
    const timer = setInterval(() => {
      flushPlayerState();
    }, 5000);
    return () => clearInterval(timer);
  }, [hydrated, playing, playingAudio.uri, flushPlayerState]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "inactive" || nextAppState === "background") {
        flushPlayerState();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    const blurSubscription =
      Platform.OS === "android"
        ? AppState.addEventListener("blur", flushPlayerState)
        : null;

    return () => {
      appStateSubscription.remove();
      blurSubscription?.remove();
    };
  }, [flushPlayerState]);

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
                  <PreviousIcon size={24} color={onMainColor} />
                </Pressable>
                <Pressable onPress={togglePlayer} style={styles.controlIcon}>
                  <ReAnimated.View
                    key={playing ? "pause" : "play"}
                    entering={FadeIn.duration(140)}
                    exiting={FadeOut.duration(140)}
                    style={styles.iconTransition}
                  >
                    {playing ? (
                      <PauseIcon size={24} color={onMainColor} />
                    ) : (
                      <PlayIcon size={24} color={onMainColor} />
                    )}
                  </ReAnimated.View>
                </Pressable>
                <Pressable onPress={nextAudio} style={styles.controlIcon}>
                  <NextIcon size={24} color={onMainColor} />
                </Pressable>
              </View>
            </View>
          </Pressable>
        </ReAnimated.View>
      </GestureDetector>
    </ReAnimated.View>
  );
}
