import { GlobalContext } from "@/context/GlobalContext";
import { pickAudioFile } from "@/utils/helper";
import * as SecureStore from "expo-secure-store";
import { ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import NewPlaylistModal from "./NewPlaylistModal";
import PlayerFoot from "./PlayerFoot";

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
        new Promise((resolve) => setTimeout(resolve, 500)),
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
      const files = await pickAudioFile();
      if (files) {
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
      }
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
