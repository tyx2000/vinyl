import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";

type PlayerRuntimeActions = {
  togglePlayback: () => void;
  playPreviousTrack: () => void;
  playNextTrack: () => void;
  seekTo: (seconds: number) => void;
};

type PlayerRuntimeStatus = {
  playing: boolean;
  currentTime: number;
  duration: number;
};

type PlayerRuntimeContextValue = PlayerRuntimeStatus & {
  setRuntimeStatus: (status: Partial<PlayerRuntimeStatus>) => void;
  runtimeActions: PlayerRuntimeActions;
  setRuntimeActions: (actions: Partial<PlayerRuntimeActions>) => void;
};

const noop = () => {};

const defaultActions: PlayerRuntimeActions = {
  togglePlayback: noop,
  playPreviousTrack: noop,
  playNextTrack: noop,
  seekTo: noop,
};

const PlayerRuntimeContext = createContext<PlayerRuntimeContextValue | null>(null);

export function PlayerRuntimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PlayerRuntimeStatus>({
    playing: false,
    currentTime: 0,
    duration: 0,
  });
  const [runtimeActions, setActions] =
    useState<PlayerRuntimeActions>(defaultActions);

  const setRuntimeStatus = useCallback((next: Partial<PlayerRuntimeStatus>) => {
    setStatus((current) => {
      const nextPlaying = next.playing ?? current.playing;
      const nextCurrentTime = next.currentTime ?? current.currentTime;
      const nextDuration = next.duration ?? current.duration;
      if (
        nextPlaying === current.playing &&
        nextCurrentTime === current.currentTime &&
        nextDuration === current.duration
      ) {
        return current;
      }
      return {
        playing: nextPlaying,
        currentTime: nextCurrentTime,
        duration: nextDuration,
      };
    });
  }, []);

  const setRuntimeActions = useCallback((next: Partial<PlayerRuntimeActions>) => {
    setActions((current) => {
      const nextToggle = next.togglePlayback ?? current.togglePlayback;
      const nextPrev = next.playPreviousTrack ?? current.playPreviousTrack;
      const nextNext = next.playNextTrack ?? current.playNextTrack;
      const nextSeekTo = next.seekTo ?? current.seekTo;
      if (
        nextToggle === current.togglePlayback &&
        nextPrev === current.playPreviousTrack &&
        nextNext === current.playNextTrack &&
        nextSeekTo === current.seekTo
      ) {
        return current;
      }
      return {
        togglePlayback: nextToggle,
        playPreviousTrack: nextPrev,
        playNextTrack: nextNext,
        seekTo: nextSeekTo,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      playing: status.playing,
      currentTime: status.currentTime,
      duration: status.duration,
      setRuntimeStatus,
      runtimeActions,
      setRuntimeActions,
    }),
    [
      status.playing,
      status.currentTime,
      status.duration,
      runtimeActions,
      setRuntimeStatus,
      setRuntimeActions,
    ],
  );

  return (
    <PlayerRuntimeContext.Provider value={value}>
      {children}
    </PlayerRuntimeContext.Provider>
  );
}

export function usePlayerRuntimeContext() {
  const context = useContext(PlayerRuntimeContext);
  if (!context) {
    throw new Error("usePlayerRuntimeContext must be used within PlayerRuntimeProvider");
  }
  return context;
}
