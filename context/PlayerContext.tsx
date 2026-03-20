import { AudioItem, AudioLike, PlayMode } from "@/context/types";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useEffect,
  useContext,
  useState,
} from "react";

type PlayerContextValue = {
  playingAudio: AudioLike;
  setPlayingAudio: Dispatch<SetStateAction<AudioLike>>;
  playRequestId: number;
  currentPlaylist: AudioItem[];
  setCurrentPlaylist: Dispatch<SetStateAction<AudioItem[]>>;
  currentIndex: number;
  playMode: PlayMode;
  setPlayMode: Dispatch<SetStateAction<PlayMode>>;
  sleepTimerEndsAt: number | null;
  setSleepTimerMinutes: (minutes: number | null, fromTs?: number) => void;
  clearSleepTimer: () => void;
  playFromQueue: (playlist: AudioItem[], index: number) => void;
  playNext: () => AudioItem | null;
  playPrevious: () => AudioItem | null;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playingAudio, setPlayingAudio] = useState<AudioLike>({});
  const [playRequestId, setPlayRequestId] = useState(0);
  const [currentPlaylist, setCurrentPlaylist] = useState<AudioItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);

  const playFromQueue = (playlist: AudioItem[], index: number) => {
    if (playlist.length === 0) return;
    const nextIndex = Math.max(0, Math.min(index, playlist.length - 1));
    const nextAudio = playlist[nextIndex];
    setCurrentPlaylist(playlist);
    setCurrentIndex(nextIndex);
    setPlayingAudio({ ...nextAudio });
    setPlayRequestId((id) => id + 1);
  };

  const getRandomIndex = (current: number, total: number) => {
    if (total <= 0) return -1;
    if (total === 1) return 0;
    let next = current;
    while (next === current) {
      next = Math.floor(Math.random() * total);
    }
    return next;
  };

  const playNext = () => {
    if (currentPlaylist.length === 0) return null;

    let nextIndex = -1;
    if (playMode === "shuffle") {
      nextIndex = getRandomIndex(currentIndex, currentPlaylist.length);
    } else if (playMode === "single") {
      nextIndex = currentIndex >= 0 ? currentIndex : 0;
    } else {
      if (currentIndex < 0) {
        nextIndex = 0;
      } else if (currentIndex + 1 < currentPlaylist.length) {
        nextIndex = currentIndex + 1;
      }
    }

    if (nextIndex < 0) return null;
    const nextAudio = currentPlaylist[nextIndex];
    setCurrentIndex(nextIndex);
    setPlayingAudio(nextAudio);
    return nextAudio;
  };

  const playPrevious = () => {
    if (currentPlaylist.length === 0) return null;

    let prevIndex = -1;
    if (playMode === "shuffle") {
      prevIndex = getRandomIndex(currentIndex, currentPlaylist.length);
    } else if (playMode === "single") {
      prevIndex = currentIndex >= 0 ? currentIndex : 0;
    } else {
      if (currentIndex < 0) {
        prevIndex = 0;
      } else {
        prevIndex =
          (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
      }
    }

    if (prevIndex < 0) return null;
    const prevAudio = currentPlaylist[prevIndex];
    setCurrentIndex(prevIndex);
    setPlayingAudio(prevAudio);
    return prevAudio;
  };

  const setSleepTimerMinutes = (minutes: number | null, fromTs?: number) => {
    if (!minutes || minutes <= 0) {
      setSleepTimerEndsAt(null);
      return;
    }
    const baseTs = typeof fromTs === "number" ? fromTs : Date.now();
    setSleepTimerEndsAt(baseTs + minutes * 60 * 1000);
  };

  const clearSleepTimer = () => {
    setSleepTimerEndsAt(null);
  };

  useEffect(() => {
    if (typeof playingAudio.uri !== "string" || currentPlaylist.length === 0) {
      return;
    }
    const nextIndex = currentPlaylist.findIndex(
      (audio) => audio.uri === playingAudio.uri,
    );
    if (nextIndex !== -1 && nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
    }
  }, [playingAudio.uri, currentIndex, currentPlaylist]);

  return (
    <PlayerContext.Provider
      value={{
        playingAudio,
        setPlayingAudio,
        playRequestId,
        currentPlaylist,
        setCurrentPlaylist,
        currentIndex,
        playMode,
        setPlayMode,
        sleepTimerEndsAt,
        setSleepTimerMinutes,
        clearSleepTimer,
        playFromQueue,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within PlayerProvider");
  }
  return context;
}
