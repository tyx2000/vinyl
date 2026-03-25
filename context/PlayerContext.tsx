import { AudioItem, AudioLike, PlayMode } from "@/context/types";
import { normalizeAudioItem, normalizeAudioItems } from "@/utils/helper";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
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
  currentSourcePlaylistId: string | null;
  currentSourcePlaylistName: string | null;
  clearCurrentSourcePlaylist: () => void;
  sleepTimerEndsAt: number | null;
  setSleepTimerMinutes: (minutes: number | null, fromTs?: number) => void;
  clearSleepTimer: () => void;
  playFromQueue: (
    playlist: AudioItem[],
    index: number,
    source?: { playlistId?: string | null; playlistName?: string | null },
  ) => void;
  playNext: (manualSwitch?: boolean) => AudioItem | null;
  playPrevious: (manualSwitch?: boolean) => AudioItem | null;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playingAudio, setPlayingAudio] = useState<AudioLike>({});
  const [playRequestId, setPlayRequestId] = useState(0);
  const [currentPlaylist, setCurrentPlaylist] = useState<AudioItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playMode, setPlayMode] = useState<PlayMode>("loop");
  const [currentSourcePlaylistId, setCurrentSourcePlaylistId] = useState<string | null>(null);
  const [currentSourcePlaylistName, setCurrentSourcePlaylistName] = useState<string | null>(null);
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState<number | null>(null);

  const clearCurrentSourcePlaylist = useCallback(() => {
    setCurrentSourcePlaylistId(null);
    setCurrentSourcePlaylistName(null);
  }, []);

  const playFromQueue = useCallback(
    (
      playlist: AudioItem[],
      index: number,
      source?: { playlistId?: string | null; playlistName?: string | null },
    ) => {
      if (playlist.length === 0) return;
      const normalizedPlaylist = normalizeAudioItems(playlist);
      const nextIndex = Math.max(0, Math.min(index, normalizedPlaylist.length - 1));
      const nextAudio = normalizedPlaylist[nextIndex];
      setCurrentPlaylist(normalizedPlaylist);
      setCurrentIndex(nextIndex);
      setPlayingAudio({ ...normalizeAudioItem(nextAudio) });
      if (typeof source?.playlistId === "string" && source.playlistId) {
        setCurrentSourcePlaylistId(source.playlistId);
        setCurrentSourcePlaylistName(
          typeof source.playlistName === "string" ? source.playlistName : null,
        );
      } else {
        clearCurrentSourcePlaylist();
      }
      setPlayRequestId((id) => id + 1);
    },
    [clearCurrentSourcePlaylist],
  );

  const playNext = (manualSwitch = false) => {
    if (currentPlaylist.length === 0) return null;
    const activeIndexByUri =
      typeof playingAudio.uri === "string"
        ? currentPlaylist.findIndex((audio) => audio.uri === playingAudio.uri)
        : -1;
    const activeIndex =
      activeIndexByUri >= 0
        ? activeIndexByUri
        : currentIndex >= 0 && currentIndex < currentPlaylist.length
          ? currentIndex
          : 0;

    let nextIndex = -1;
    if (playMode === "single" && !manualSwitch) {
      nextIndex = activeIndex;
    } else {
      if (activeIndex + 1 < currentPlaylist.length) {
        nextIndex = activeIndex + 1;
      }
    }

    if (nextIndex < 0) return null;
    const nextAudio = currentPlaylist[nextIndex];
    setCurrentIndex(nextIndex);
    setPlayingAudio(normalizeAudioItem(nextAudio));
    return nextAudio;
  };

  const playPrevious = (manualSwitch = false) => {
    if (currentPlaylist.length === 0) return null;
    const activeIndexByUri =
      typeof playingAudio.uri === "string"
        ? currentPlaylist.findIndex((audio) => audio.uri === playingAudio.uri)
        : -1;
    const activeIndex =
      activeIndexByUri >= 0
        ? activeIndexByUri
        : currentIndex >= 0 && currentIndex < currentPlaylist.length
          ? currentIndex
          : 0;

    let prevIndex = -1;
    if (playMode === "single" && !manualSwitch) {
      prevIndex = activeIndex;
    } else {
      prevIndex =
        (activeIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
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
        currentSourcePlaylistId,
        currentSourcePlaylistName,
        clearCurrentSourcePlaylist,
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
