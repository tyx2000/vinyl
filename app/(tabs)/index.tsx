import Header from "@/components/Header";
import List from "@/components/List";
import PageBackground from "@/components/PageBackground";
import { useGlobalContext } from "@/context/GlobalContext";
import useMounted from "@/hooks/useMounted";
import { useRouter } from "expo-router";
import { View } from "react-native";

const Home = () => {
  const router = useRouter();
  const {
    playlist,
    playlistLoading,
    loadPlaylists,
    loadPlaylistAudios,
    playingAudio,
    currentPlaylist,
    setPlayingAudio,
    setCurrentPlaylist,
    clearSleepTimer,
    removePlaylist,
    setModalName,
    showToast,
  } =
    useGlobalContext();

  useMounted(loadPlaylists);

  return (
    <PageBackground>
      <View style={{ flex: 1 }}>
        <Header
          name="Playlist"
          handleRightButtonAction={() => {
            setModalName("playlist");
          }}
        />
        <List
          type="playlist"
          data={playlist}
          loading={playlistLoading}
          handleListItemPress={(item) => {
            router.push(`/playlist/${item.id}?name=${item.name}`);
          }}
          handleListRightAction={(item) => {
            if (typeof item.id !== "string") return;
            const targetPlaylistId = item.id;
            void (async () => {
              const targetPlaylistAudios = await loadPlaylistAudios(targetPlaylistId);
              const targetUriSet = new Set(
                targetPlaylistAudios.map((audio) => audio.uri),
              );
              const currentPlayingUri =
                typeof playingAudio.uri === "string" ? playingAudio.uri : "";
              const queueBelongsToDeletedPlaylist =
                currentPlaylist.length > 0 &&
                currentPlaylist.every((audio) => targetUriSet.has(audio.uri));
              const shouldDestroyPlayerFoot =
                queueBelongsToDeletedPlaylist ||
                (!!currentPlayingUri && targetUriSet.has(currentPlayingUri));

              await removePlaylist(targetPlaylistId);
              if (shouldDestroyPlayerFoot) {
                setPlayingAudio({});
                setCurrentPlaylist([]);
                clearSleepTimer();
                showToast("Playback stopped (source playlist was deleted)", "warn");
              }
            })();
          }}
        />
      </View>
    </PageBackground>
  );
};

export default Home;
