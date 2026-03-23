import { LibraryProvider, useLibraryContext } from "@/context/LibraryContext";
import { PlayerProvider, usePlayerContext } from "@/context/PlayerContext";
import { PlayerRuntimeProvider } from "@/context/PlayerRuntimeContext";
import { PlaylistProvider, usePlaylistContext } from "@/context/PlaylistContext";
import { AudioItem } from "@/context/types";
import { UiProvider, useUiContext } from "@/context/UiContext";
import { normalizeAudioName } from "@/utils/helper";
import { ReactNode, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import AddToPlaylistModal from "./AddToPlaylistModal";
import AudioOptionsModal from "./AudioOptionsModal";
import NewPlaylistModal from "./NewPlaylistModal";
import PlayerFoot from "./PlayerFoot";
import ToastBanner from "./ToastBanner";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
});

function GlobalShell({ children }: { children: ReactNode }) {
  const {
    playingAudio,
    setPlayingAudio,
    playRequestId,
    currentPlaylist,
    currentIndex,
    playFromQueue,
    playMode,
    setPlayMode,
    playNext,
    playPrevious,
    sleepTimerEndsAt,
    setSleepTimerMinutes,
    clearSleepTimer,
  } = usePlayerContext();
  const { removeAudioByUri } = useLibraryContext();
  const {
    createPlaylist,
    removeAudioFromPlaylist,
    removeAudioFromAllPlaylists,
    playlist,
    playlistLoading,
    loadPlaylists,
    addAudiosToPlaylist,
    checkAudioInPlaylists,
  } = usePlaylistContext();
  const {
    modalName,
    setModalName,
    optionAudio,
    setOptionAudio,
    optionOrigin,
    setOptionOrigin,
    optionPlaylistId,
    setOptionPlaylistId,
  } = useUiContext();
  const [includedPlaylistIds, setIncludedPlaylistIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "warn";
  } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showToast = (
    message: string,
    type: "success" | "info" | "warn" = "info",
  ) => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1900);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (modalTransitionTimerRef.current) {
        clearTimeout(modalTransitionTimerRef.current);
      }
    };
  }, []);

  const handleAudioOption = async (action: string) => {
    if (action === "delete") {
      if (typeof optionAudio.uri === "string") {
        if (optionOrigin === "playlist" && optionPlaylistId) {
          await removeAudioFromPlaylist(optionPlaylistId, optionAudio.uri);
          showToast("Song removed from playlist", "success");
        } else {
          await removeAudioByUri(optionAudio.uri);
          await removeAudioFromAllPlaylists(optionAudio.uri);
          if (playingAudio.uri === optionAudio.uri) {
            setPlayingAudio({});
          }
          showToast("Song removed from library", "success");
        }
      }
      setOptionAudio({});
      setOptionOrigin("library");
      setOptionPlaylistId("");
      setModalName("");
      return;
    }
    if (action === "addTo") {
      await loadPlaylists();
      if (typeof optionAudio.uri === "string") {
        const included = await checkAudioInPlaylists(optionAudio.uri);
        setIncludedPlaylistIds(included);
      } else {
        setIncludedPlaylistIds([]);
      }
      setModalName("");
      if (modalTransitionTimerRef.current) {
        clearTimeout(modalTransitionTimerRef.current);
      }
      modalTransitionTimerRef.current = setTimeout(() => {
        setModalName("addToPlaylist");
        modalTransitionTimerRef.current = null;
      }, 320);
      return;
    }
    if (action === "close") {
      if (modalTransitionTimerRef.current) {
        clearTimeout(modalTransitionTimerRef.current);
        modalTransitionTimerRef.current = null;
      }
      setOptionAudio({});
      setOptionOrigin("library");
      setOptionPlaylistId("");
      setModalName("");
    }
  };

  const handleCreatePlaylist = async (name: string) => {
    await createPlaylist(name);
    await loadPlaylists();
    if (typeof optionAudio.uri === "string") {
      const included = await checkAudioInPlaylists(optionAudio.uri);
      setIncludedPlaylistIds(included);
      setModalName("addToPlaylist");
      return;
    }
    setModalName("");
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (typeof optionAudio.uri !== "string") {
      setModalName("");
      return;
    }

    const audio: AudioItem = {
      uri: optionAudio.uri,
      name: normalizeAudioName(
        typeof optionAudio.name === "string" ? optionAudio.name : "",
        optionAudio.uri,
      ),
    };
    const result = await addAudiosToPlaylist(playlistId, [audio]);
    if (result.addedCount > 0) {
      showToast("Song added to playlist", "success");
    } else {
      showToast("Song is already in this playlist", "warn");
    }
    setOptionAudio({});
    setOptionOrigin("library");
    setOptionPlaylistId("");
    setIncludedPlaylistIds([]);
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
      <AudioOptionsModal
        visible={modalName === "audioOption"}
        origin={optionOrigin}
        handleOptionAction={handleAudioOption}
      />
      <AddToPlaylistModal
        visible={modalName === "addToPlaylist"}
        playlists={playlist}
        loading={playlistLoading}
        onReload={loadPlaylists}
        onCancel={() => {
          setOptionAudio({});
          setOptionOrigin("library");
          setOptionPlaylistId("");
          setIncludedPlaylistIds([]);
          setModalName("");
        }}
        onSelectPlaylist={handleAddToPlaylist}
        onCreatePlaylist={() => {
          setModalName("playlist");
        }}
        includedPlaylistIds={includedPlaylistIds}
      />
      {toast && <ToastBanner message={toast.message} type={toast.type} />}
    </>
  );
}

export default function GlobalProvider({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <PlayerRuntimeProvider>
        <LibraryProvider>
          <PlaylistProvider>
            <UiProvider>
              <GlobalShell>{children}</GlobalShell>
            </UiProvider>
          </PlaylistProvider>
        </LibraryProvider>
      </PlayerRuntimeProvider>
    </PlayerProvider>
  );
}
