import { divider, mainColor, textPrimary, textSecondary } from "@/constants/Colors";
import { AudioItem, AudioLike, PlayMode } from "@/context/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import { useSegments } from "expo-router";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReAnimated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLAY_MODE_ORDER: PlayMode[] = ["shuffle", "loop", "single"];
const SLEEP_TIMER_ORDER: Array<number | null> = [null, 15, 30, 60];

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
  modalRoot: {
    flex: 1,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 18
  },
  bottomHeader: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bottomTitleWrap: {
    flex: 1,
    gap: 4,
  },
  bottomTitle: {
    color: textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  bottomSubTitle: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bottomActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionBtn: {
    backgroundColor: mainColor,
  },
  queuePanel: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  queueHeader: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queueHeaderTitle: {
    color: textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  queueHeaderCount: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  queueList: {
    flex: 1,
  },
  queueListContent: {
    paddingVertical: 6,
  },
  queueItem: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  queueItemActive: {
    backgroundColor: "rgba(250, 45, 85, 0.08)",
  },
  queueItemText: {
    flex: 1,
    color: textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  queueItemTextActive: {
    color: mainColor,
    fontWeight: "700",
  },
  bottomPanel: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  progressTouchArea: {
    width: "100%",
    height: 32,
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E1E5EE",
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
    gap: 10,
  },
  infoButton: {
    minWidth: 96,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  infoButtonText: {
    color: textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  durationText: {
    color: textSecondary,
    fontSize: 13,
    fontWeight: "700",
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
  currentPlaylist,
  currentIndex,
  playFromQueue,
  playMode,
  setPlayMode,
  playNext,
  playPrevious,
  sleepTimerEndsAt,
  setSleepTimerMinutes,
  clearSleepTimer,
}: {
  playingAudio: AudioLike;
  currentPlaylist: AudioItem[];
  currentIndex: number;
  playFromQueue: (playlist: AudioItem[], index: number) => void;
  playMode: PlayMode;
  setPlayMode: Dispatch<SetStateAction<PlayMode>>;
  playNext: () => AudioItem | null;
  playPrevious: () => AudioItem | null;
  sleepTimerEndsAt: number | null;
  setSleepTimerMinutes: (minutes: number | null) => void;
  clearSleepTimer: () => void;
}) {
  const playerRef = useRef<AudioPlayer>(null);
  const statusListenerRef = useRef<{ remove: () => void } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [draggingTime, setDraggingTime] = useState<number | null>(null);

  const title = useMemo(() => String(playingAudio.name ?? "Unknown"), [
    playingAudio.name,
  ]);
  const displayCurrentTime = draggingTime ?? currentTime;
  const progressRatio =
    duration > 0 ? Math.max(0, Math.min(displayCurrentTime / duration, 1)) : 0;
  const queue = useMemo(() => {
    if (currentPlaylist.length > 0) return currentPlaylist;
    if (typeof playingAudio.uri === "string") {
      return [{ uri: String(playingAudio.uri), name: title }];
    }
    return [];
  }, [currentPlaylist, playingAudio.uri, title]);
  const queueLength = queue.length;
  const activeQueueIndex = useMemo(() => {
    if (queueLength <= 0) return -1;
    if (currentIndex >= 0 && currentIndex < queueLength) return currentIndex;
    const uri = typeof playingAudio.uri === "string" ? playingAudio.uri : "";
    return queue.findIndex((item) => item.uri === uri);
  }, [queue, queueLength, currentIndex, playingAudio.uri]);
  const hasBottomTabBar = segments[0] === "(tabs)";
  const miniPlayerBottom = insets.bottom + (hasBottomTabBar ? 86 : 12);

  const wrapperBottom = useSharedValue(miniPlayerBottom);
  const panelOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const wrapperStyle = useAnimatedStyle(() => ({
    bottom: wrapperBottom.value,
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    backgroundColor: "rgba(10, 12, 20, 0.22)",
  }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
  }));

  const resolveCurrentTimerBucket = () => {
    if (!sleepTimerEndsAt) return null;
    const diffMinutes = Math.max(0, Math.round((sleepTimerEndsAt - Date.now()) / 60000));
    if (diffMinutes <= 0) return null;
    if (diffMinutes <= 22) return 15;
    if (diffMinutes <= 45) return 30;
    return 60;
  };

  const timerBucket = resolveCurrentTimerBucket();
  const timerText = timerBucket ? `${timerBucket}m` : "Off";
  const modeLabel =
    playMode === "shuffle" ? "随机" : playMode === "loop" ? "顺序" : "单曲";
  const modeIcon =
    playMode === "shuffle" ? "random" : playMode === "loop" ? "list-ol" : "dot-circle-o";

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

  const selectQueueItem = (index: number) => {
    if (index < 0 || index >= queue.length) return;
    playFromQueue(queue, index);
  };

  const cyclePlayMode = () => {
    const currentIdx = PLAY_MODE_ORDER.findIndex((mode) => mode === playMode);
    const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % PLAY_MODE_ORDER.length;
    setPlayMode(PLAY_MODE_ORDER[nextIdx]);
  };

  const cycleSleepTimer = () => {
    const currentIdx = SLEEP_TIMER_ORDER.findIndex((item) => item === timerBucket);
    const nextIdx = currentIdx < 0 ? 1 : (currentIdx + 1) % SLEEP_TIMER_ORDER.length;
    const nextValue = SLEEP_TIMER_ORDER[nextIdx];
    if (nextValue === null) {
      clearSleepTimer();
      return;
    }
    setSleepTimerMinutes(nextValue);
  };

  const applySeekByLocationX = (locationX: number, commit = false) => {
    if (duration <= 0 || trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const nextTime = ratio * duration;
    setDraggingTime(nextTime);
    if (!commit || !playerRef.current) return;
    playerRef.current
      .seekTo(nextTime)
      .then(() => {
        setCurrentTime(nextTime);
      })
      .catch((error) => {
        console.log("seek error", error);
      });
  };

  const onProgressRelease = () => {
    if (draggingTime === null || !playerRef.current) return;
    playerRef.current
      .seekTo(draggingTime)
      .then(() => {
        setCurrentTime(draggingTime);
      })
      .catch((error) => {
        console.log("seek error", error);
      })
      .finally(() => {
        setDraggingTime(null);
      });
  };

  const playerStatusUpdate = async (status: AudioStatus) => {
    setPlaying(status.playing);
    if (draggingTime === null) {
      setCurrentTime(status.currentTime);
    }
    setDuration(status.duration);
    if (status.didJustFinish) {
      const nextTrack = playNext();
      if (!nextTrack) {
        setPlaying(false);
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
      });
      const player = createAudioPlayer(playingAudio.uri, { updateInterval: 250 });
      playerRef.current = player;
      statusListenerRef.current = player.addListener(
        "playbackStatusUpdate",
        playerStatusUpdate,
      );
      player.play();
      setPlaying(true);
      try {
        player.setActiveForLockScreen(
          true,
          { title },
          { showSeekBackward: true, showSeekForward: true },
        );
      } catch (error) {
        console.log("lock screen controls unavailable", error);
      }
    } catch (error) {
      console.log("init player error", error);
    }
  };

  const clearPlayer = () => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setDraggingTime(null);
    if (!playerRef.current) return;
    statusListenerRef.current?.remove();
    statusListenerRef.current = null;
    playerRef.current.pause();
    try {
      const lockScreenControlCapable = playerRef.current as AudioPlayer & {
        clearLockScreenControls?: () => void;
      };
      if (typeof lockScreenControlCapable.clearLockScreenControls === "function") {
        lockScreenControlCapable.clearLockScreenControls();
      }
    } catch (error) {
      console.log("clear lock screen controls error", error);
    }
    playerRef.current.remove();
    playerRef.current = null;
  };

  useEffect(() => {
    initPlayer();
    return () => {
      clearPlayer();
    };
  }, [playingAudio.uri, title]);

  useEffect(() => {
    wrapperBottom.value = withTiming(miniPlayerBottom, {
      duration: 320,
      easing: Easing.inOut(Easing.quad),
    });
  }, [miniPlayerBottom]);

  useEffect(() => {
    if (expanded) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setSheetVisible(true);
      panelOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      return;
    }

    panelOpacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
    backdropOpacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) });
    closeTimerRef.current = setTimeout(() => {
      setSheetVisible(false);
      closeTimerRef.current = null;
    }, 190);
  }, [expanded]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!playingAudio || typeof playingAudio.uri !== "string") {
    return null;
  }

  return (
    <ReAnimated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(150)}
      style={[styles.wrapper, wrapperStyle]}
    >
      <TouchableOpacity
        style={styles.miniButton}
        onPress={() => setExpanded(true)}
        activeOpacity={0.85}
      >
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
      </TouchableOpacity>

      <Modal
        animationType="none"
        visible={sheetVisible}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.modalRoot}>
          <ReAnimated.View style={[styles.backdropTouch, backdropStyle]} />
          <Pressable style={styles.backdropTouch} onPress={() => setExpanded(false)} />
          <ReAnimated.View
            style={[
              styles.sheetContainer,
              panelStyle,
              { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 14 },
            ]}
          >
            <View style={styles.queuePanel}>
              <View style={styles.queueHeader}>
                <Text style={styles.queueHeaderTitle}>当前播放列表</Text>
                <Text style={styles.queueHeaderCount}>{queueLength} 首</Text>
              </View>
              <ScrollView
                style={styles.queueList}
                contentContainerStyle={styles.queueListContent}
                showsVerticalScrollIndicator={false}
              >
                {queue.map((item, index) => {
                  const active = index === activeQueueIndex;
                  return (
                    <TouchableOpacity
                      key={`${item.uri}-${index}`}
                      style={[styles.queueItem, active && styles.queueItemActive]}
                      onPress={() => selectQueueItem(index)}
                    >
                      <Text
                        style={[styles.queueItemText, active && styles.queueItemTextActive]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {item.name}
                      </Text>
                      {active && <FontAwesome name="volume-up" size={14} color={mainColor} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.bottomPanel}>
              <View style={styles.bottomHeader}>
                <View style={styles.bottomTitleWrap}>
                  <Text style={styles.bottomTitle} numberOfLines={1} ellipsizeMode="middle">
                    {title}
                  </Text>
                  <Text style={styles.bottomSubTitle}>
                    {queueLength > 0 && currentIndex >= 0
                      ? `${currentIndex + 1} / ${queueLength}`
                      : "Now Playing"}
                  </Text>
                </View>
                <View style={styles.bottomActions}>
                  <TouchableOpacity style={styles.bottomActionBtn} onPress={previousAudio}>
                    <FontAwesome size={20} color={textPrimary} name="backward" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.bottomActionBtn, styles.mainActionBtn]}
                    onPress={togglePlayer}
                  >
                    <FontAwesome size={18} color="#fff" name={playing ? "pause" : "play"} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bottomActionBtn} onPress={nextAudio}>
                    <FontAwesome size={20} color={textPrimary} name="forward" />
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={styles.progressTouchArea}
                onLayout={(e) => {
                  setTrackWidth(e.nativeEvent.layout.width);
                }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => {
                  applySeekByLocationX(e.nativeEvent.locationX, false);
                }}
                onResponderMove={(e) => {
                  applySeekByLocationX(e.nativeEvent.locationX, false);
                }}
                onResponderRelease={onProgressRelease}
                onResponderTerminate={onProgressRelease}
              >
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressCurrent, { width: `${progressRatio * 100}%` }]}
                  />
                </View>
              </View>

              <View style={styles.infoRow}>
                <TouchableOpacity style={styles.infoButton} onPress={cycleSleepTimer}>
                  <FontAwesome name="clock-o" size={14} color={textPrimary} />
                  <Text style={styles.infoButtonText}>{timerText}</Text>
                </TouchableOpacity>

                <Text style={styles.durationText}>
                  {formatSeconds(displayCurrentTime)} / {formatSeconds(duration)}
                </Text>

                <TouchableOpacity style={styles.infoButton} onPress={cyclePlayMode}>
                  <FontAwesome name={modeIcon} size={14} color={textPrimary} />
                  <Text style={styles.infoButtonText}>{modeLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ReAnimated.View>
        </View>
      </Modal>
    </ReAnimated.View>
  );
}
