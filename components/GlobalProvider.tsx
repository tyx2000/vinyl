import { GlobalContext } from "@/context/GlobalContext";
import * as DocumentPicker from "expo-document-picker";
import { Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import { ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import NewPlaylistModal from "./NewPlaylistModal";
import PlayerFoot from "./PlayerFoot";

const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/ogg",
  "audio/flac",
  "audio/acc",
];
const AUDIO_EXTENSIONS = ["mp3", "mav", "m4a", "ogg", "flac", "acc"];

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
});

export default function GlobalProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState<Record<string, string>[]>([]);
  const [playingAudio, setPlayingAudio] = useState<Record<string, string>>({});
  const [playlist, setPlaylist] = useState<Record<string, string>[]>([]);
  const [modalName, setModalName] = useState("");

  async function initLibrary() {
    setLoading(true);
    try {
      const [lib] = await Promise.all([
        SecureStore.getItemAsync("vinyl-library"),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
      if (lib) {
        setAudios(JSON.parse(lib));
      }
    } catch (error) {
      console.log("init lib error", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initLibrary();
  }, []);

  const pickAudios = async () => {
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
          if (fileInfo.isDirectory) {
            await FileSystem.deleteAsync(audioSavePath);
            console.log("删除同名目录");
          } else {
            await FileSystem.deleteAsync(audioSavePath);
          }
        }
        const dirInfo = await FileSystem.getInfoAsync(audioRootDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(audioSavePath, {
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
          customName: "",
        });
      }
      const newAudios: Record<string, string>[] = [],
        uris = new Set();
      [...audios, ...files].forEach((a) => {
        if (uris.has(a.uri)) {
          return;
        } else {
          uris.add(a.uri);
          newAudios.push(a);
        }
      });

      await SecureStore.setItemAsync(
        "vinyl-library",
        JSON.stringify(newAudios),
      );
      setAudios(newAudios);
    } catch (error) {
      console.error(error);
    }
  };

  const newPlaylist = async (name: string) => {
    if (name) {
      const t = [...playlist, { id: "p" + Date.now(), name }];
      await SecureStore.setItemAsync("vinyl-playlist", JSON.stringify(t));
      setPlaylist(t);
    }
    setModalName("");
  };

  return (
    <GlobalContext.Provider
      value={{
        setPlayingAudio,
        audios,
        setAudios,
        loading,
        pickAudios,
        playlist,
        setPlaylist,
        setModalName,
      }}
    >
      <View style={styles.wrapper}>
        {children}
        <PlayerFoot playingAudio={playingAudio} />
      </View>
      <NewPlaylistModal
        visible={modalName === "playlist"}
        onCancel={() => {
          setModalName("");
        }}
        onOk={newPlaylist}
      />
    </GlobalContext.Provider>
  );
}
