import {
  getLocalValue,
  minResolve,
  normalizeAudioItem,
  normalizeAudioItems,
  setLocalValue,
} from "@/utils/helper";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { AudioItem, PlaylistItem } from "./types";

type AddToPlaylistResult = {
  audios: AudioItem[];
  addedCount: number;
  skippedCount: number;
};

type PlaylistContextValue = {
  playlist: PlaylistItem[];
  playlistLoading: boolean;
  playlistVersion: number;
  setPlaylist: Dispatch<SetStateAction<PlaylistItem[]>>;
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  removePlaylist: (playlistId: string) => Promise<void>;
  loadPlaylistAudios: (playlistId: string) => Promise<AudioItem[]>;
  addAudiosToPlaylist: (
    playlistId: string,
    audios: AudioItem[],
  ) => Promise<AddToPlaylistResult>;
  removeAudioFromPlaylist: (playlistId: string, uri: string) => Promise<void>;
  removeAudioFromAllPlaylists: (uri: string) => Promise<void>;
  checkAudioInPlaylists: (uri: string) => Promise<string[]>;
};

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistVersion, setPlaylistVersion] = useState(0);

  const readPlaylists = async () => {
    const result = await getLocalValue("vinyl-playlist");
    if (!result) return [];
    try {
      return JSON.parse(result) as PlaylistItem[];
    } catch {
      return [];
    }
  };

  const loadPlaylistAudios = async (playlistId: string) => {
    const result = await getLocalValue(playlistId);
    if (!result) return [];
    try {
      const parsed = JSON.parse(result) as AudioItem[];
      const normalized = normalizeAudioItems(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        await setLocalValue(playlistId, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  };

  const savePlaylistAudios = async (playlistId: string, audios: AudioItem[]) => {
    await setLocalValue(playlistId, JSON.stringify(audios));
  };

  const loadPlaylists = async () => {
    setPlaylistLoading(true);
    try {
      const result = await minResolve(readPlaylists());
      setPlaylist(result);
    } catch (error) {
      console.log("init playlist error", error);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const createPlaylist = async (name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    const nextPlaylists = [...playlist, { id: `p${Date.now()}`, name: nextName }];
    await setLocalValue("vinyl-playlist", JSON.stringify(nextPlaylists));
    setPlaylist(nextPlaylists);
    setPlaylistVersion((current) => current + 1);
  };

  const removePlaylist = async (playlistId: string) => {
    const nextPlaylists = playlist.filter((item) => item.id !== playlistId);
    if (nextPlaylists.length === playlist.length) return;
    await setLocalValue("vinyl-playlist", JSON.stringify(nextPlaylists));
    await setLocalValue(playlistId, JSON.stringify([]));
    setPlaylist(nextPlaylists);
    setPlaylistVersion((current) => current + 1);
  };

  const addAudiosToPlaylist = async (playlistId: string, audios: AudioItem[]) => {
    const exists = new Set<string>();
    const currentAudios = await loadPlaylistAudios(playlistId);
    const mergedAudios: AudioItem[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    currentAudios.forEach((audio) => {
      if (!audio.uri || exists.has(audio.uri)) return;
      exists.add(audio.uri);
      mergedAudios.push(normalizeAudioItem(audio));
    });

    audios.forEach((audio) => {
      if (!audio.uri || exists.has(audio.uri)) {
        skippedCount += 1;
        return;
      }
      exists.add(audio.uri);
      mergedAudios.push(normalizeAudioItem(audio));
      addedCount += 1;
    });

    await savePlaylistAudios(playlistId, mergedAudios);
    if (addedCount > 0) {
      setPlaylistVersion((current) => current + 1);
    }
    return { audios: mergedAudios, addedCount, skippedCount };
  };

  const removeAudioFromPlaylist = async (playlistId: string, uri: string) => {
    const currentAudios = await loadPlaylistAudios(playlistId);
    const nextAudios = currentAudios.filter((audio) => audio.uri !== uri);
    if (nextAudios.length === currentAudios.length) return;
    await savePlaylistAudios(playlistId, nextAudios);
    setPlaylistVersion((current) => current + 1);
  };

  const removeAudioFromAllPlaylists = async (uri: string) => {
    const targetPlaylists =
      playlist.length > 0 ? playlist : ((await readPlaylists()) as PlaylistItem[]);

    await Promise.all(
      targetPlaylists.map(async (item) => {
        const playlistAudios = await loadPlaylistAudios(item.id);
        const nextAudios = playlistAudios.filter((audio) => audio.uri !== uri);
        if (nextAudios.length !== playlistAudios.length) {
          await savePlaylistAudios(item.id, nextAudios);
        }
      }),
    );
    setPlaylistVersion((current) => current + 1);
  };

  const checkAudioInPlaylists = async (uri: string) => {
    const targetPlaylists =
      playlist.length > 0 ? playlist : ((await readPlaylists()) as PlaylistItem[]);
    const includedIds: string[] = [];

    await Promise.all(
      targetPlaylists.map(async (item) => {
        const playlistAudios = await loadPlaylistAudios(item.id);
        if (playlistAudios.some((audio) => audio.uri === uri)) {
          includedIds.push(item.id);
        }
      }),
    );

    return includedIds;
  };

  return (
    <PlaylistContext.Provider
      value={{
        playlist,
        playlistLoading,
        playlistVersion,
        setPlaylist,
        loadPlaylists,
        createPlaylist,
        removePlaylist,
        loadPlaylistAudios,
        addAudiosToPlaylist,
        removeAudioFromPlaylist,
        removeAudioFromAllPlaylists,
        checkAudioInPlaylists,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylistContext() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error("usePlaylistContext must be used within PlaylistProvider");
  }
  return context;
}
