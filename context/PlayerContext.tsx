import { AudioItem, AudioLike, PlayMode } from "@/context/types";
import { normalizeAudioItem, normalizeAudioItems } from "@/utils/helper";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useRef,
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
  const prevPlayModeRef = useRef<PlayMode>("loop");
  const playlistBeforeShuffleRef = useRef<AudioItem[] | null>(null);

  const playFromQueue = useCallback((playlist: AudioItem[], index: number) => {
    if (playlist.length === 0) return;
    const normalizedPlaylist = normalizeAudioItems(playlist);
    const nextIndex = Math.max(0, Math.min(index, normalizedPlaylist.length - 1));
    const nextAudio = normalizedPlaylist[nextIndex];
    setCurrentPlaylist(normalizedPlaylist);
    setCurrentIndex(nextIndex);
    setPlayingAudio({ ...normalizeAudioItem(nextAudio) });
    setPlayRequestId((id) => id + 1);
  }, []);

  const shuffleAudios = (items: AudioItem[]) => {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  };

  const playNext = () => {
    if (currentPlaylist.length === 0) return null;

    let nextIndex = -1;
    if (playMode === "shuffle") {
      if (currentIndex < 0) {
        nextIndex = 0;
      } else if (currentIndex + 1 < currentPlaylist.length) {
        nextIndex = currentIndex + 1;
      }
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
    setPlayingAudio(normalizeAudioItem(nextAudio));
    return nextAudio;
  };

  const playPrevious = () => {
    if (currentPlaylist.length === 0) return null;

    let prevIndex = -1;
    if (playMode === "shuffle") {
      if (currentIndex < 0) {
        prevIndex = 0;
      } else {
        prevIndex =
          (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
      }
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
    setPlayingAudio(normalizeAudioItem(prevAudio));
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

  useEffect(() => {
    const prevMode = prevPlayModeRef.current;
    if (
      playMode === "shuffle" &&
      prevMode !== "shuffle" &&
      currentPlaylist.length > 1
    ) {
      const activeIndexByUri =
        typeof playingAudio.uri === "string"
          ? currentPlaylist.findIndex((audio) => audio.uri === playingAudio.uri)
          : -1;
      const activeIndex =
        currentIndex >= 0 && currentIndex < currentPlaylist.length
          ? currentIndex
          : activeIndexByUri >= 0
            ? activeIndexByUri
            : 0;

      playlistBeforeShuffleRef.current = [...currentPlaylist];

      const activeAudio = currentPlaylist[activeIndex];
      const rest = currentPlaylist.filter((_, index) => index !== activeIndex);
      const shuffledRest = shuffleAudios(rest);
      setCurrentPlaylist([activeAudio, ...shuffledRest]);
      setCurrentIndex(0);
    }

    if (playMode !== "shuffle" && prevMode === "shuffle") {
      const beforeShuffle = playlistBeforeShuffleRef.current;
      if (beforeShuffle && beforeShuffle.length > 0) {
        const currentUri =
          typeof playingAudio.uri === "string"
            ? playingAudio.uri
            : currentPlaylist[currentIndex]?.uri;
        const restoredIndex = currentUri
          ? beforeShuffle.findIndex((audio) => audio.uri === currentUri)
          : -1;
        setCurrentPlaylist(beforeShuffle);
        setCurrentIndex(restoredIndex >= 0 ? restoredIndex : 0);
      }
      playlistBeforeShuffleRef.current = null;
    }

    prevPlayModeRef.current = playMode;
  }, [playMode, currentPlaylist, currentIndex, playingAudio.uri]);

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
