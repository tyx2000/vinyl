import { GlobalContext } from "@/context/GlobalContext";
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
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

  async function initLibrary() {
    setLoading(true);
    try {
      const [lib] = await Promise.all([
        SecureStore.getItemAsync("vinyl-library"),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      if (lib) {
        console.log({ lib });
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

  const pickAudios = useCallback(async () => {
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
        files.push({
          name: asset.name,
          uri: asset.uri,
          customName: "",
        });
        const newAudios = [...audios, ...files];
        setAudios(newAudios);
        SecureStore.setItemAsync("vinyl-library", JSON.stringify(newAudios));
      }
    } catch (error) {}
  }, []);

  return (
    <GlobalContext.Provider
      value={{ setPlayingAudio, audios, setAudios, loading, pickAudios }}
    >
      <View style={styles.wrapper}>
        {children}
        <PlayerFoot playingAudio={playingAudio} />
      </View>
    </GlobalContext.Provider>
  );
}
