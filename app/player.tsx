import PlayerDetailSheet from "@/components/PlayerDetailSheet";
import PageBackground from "@/components/PageBackground";
import { usePlayerContext } from "@/context/PlayerContext";
import { usePlayerRuntimeContext } from "@/context/PlayerRuntimeContext";
import { PlayMode } from "@/context/types";
import { normalizeAudioName } from "@/utils/helper";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PLAY_MODE_ORDER: PlayMode[] = ["shuffle", "loop", "single"];

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

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const {
    playingAudio,
    currentPlaylist,
    currentIndex,
    playFromQueue,
    playMode,
    setPlayMode,
    sleepTimerEndsAt,
    setSleepTimerMinutes,
    clearSleepTimer,
  } = usePlayerContext();
  const { playing, currentTime, duration, runtimeActions } = usePlayerRuntimeContext();

  const [timerPickerVisible, setTimerPickerVisible] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const [draggingTime, setDraggingTime] = useState<number | null>(null);
  const [timerTick, setTimerTick] = useState(() => Date.now());

  const title = useMemo(
    () =>
      normalizeAudioName(
        typeof playingAudio.name === "string" ? playingAudio.name : "",
        typeof playingAudio.uri === "string" ? playingAudio.uri : undefined,
      ),
    [playingAudio.name, playingAudio.uri],
  );
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

  const displayCurrentTime = draggingTime ?? currentTime;
  const progressRatio =
    duration > 0 ? Math.max(0, Math.min(displayCurrentTime / duration, 1)) : 0;

  const remainingSleepMs = sleepTimerEndsAt ? sleepTimerEndsAt - timerTick : null;
  const timerMinutes =
    remainingSleepMs && remainingSleepMs > 0
      ? Math.max(1, Math.round(remainingSleepMs / 60000))
      : null;
  const timerText =
    remainingSleepMs && remainingSleepMs > 0 ? formatCountdown(remainingSleepMs) : "Off";

  const cyclePlayMode = () => {
    const currentIdx = PLAY_MODE_ORDER.findIndex((mode) => mode === playMode);
    const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % PLAY_MODE_ORDER.length;
    setPlayMode(PLAY_MODE_ORDER[nextIdx]);
  };

  const selectQueueItem = (index: number) => {
    if (index < 0 || index >= queue.length) return;
    const isActive = index === activeQueueIndex;
    const trackFinishedWhilePaused =
      !playing && duration > 0 && currentTime >= duration - 0.2;
    if (isActive && !trackFinishedWhilePaused) {
      return;
    }
    playFromQueue(queue, index);
  };

  const applySeekByLocationX = (locationX: number, commit = false) => {
    if (duration <= 0 || trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const nextTime = ratio * duration;
    setDraggingTime(nextTime);
    if (!commit) return;
    runtimeActions.seekTo(nextTime);
  };

  const onProgressRelease = () => {
    if (draggingTime === null) return;
    runtimeActions.seekTo(draggingTime);
    setDraggingTime(null);
  };

  const openTimerPicker = () => {
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

  if (!playingAudio || typeof playingAudio.uri !== "string") {
    return (
      <PageBackground>
        <View style={{ flex: 1 }} />
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <PlayerDetailSheet
        title={title}
        queue={queue}
        activeQueueIndex={activeQueueIndex}
        playing={playing}
        progressRatio={progressRatio}
        currentTimeLabel={formatSeconds(displayCurrentTime)}
        durationLabel={formatSeconds(duration)}
        timerText={timerText}
        playMode={playMode}
        timerPickerVisible={timerPickerVisible}
        timerInitialMinutes={timerMinutes}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        onSelectQueue={selectQueueItem}
        onPrevious={() => runtimeActions.playPreviousTrack()}
        onTogglePlay={() => runtimeActions.togglePlayback()}
        onNext={() => runtimeActions.playNextTrack()}
        onTrackLayout={setTrackWidth}
        onSeekByX={(x) => applySeekByLocationX(x, false)}
        onSeekRelease={onProgressRelease}
        onOpenTimerPicker={openTimerPicker}
        onCloseTimerPicker={closeTimerPicker}
        onApplyTimerMinutes={applyTimerMinutes}
        onCyclePlayMode={cyclePlayMode}
      />
    </PageBackground>
  );
}
