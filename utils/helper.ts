import * as DocumentPicker from "expo-document-picker";
import { Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";

const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
];
const AUDIO_EXTENSIONS = ["mp3", "mav", "m4a", "ogg", "flac", "aac"];

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
  return await SecureStore.getItemAsync(key);
};

export const setLocalValue = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value);
};

export const pickAudioFile = async (): Promise<
  Record<string, string>[] | undefined
> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: AUDIO_MIME_TYPES,
      multiple: true,
      copyToCacheDirectory: false,
    });
    if (result.canceled) {
      return;
    }
    const files: Record<string, string>[] = [];
    for (const asset of result.assets) {
      const fileExt = asset.name.split(".").pop()?.toLowerCase();
      if (!fileExt || !AUDIO_EXTENSIONS.includes(fileExt)) {
        continue;
      }
      const audioRootDir = Paths.join(
        FileSystem.documentDirectory as string,
        "vinylAudios",
      );
      const audioSavePath = Paths.join(
        audioRootDir,
        `${Date.now()}-${asset.name}`,
      );
      const fileInfo = await FileSystem.getInfoAsync(audioSavePath);
      if (fileInfo.exists && fileInfo.size !== 0) {
        // if (fileInfo.isDirectory) {
        //   await FileSystem.deleteAsync(audioSavePath)
        // } else {
        //   await FileSystem.deleteAsync(audioSavePath)
        // }
        await FileSystem.deleteAsync(audioSavePath);
      }
      const dirInfo = await FileSystem.getInfoAsync(audioRootDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(audioRootDir, {
          intermediates: true,
        });
      }
      await FileSystem.copyAsync({
        from: asset.uri,
        to: audioSavePath,
      });
      const finalFileInfo = await FileSystem.getInfoAsync(audioSavePath);
      if (!finalFileInfo.exists || finalFileInfo.size === 0) {
        throw new Error("copy file failed, file is empty");
      }
      files.push({
        name: asset.name,
        uri: audioSavePath,
      });
    }
    return files;
  } catch (error) {
    console.log("pick file error", error);
  }
};
