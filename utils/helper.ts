import { AudioItem } from "@/context/types";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";

const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
];
const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg", "flac", "aac"];
const STORAGE_DIR = new Directory(Paths.document, "vinylData");

const ensureStorageDir = () => {
  if (!STORAGE_DIR.exists) {
    STORAGE_DIR.create({ idempotent: true, intermediates: true });
  }
};

const getStorageFile = (key: string) => {
  ensureStorageDir();
  return new File(STORAGE_DIR, `${encodeURIComponent(key)}.json`);
};

export const minResolve = async <T>(
  fn: Promise<T>,
  min: number = 0,
): Promise<T> => {
  const waitTime = Math.max(0, min);
  const [result] = await Promise.all([
    fn,
    new Promise((resolve) => setTimeout(resolve, waitTime)),
  ]);
  return result;
};

export const getLocalValue = async (key: string) => {
  const storageFile = getStorageFile(key);
  if (storageFile.exists) {
    return storageFile.text();
  }

  // Backward compatibility: migrate existing values out of SecureStore.
  const secureStoreValue = await SecureStore.getItemAsync(key);
  if (secureStoreValue !== null) {
    storageFile.create({ intermediates: true, overwrite: true });
    storageFile.write(secureStoreValue);
    await SecureStore.deleteItemAsync(key);
  }
  return secureStoreValue;
};

export const setLocalValue = async (key: string, value: string) => {
  const storageFile = getStorageFile(key);
  storageFile.create({ intermediates: true, overwrite: true });
  storageFile.write(value);
  await SecureStore.deleteItemAsync(key);
};

export const pickAudioFile = async (): Promise<AudioItem[] | undefined> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: AUDIO_MIME_TYPES,
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) {
      return;
    }
    const files: AudioItem[] = [];
    for (const asset of result.assets) {
      const fileExt = asset.name.split(".").pop()?.toLowerCase();
      if (!fileExt || !AUDIO_EXTENSIONS.includes(fileExt)) {
        continue;
      }
      const audioRootDir = new Directory(Paths.document, "vinylAudios");
      if (!audioRootDir.exists) {
        audioRootDir.create({ idempotent: true, intermediates: true });
      }

      const audioFile = new File(audioRootDir, `${Date.now()}-${asset.name}`);
      if (audioFile.exists && audioFile.size !== 0) {
        audioFile.delete();
      }

      const sourceFile = new File(asset.uri);
      sourceFile.copy(audioFile);

      if (!audioFile.exists || audioFile.size === 0) {
        throw new Error("copy file failed, file is empty");
      }
      files.push({
        name: asset.name,
        uri: audioFile.uri,
      });
    }
    return files;
  } catch (error) {
    console.log("pick file error", error);
  }
};
