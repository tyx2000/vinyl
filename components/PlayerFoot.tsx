import {
  divider,
  mainColor,
  onMainColor,
  surfaceSecondary,
  textPrimary,
  textSecondary,
} from "@/constants/Colors";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PlayModeIcon,
  PreviousIcon,
  TimerIcon,
} from "@/components/icons/PlaybackIcons";
import SleepTimerPicker from "@/components/SleepTimerPicker";
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
import {
  addRemoteActionListener,
  clearLockScreenControls,
  syncLockScreenControls,
} from "vinyl-lockscreen-controls";
import { usePathname, useRouter } from "expo-router";
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
  useWindowDimensions,
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
    minHeight: 124,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: surfaceSecondary,
    shadowColor: "#0A0E1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  miniHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleWrapper: {
    flex: 1,
  },
  audioName: {
    flexShrink: 1,
    fontWeight: "800",
    fontSize: 15,
    color: textPrimary,
  },
  miniControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bottomActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionBtn: {
    backgroundColor: mainColor,
  },
  iconTransition: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTouchArea: {
    width: "100%",
    height: 28,
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressCurrent: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: mainColor,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  infoButton: {
    minWidth: 40,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  infoButtonText: {
    color: textPrimary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 52,
    textAlign: "center",
  },
  durationText: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 106,
    textAlign: "center",
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

const formatCountdown = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) return "00:00";
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${
      seconds < 10 ? "0" : ""
    }${seconds}`;
  }
  return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

const PLAYER_STATE_KEY = "vinyl-player-state";
const PLAY_MODE_ORDER: PlayMode[] = ["loop", "single"];

type PersistedPlayerState = {
  playingAudio?: AudioItem;
  currentPlaylist: AudioItem[];
  currentIndex: number;
  playMode: PlayMode;
  currentTime: number;
  sourcePlaylistId?: string | null;
  sourcePlaylistName?: string | null;
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
  playNext: (manualSwitch?: boolean) => AudioItem | null;
  playPrevious: (manualSwitch?: boolean) => AudioItem | null;
  sleepTimerEndsAt: number | null;
  clearSleepTimer: () => void;
}) {
  const {
    setPlayingAudio,
    currentPlaylist,
    setCurrentPlaylist,
    currentIndex,
    playMode,
    setPlayMode,
    currentSourcePlaylistId,
    currentSourcePlaylistName,
    clearCurrentSourcePlaylist,
    setSleepTimerMinutes,
    playFromQueue,
  } = usePlayerContext();
  const { setRuntimeStatus, setRuntimeActions } = usePlayerRuntimeContext();

  const playerRef = useRef<AudioPlayer>(null);
  const statusListenerRef = useRef<{ remove: () => void } | null>(null);
  const sleepTimerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const playingRef = useRef(false);
  const pendingManualPauseRef = useRef(false);
  const interruptedPauseRef = useRef(false);
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
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [hydrated, setHydrated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [draggingTime, setDraggingTime] = useState<number | null>(null);
  const [timerTick, setTimerTick] = useState(() => Date.now());
  const [timerPickerVisible, setTimerPickerVisible] = useState(false);

  const title = useMemo(
    () =>
      normalizeAudioName(
        typeof playingAudio.name === "string" ? playingAudio.name : "",
        typeof playingAudio.uri === "string" ? playingAudio.uri : undefined,
      ),
    [playingAudio.name, playingAudio.uri],
  );
  const miniPlayerBottom = insets.bottom + 12;
  const displayCurrentTime = draggingTime ?? currentTime;
  const progressRatio =
    duration > 0 ? Math.max(0, Math.min(displayCurrentTime / duration, 1)) : 0;
  const remainingSleepMs = sleepTimerEndsAt ? sleepTimerEndsAt - timerTick : null;
  const timerText =
    remainingSleepMs && remainingSleepMs > 0 ? formatCountdown(remainingSleepMs) : "Off";

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
      pendingManualPauseRef.current = false;
      interruptedPauseRef.current = false;
      await playerRef.current.seekTo(0);
      playerRef.current.play();
      playingRef.current = true;
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
      sourcePlaylistId: currentSourcePlaylistId,
      sourcePlaylistName: currentSourcePlaylistName,
    };
  };

  const flushPlayerState = useCallback(() => {
    if (!hydrated || !persistStateRef.current) return;
    void savePlayerState(persistStateRef.current);
  }, [hydrated, savePlayerState]);

  const stopPlayback = (clearTimer = false) => {
    if (playerRef.current) {
      pendingManualPauseRef.current = true;
      playerRef.current.pause();
    }
    interruptedPauseRef.current = false;
    playingRef.current = false;
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
      pendingManualPauseRef.current = true;
      playerRef.current.pause();
    } else {
      pendingManualPauseRef.current = false;
      interruptedPauseRef.current = false;
      const isTrackFinished = duration > 0 && currentTime >= duration - 0.2;
      if (isTrackFinished) {
        void restartCurrentTrack();
        return;
      }
      playerRef.current.play();
    }
  };

  const pausePlayer = () => {
    if (!playerRef.current || !playerRef.current.playing) return;
    pendingManualPauseRef.current = true;
    playerRef.current.pause();
  };

  const playPlayer = () => {
    if (!playerRef.current || playerRef.current.playing) return;
    pendingManualPauseRef.current = false;
    interruptedPauseRef.current = false;
    const isTrackFinished = duration > 0 && currentTime >= duration - 0.2;
    if (isTrackFinished) {
      void restartCurrentTrack();
      return;
    }
    playerRef.current.play();
  };

  const previousAudio = async (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    const prevTrack = playPrevious(true);
    if (prevTrack && prevTrack.uri === playingAudio.uri) {
      await restartCurrentTrack();
    }
  };

  const nextAudio = async (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    const nextTrack = playNext(true);
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

  const goToSourcePlaylist = (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    if (!currentSourcePlaylistId) return;
    if (pathname === `/${currentSourcePlaylistId}`) return;
    router.push({
      pathname: "/[playlistId]",
      params: {
        playlistId: currentSourcePlaylistId,
        name: currentSourcePlaylistName ?? "",
      },
    });
  };

  const openTimerPicker = (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    setTimerTick(Date.now());
    setTimerPickerVisible(true);
  };

  const closeTimerPicker = () => {
    setTimerPickerVisible(false);
  };

  const applyTimerMinutes = (minutes: number | null) => {
    const now = Date.now();
    setTimerTick(now);
    if (!minutes || minutes <= 0) {
      clearSleepTimer();
      setTimerPickerVisible(false);
      return;
    }
    setSleepTimerMinutes(minutes, now);
    setTimerPickerVisible(false);
  };

  const cyclePlayMode = (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    const currentIdx = PLAY_MODE_ORDER.findIndex((mode) => mode === playMode);
    const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % PLAY_MODE_ORDER.length;
    setPlayMode(PLAY_MODE_ORDER[nextIdx]);
  };

  const applySeekByLocationX = (locationX: number, commit = false) => {
    if (duration <= 0 || trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const nextTime = ratio * duration;
    setDraggingTime(nextTime);
    if (commit) {
      seekToSeconds(nextTime);
    }
  };

  const onProgressRelease = () => {
    if (draggingTime === null) return;
    seekToSeconds(draggingTime);
    setDraggingTime(null);
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
    const wasPlaying = playingRef.current;
    const trackFinished =
      status.duration > 0 && status.currentTime >= status.duration - 0.25;
    const isManualPause = pendingManualPauseRef.current;
    const isLikelySystemInterruption =
      wasPlaying &&
      !status.playing &&
      !status.didJustFinish &&
      !trackFinished &&
      !isManualPause &&
      appStateRef.current !== "active";

    if (!status.playing && isManualPause) {
      pendingManualPauseRef.current = false;
    }

    if (isLikelySystemInterruption) {
      interruptedPauseRef.current = true;
    }

    // Android audio focus may auto-resume after transient interruptions.
    // Keep it paused and require explicit user action to resume.
    if (status.playing && interruptedPauseRef.current) {
      playerRef.current?.pause();
      playingRef.current = false;
      setPlaying(false);
      return;
    }

    playingRef.current = status.playing;
    setPlaying(status.playing);
    setCurrentTime(status.currentTime);
    setDuration(status.duration);
    if (status.didJustFinish) {
      interruptedPauseRef.current = false;
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
    playingRef.current = false;
    pendingManualPauseRef.current = false;
    interruptedPauseRef.current = false;
    setCurrentTime(0);
    setDuration(0);
    void clearLockScreenControls();
    if (!playerRef.current) return;
    statusListenerRef.current?.remove();
    statusListenerRef.current = null;
    playerRef.current.pause();
    playerRef.current.remove();
    playerRef.current = null;
  };

  const dismissPlaybackBySwipe = () => {
    clearSleepTimer();
    clearCurrentSourcePlaylist();
    setCurrentPlaylist([]);
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
    if (typeof playingAudio.uri !== "string") {
      void clearLockScreenControls();
      return;
    }
    void syncLockScreenControls({
      title,
      artist: "Vinyl",
      albumTitle: "Local Music",
      playing,
    });
  }, [playingAudio.uri, title, playing]);

  useEffect(() => {
    const subscription = addRemoteActionListener((event) => {
      const action = event?.action;
      if (action === "toggle") {
        runtimeActionRef.current.togglePlayback();
        return;
      }
      if (action === "play") {
        playPlayer();
        return;
      }
      if (action === "pause") {
        pausePlayer();
        return;
      }
      if (action === "next") {
        runtimeActionRef.current.playNextTrack();
        return;
      }
      if (action === "previous") {
        runtimeActionRef.current.playPreviousTrack();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [currentTime, duration]);

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

        setPlayMode(parsed.playMode === "single" ? "single" : "loop");

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

          playFromQueue(queue, index, {
            playlistId: parsed.sourcePlaylistId ?? null,
            playlistName: parsed.sourcePlaylistName ?? null,
          });
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
    if (!sleepTimerEndsAt) {
      setTimerTick(Date.now());
      return;
    }
    const timer = setInterval(() => {
      setTimerTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
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
    currentSourcePlaylistId,
    currentSourcePlaylistName,
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
    currentSourcePlaylistId,
    currentSourcePlaylistName,
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
      appStateRef.current = nextAppState;
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

  return (
    <>
      <ReAnimated.View style={[styles.wrapper, wrapperStyle]}>
        <GestureDetector gesture={swipeDismissGesture}>
          <ReAnimated.View style={[styles.miniButton, miniSwipeStyle]}>
            <Pressable onPress={goToSourcePlaylist}>
              <View style={styles.miniContent}>
                <View style={styles.miniHeader}>
                  <View style={styles.titleWrapper}>
                    <Text style={styles.audioName} numberOfLines={1} ellipsizeMode="middle">
                      {title}
                    </Text>
                  </View>
                  <View style={styles.miniControls}>
                    <Pressable onPress={previousAudio} style={styles.bottomActionBtn}>
                      <PreviousIcon size={24} color={textPrimary} />
                    </Pressable>
                    <Pressable
                      onPress={togglePlayer}
                      style={[styles.bottomActionBtn, styles.mainActionBtn]}
                    >
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
                    <Pressable onPress={nextAudio} style={styles.bottomActionBtn}>
                      <NextIcon size={24} color={textPrimary} />
                    </Pressable>
                  </View>
                </View>

                <View
                  style={styles.progressTouchArea}
                  onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={(e) => applySeekByLocationX(e.nativeEvent.locationX)}
                  onResponderMove={(e) => applySeekByLocationX(e.nativeEvent.locationX)}
                  onResponderRelease={onProgressRelease}
                  onResponderTerminate={onProgressRelease}
                >
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressCurrent, { width: `${progressRatio * 100}%` }]} />
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Pressable style={styles.infoButton} onPress={openTimerPicker}>
                    {timerText === "Off" ? (
                      <TimerIcon size={24} color={textPrimary} />
                    ) : (
                      <Text style={styles.infoButtonText}>{timerText}</Text>
                    )}
                  </Pressable>
                  <Text style={styles.durationText}>
                    {formatSeconds(displayCurrentTime)} / {formatSeconds(duration)}
                  </Text>
                  <Pressable style={styles.infoButton} onPress={cyclePlayMode}>
                    <PlayModeIcon mode={playMode} size={24} color={textPrimary} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </ReAnimated.View>
        </GestureDetector>
      </ReAnimated.View>
      <SleepTimerPicker
        visible={timerPickerVisible}
        onClose={closeTimerPicker}
        onApply={applyTimerMinutes}
      />
    </>
  );
}
