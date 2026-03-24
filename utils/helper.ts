import { AudioItem } from "@/context/types";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { copyAsync, deleteAsync, readDirectoryAsync } from "expo-file-system/legacy";
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
const AUDIO_DIR = new Directory(Paths.document, "vinylAudios");
const DISK_SPACE_RESERVE_BYTES = 300 * 1024 * 1024;
const MAX_IMPORTED_FILE_NAME_LENGTH = 120;
const LEGACY_LIBRARY_KEYS = ["vinyl-library", "vinyl-audios", "vinyl-all-audios"];

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getNameFromUri = (uri?: string) => {
  if (!uri) return "Unknown";
  const lastSegment = uri.split("/").pop() || "";
  const raw = lastSegment.split("?")[0] || "";
  return safeDecodeURIComponent(raw) || "Unknown";
};

export const normalizeAudioName = (name?: string, uri?: string) => {
  const candidate = String(name ?? "").trim() || getNameFromUri(uri);
  const dotIndex = candidate.lastIndexOf(".");
  if (dotIndex <= 0) return candidate;

  const ext = candidate.slice(dotIndex + 1).toLowerCase();
  if (!AUDIO_EXTENSIONS.includes(ext)) return candidate;
  return candidate.slice(0, dotIndex).trim() || candidate;
};

export const normalizeAudioItem = (audio: AudioItem): AudioItem => ({
  ...audio,
  name: normalizeAudioName(audio?.name, audio?.uri),
});

export const normalizeAudioItems = (audios: AudioItem[]) =>
  audios.map((audio) => normalizeAudioItem(audio));

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

export const removeLocalValue = async (key: string) => {
  const storageFile = getStorageFile(key);
  if (storageFile.exists) {
    storageFile.delete();
  }
  await SecureStore.deleteItemAsync(key);
};

const normalizeUriForCompare = (uri: string) =>
  safeDecodeURIComponent(uri).replace(/\/+$/, "");

const buildManagedAudioUriSet = (uris: string[]) => {
  const uriSet = new Set<string>();
  uris.forEach((uri) => {
    if (typeof uri !== "string") return;
    if (!uri.includes("/vinylAudios/")) return;
    uriSet.add(normalizeUriForCompare(uri));
  });
  return uriSet;
};

export const cleanupOrphanImportedAudios = async (referencedUris: string[]) => {
  if (!AUDIO_DIR.exists) return 0;

  const referencedSet = buildManagedAudioUriSet(referencedUris);
  const fileNames = await readDirectoryAsync(AUDIO_DIR.uri);
  let removedCount = 0;

  for (const fileName of fileNames) {
    const audioFile = new File(AUDIO_DIR, fileName);
    const normalizedUri = normalizeUriForCompare(audioFile.uri);
    const shouldDelete = !referencedSet.has(normalizedUri);
    if (!shouldDelete) continue;
    if (!audioFile.exists) continue;
    try {
      await deleteAsync(audioFile.uri, { idempotent: true });
      removedCount += 1;
    } catch (error) {
      console.log("cleanup orphan audio file failed", error);
    }
  }

  return removedCount;
};

export const cleanupLegacyAudioLibrary = async (referencedUris: string[]) => {
  const referencedSet = buildManagedAudioUriSet(referencedUris);
  let removedCount = 0;

  for (const key of LEGACY_LIBRARY_KEYS) {
    try {
      const raw = await getLocalValue(key);
      if (!raw) {
        continue;
      }

      let candidates: string[] = [];
      try {
        const parsed = JSON.parse(raw) as Array<AudioItem | { uri?: string }>;
        candidates = parsed
          .map((item) => (item && typeof item.uri === "string" ? item.uri : ""))
          .filter(Boolean);
      } catch {
        candidates = [];
      }

      for (const uri of candidates) {
        if (!uri.includes("/vinylAudios/")) continue;
        if (referencedSet.has(normalizeUriForCompare(uri))) continue;
        try {
          await deleteAsync(uri, { idempotent: true });
          removedCount += 1;
        } catch (error) {
          console.log("cleanup legacy audio file failed", error);
        }
      }

      await removeLocalValue(key);
    } catch (error) {
      console.log("cleanup legacy library failed", error);
    }
  }

  return removedCount;
};

export const deleteImportedAudioFileIfManaged = async (uri?: string) => {
  if (typeof uri !== "string" || !uri.includes("/vinylAudios/")) return false;
  try {
    await deleteAsync(uri, { idempotent: true });
    return true;
  } catch (error) {
    console.log("delete imported audio failed", error);
    return false;
  }
};

export type PickAudioResult = {
  files: AudioItem[];
  failedCount: number;
  skippedCount: number;
  selectedCount: number;
  totalCandidateCount: number;
  processedCount: number;
  cancelled: boolean;
};

