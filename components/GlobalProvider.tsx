import { PlayerProvider, usePlayerContext } from "@/context/PlayerContext";
import { PlayerRuntimeProvider } from "@/context/PlayerRuntimeContext";
import { PlaylistProvider, usePlaylistContext } from "@/context/PlaylistContext";
import { UiProvider, useUiContext } from "@/context/UiContext";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import NewPlaylistModal from "./NewPlaylistModal";
import PlayerFoot from "./PlayerFoot";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
});

function GlobalShell({ children }: { children: ReactNode }) {
  const {
    playingAudio,
    playRequestId,
    playNext,
    playPrevious,
    sleepTimerEndsAt,
    clearSleepTimer,
  } = usePlayerContext();
  const { createPlaylist, loadPlaylists } = usePlaylistContext();
  const { modalName, setModalName } = useUiContext();

  const handleCreatePlaylist = async (name: string) => {
    await createPlaylist(name);
    await loadPlaylists();
    setModalName("");
  };

  return (
    <>
      <View style={styles.wrapper}>
        {children}
        <PlayerFoot
          playingAudio={playingAudio}
          playRequestId={playRequestId}
          playNext={playNext}
          playPrevious={playPrevious}
          sleepTimerEndsAt={sleepTimerEndsAt}
          clearSleepTimer={clearSleepTimer}
        />
      </View>
      <NewPlaylistModal
        visible={modalName === "playlist"}
        onCancel={() => {
          setModalName("");
        }}
        onOk={handleCreatePlaylist}
      />
    </>
  );
}

export default function GlobalProvider({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <PlayerRuntimeProvider>
        <PlaylistProvider>
          <UiProvider>
            <GlobalShell>{children}</GlobalShell>
          </UiProvider>
        </PlaylistProvider>
      </PlayerRuntimeProvider>
    </PlayerProvider>
  );
}
