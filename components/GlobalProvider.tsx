import { GlobalContext } from "@/context/GlobalContext";
import { setLocalValue } from "@/utils/helper";
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
  const [playingAudio, setPlayingAudio] = useState<Record<string, string>>({});
  const [playlist, setPlaylist] = useState<Record<string, string>[]>([]);
  const [modalName, setModalName] = useState("");

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
