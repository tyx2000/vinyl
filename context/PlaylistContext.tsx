import {
  cleanupLegacyAudioLibrary,
  cleanupOrphanImportedAudios,
  deleteImportedAudioFileIfManaged,
  getLocalValue,
  minResolve,
  normalizeAudioItem,
  normalizeAudioItems,
  removeLocalValue,
  setLocalValue,
} from "@/utils/helper";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useRef,
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
  runStorageMaintenance: () => Promise<void>;
  runInImportSession: <T>(task: () => Promise<T>) => Promise<T>;
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
  const importSessionCountRef = useRef(0);
  const pendingMaintenanceRef = useRef(false);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

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

  const enqueueWrite = async <T,>(task: () => Promise<T>): Promise<T> => {
    const run = writeQueueRef.current
      .catch(() => undefined)
      .then(task);
    writeQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  const waitForPendingWrites = async () => {
    await writeQueueRef.current.catch(() => undefined);
  };

  const collectReferencedAudioUris = async () => {
    const targetPlaylists = await readPlaylists();
    const uriSet = new Set<string>();

    for (const item of targetPlaylists) {
      const playlistAudios = await loadPlaylistAudios(item.id);
      playlistAudios.forEach((audio) => {
        if (typeof audio.uri === "string") {
          uriSet.add(audio.uri);
        }
      });
    }

    return Array.from(uriSet);
  };

  const isAudioReferencedInPlaylists = async (
    uri: string,
    sourcePlaylists: PlaylistItem[],
  ) => {
    for (const item of sourcePlaylists) {
      const playlistAudios = await loadPlaylistAudios(item.id);
      if (playlistAudios.some((audio) => audio.uri === uri)) {
        return true;
      }
    }
    return false;
  };

  const runStorageMaintenanceWithSnapshot = async () => {
    if (importSessionCountRef.current > 0) {
      pendingMaintenanceRef.current = true;
      return;
    }

    try {
      await waitForPendingWrites();
      const referencedUris = await collectReferencedAudioUris();
      await cleanupLegacyAudioLibrary(referencedUris);
      await cleanupOrphanImportedAudios(referencedUris);
    } catch (error) {
      console.log("run storage maintenance error", error);
    }
  };

  const runStorageMaintenance = async () => {
    await runStorageMaintenanceWithSnapshot();
  };

  const runInImportSession = async <T,>(task: () => Promise<T>) => {
    importSessionCountRef.current += 1;
    try {
      return await task();
    } finally {
      importSessionCountRef.current = Math.max(
        0,
        importSessionCountRef.current - 1,
      );

      if (
        importSessionCountRef.current === 0 &&
        pendingMaintenanceRef.current
      ) {
        pendingMaintenanceRef.current = false;
        void runStorageMaintenanceWithSnapshot();
      }
    }
  };

  const loadPlaylists = async () => {
    setPlaylistLoading(true);
    try {
      const result = await minResolve(readPlaylists());
      setPlaylist(result);
      void runStorageMaintenanceWithSnapshot();
    } catch (error) {
      console.log("init playlist error", error);
    } finally {
      setPlaylistLoading(false);
    }
  };

  const createPlaylist = async (name: string) => {
    await enqueueWrite(async () => {
      const nextName = name.trim();
      if (!nextName) return;
      const sourcePlaylists = await readPlaylists();
      const nextPlaylists = [
        ...sourcePlaylists,
        { id: `p${Date.now()}`, name: nextName },
      ];
      await setLocalValue("vinyl-playlist", JSON.stringify(nextPlaylists));
      setPlaylist(nextPlaylists);
      setPlaylistVersion((current) => current + 1);
    });
  };

  const removePlaylist = async (playlistId: string) => {
    await enqueueWrite(async () => {
      const sourcePlaylists = await readPlaylists();
      const nextPlaylists = sourcePlaylists.filter((item) => item.id !== playlistId);
      if (nextPlaylists.length === sourcePlaylists.length) return;

      const removedAudios = await loadPlaylistAudios(playlistId);

      await setLocalValue("vinyl-playlist", JSON.stringify(nextPlaylists));
      await removeLocalValue(playlistId);
      setPlaylist(nextPlaylists);
      setPlaylistVersion((current) => current + 1);

      const candidateUris = Array.from(
        new Set(removedAudios.map((audio) => audio.uri).filter(Boolean)),
      );
      for (const uri of candidateUris) {
        const referenced = await isAudioReferencedInPlaylists(uri, nextPlaylists);
        if (!referenced) {
          await deleteImportedAudioFileIfManaged(uri);
        }
      }
      void runStorageMaintenanceWithSnapshot();
    });
  };

  const addAudiosToPlaylist = async (playlistId: string, audios: AudioItem[]) => {
    return enqueueWrite(async () => {
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
    });
  };

  const removeAudioFromPlaylist = async (playlistId: string, uri: string) => {
    await enqueueWrite(async () => {
      const currentAudios = await loadPlaylistAudios(playlistId);
      const nextAudios = currentAudios.filter((audio) => audio.uri !== uri);
      if (nextAudios.length === currentAudios.length) return;
      await savePlaylistAudios(playlistId, nextAudios);

      const targetPlaylists = await readPlaylists();
      const otherPlaylists = targetPlaylists.filter((item) => item.id !== playlistId);
      const stillReferenced = await isAudioReferencedInPlaylists(uri, otherPlaylists);
      if (!stillReferenced) {
        await deleteImportedAudioFileIfManaged(uri);
      }

      setPlaylistVersion((current) => current + 1);
    });
  };

  const removeAudioFromAllPlaylists = async (uri: string) => {
    await enqueueWrite(async () => {
      const targetPlaylists = await readPlaylists();

      await Promise.all(
        targetPlaylists.map(async (item) => {
          const playlistAudios = await loadPlaylistAudios(item.id);
          const nextAudios = playlistAudios.filter((audio) => audio.uri !== uri);
          if (nextAudios.length !== playlistAudios.length) {
            await savePlaylistAudios(item.id, nextAudios);
          }
        }),
      );

      await deleteImportedAudioFileIfManaged(uri);
      setPlaylistVersion((current) => current + 1);
      void runStorageMaintenanceWithSnapshot();
    });
  };

  const checkAudioInPlaylists = async (uri: string) => {
    const targetPlaylists = await readPlaylists();
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
        runStorageMaintenance,
        runInImportSession,
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
