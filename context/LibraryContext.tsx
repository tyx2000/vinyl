import useMounted from "@/hooks/useMounted";
import { getLocalValue, minResolve, pickAudioFile, setLocalValue } from "@/utils/helper";
import { File } from "expo-file-system";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { AudioItem } from "./types";

type LibraryContextValue = {
  loading: boolean;
  audios: AudioItem[];
  setAudios: Dispatch<SetStateAction<AudioItem[]>>;
  addAudios: () => Promise<void>;
  removeAudioByUri: (uri: string) => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>([]);

  const initAudios = async () => {
    setLoading(true);
    try {
      const results = await minResolve(getLocalValue("vinyl-library"));
      if (results) {
        setAudios(JSON.parse(results) as AudioItem[]);
      }
    } catch (error) {
      console.log("init library audios error", error);
    } finally {
      setLoading(false);
    }
  };

  useMounted(initAudios);

  const addAudios = async () => {
    try {
      const files = await pickAudioFile();
      if (!files) return;

      const nextAudios: AudioItem[] = [];
      const uris = new Set<string>();
      [...audios, ...files].forEach((audio) => {
        if (uris.has(audio.uri)) return;
        uris.add(audio.uri);
        nextAudios.push(audio);
      });

      await setLocalValue("vinyl-library", JSON.stringify(nextAudios));
      setAudios(nextAudios);
    } catch (error) {
      console.log("add audios error", error);
    }
  };

  const removeAudioByUri = async (uri: string) => {
    try {
      const nextAudios = audios.filter((audio) => audio.uri !== uri);
      await setLocalValue("vinyl-library", JSON.stringify(nextAudios));
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
      setAudios(nextAudios);
    } catch (error) {
      console.log("remove audio error", error);
    }
  };

  return (
    <LibraryContext.Provider
      value={{ loading, audios, setAudios, addAudios, removeAudioByUri }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibraryContext() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibraryContext must be used within LibraryProvider");
  }
  return context;
}