export type PickAudioProgress = {
  totalCount: number;
  processedCount: number;
  copiedCount: number;
  failedCount: number;
  skippedCount: number;
  stage: "copying" | "done" | "cancelled";
};

type PickAudioOptions = {
  shouldCancel?: () => boolean;
  onProgress?: (progress: PickAudioProgress) => void;
};

const sanitizeImportedFileName = (name: string, index: number) => {
  const safe = name.replace(/[\\/:*?"<>|]/g, "_").trim();
  const dotIndex = safe.lastIndexOf(".");
  const hasExt = dotIndex > 0 && dotIndex < safe.length - 1;
  const ext = hasExt ? safe.slice(dotIndex + 1) : "";
  const rawBase = hasExt ? safe.slice(0, dotIndex) : safe;
  const fallbackBase = `audio-${Date.now()}-${index}`;
  const base = rawBase || fallbackBase;
  const extPart = ext ? `.${ext}` : "";
  const maxBaseLen = Math.max(16, MAX_IMPORTED_FILE_NAME_LENGTH - extPart.length);
  const compactBase = base.slice(0, maxBaseLen);
  return `${compactBase}${extPart}`;
};

export const pickAudioFile = async (
  options: PickAudioOptions = {},
): Promise<PickAudioResult | undefined> => {
  const { shouldCancel, onProgress } = options;
  const result = await DocumentPicker.getDocumentAsync({
    type: AUDIO_MIME_TYPES,
    multiple: true,
    // For very large selections, avoid an extra cache copy before our own persistence copy.
    copyToCacheDirectory: false,
  });
  if (result.canceled) {
    return;
  }

  const audioRootDir = AUDIO_DIR;
  if (!audioRootDir.exists) {
    audioRootDir.create({ idempotent: true, intermediates: true });
  }

  const candidateAssets = result.assets.filter((asset) => {
    const fileExt = asset.name.split(".").pop()?.toLowerCase();
    return !!fileExt && AUDIO_EXTENSIONS.includes(fileExt);
  });
  const skippedCount = result.assets.length - candidateAssets.length;

  const selectedTotalBytes = candidateAssets.reduce((sum, asset) => {
    if (typeof asset.size === "number" && asset.size > 0) {
      return sum + asset.size;
    }
    const sourceFile = new File(asset.uri);
    if (typeof sourceFile.size === "number" && sourceFile.size > 0) {
      return sum + sourceFile.size;
    }
    return sum;
  }, 0);
  const availableBytes = Paths.availableDiskSpace;
  if (
    selectedTotalBytes > 0 &&
    typeof availableBytes === "number" &&
    selectedTotalBytes > Math.max(0, availableBytes - DISK_SPACE_RESERVE_BYTES)
  ) {
    throw new Error("INSUFFICIENT_DISK_SPACE_FOR_IMPORT");
  }

  const files: AudioItem[] = [];
  let failedCount = 0;
  let processedCount = 0;
  let cancelled = false;
  onProgress?.({
    totalCount: candidateAssets.length,
    processedCount: 0,
    copiedCount: 0,
    failedCount: 0,
    skippedCount,
    stage: "copying",
  });

  for (const [index, asset] of candidateAssets.entries()) {
    if (shouldCancel?.()) {
      cancelled = true;
      break;
    }

    let targetUri = "";
    try {
      const safeName = sanitizeImportedFileName(asset.name, index);
      const audioFile = new File(
        audioRootDir,
        `${Date.now()}-${index}-${safeName}`,
      );
      targetUri = audioFile.uri;
      if (audioFile.exists && audioFile.size !== 0) {
        audioFile.delete();
      }

      await copyAsync({ from: asset.uri, to: audioFile.uri });

      if (!audioFile.exists || audioFile.size === 0) {
        throw new Error("copy file failed, file is empty");
      }
      files.push({
        name: normalizeAudioName(asset.name, audioFile.uri),
        uri: audioFile.uri,
      });
    } catch (error) {
      failedCount += 1;
      if (targetUri) {
        try {
          await deleteAsync(targetUri, { idempotent: true });
        } catch {
          // ignore cleanup failure
        }
      }
      console.log("copy audio file failed", error);
    } finally {
      processedCount += 1;
      onProgress?.({
        totalCount: candidateAssets.length,
        processedCount,
        copiedCount: files.length,
        failedCount,
        skippedCount,
        stage: "copying",
      });
    }
  }

  onProgress?.({
    totalCount: candidateAssets.length,
    processedCount,
    copiedCount: files.length,
    failedCount,
    skippedCount,
    stage: cancelled ? "cancelled" : "done",
  });

  return {
    files,
    failedCount,
    skippedCount,
    selectedCount: result.assets.length,
    totalCandidateCount: candidateAssets.length,
    processedCount,
    cancelled,
  };
};
