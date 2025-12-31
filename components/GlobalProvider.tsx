import { GlobalContext } from "@/context/GlobalContext";
import useMounted from "@/hooks/useMounted";
import {
  getLocalValue,
  minResolve,
  pickAudioFile,
  setLocalValue,
} from "@/utils/helper";
import { ReactNode, useState } from "react";
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

  const initAudios = async () => {
    setLoading(true);
    try {
      const results = await minResolve(getLocalValue("vinyl-library"));
      if (results) {
        setAudios(JSON.parse(results));
      }
    } catch (error) {
      console.log("initLibAudios error", error);
    } finally {
      setLoading(false);
    }
  };

  useMounted(initAudios);

  const pickAudios = async () => {
    try {
      const files = await pickAudioFile();
      if (files) {
        const newAudios: Record<string, string>[] = [],
          uris = new Set<string>();
        [...audios, ...files].forEach((a) => {
          if (uris.has(a.uri)) {
            return;
          } else {
            uris.add(a.uri);
            newAudios.push(a);
          }
        });
        await setLocalValue("vinyl-library", JSON.stringify(newAudios));
        setAudios(newAudios);
      }
    } catch (error) {}
  };

  const newPlaylist = async (name: string) => {
    if (name) {
      const t = [...playlist, { id: "p" + Date.now(), name }];
      await setLocalValue("vinyl-playlist", JSON.stringify(t));
      setPlaylist(t);
    }
    setModalName("");
  };

  return (
    <GlobalContext.Provider
      value={{
        loading,
        audios,
        setAudios,
        pickAudios,
        setPlayingAudio,
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
