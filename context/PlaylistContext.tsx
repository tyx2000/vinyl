import { getLocalValue, minResolve, setLocalValue } from "@/utils/helper";
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
  setPlaylist: Dispatch<SetStateAction<PlaylistItem[]>>;
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  loadPlaylistAudios: (playlistId: string) => Promise<AudioItem[]>;
  addAudiosToPlaylist: (
    playlistId: string,
    audios: AudioItem[],
  ) => Promise<AddToPlaylistResult>;
  removeAudioFromAllPlaylists: (uri: string) => Promise<void>;
  checkAudioInPlaylists: (uri: string) => Promise<string[]>;
};

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);

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
      return JSON.parse(result) as AudioItem[];
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
      mergedAudios.push(audio);
    });

    audios.forEach((audio) => {
      if (!audio.uri || exists.has(audio.uri)) {
        skippedCount += 1;
        return;
      }
      exists.add(audio.uri);
      mergedAudios.push(audio);
      addedCount += 1;
    });

    await savePlaylistAudios(playlistId, mergedAudios);
    return { audios: mergedAudios, addedCount, skippedCount };
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
        setPlaylist,
        loadPlaylists,
        createPlaylist,
        loadPlaylistAudios,
        addAudiosToPlaylist,
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
