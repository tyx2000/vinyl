import Header from "@/components/Header";
import List from "@/components/List";
import PageBackground from "@/components/PageBackground";
import SelectAudioModal from "@/components/SelectAudioModal";
import { useGlobalContext } from "@/context/GlobalContext";
import { usePlayerRuntimeContext } from "@/context/PlayerRuntimeContext";
import { AudioItem } from "@/context/types";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

const PlaylistDetails = () => {
  const {
    playFromQueue,
    playingAudio,
    currentPlaylist,
    setCurrentPlaylist,
    playlistVersion,
    loadPlaylistAudios,
    addAudiosToPlaylist,
    setOptionAudio,
    setOptionOrigin,
    setOptionPlaylistId,
    setModalName,
  } = useGlobalContext();
  const { playing } = usePlayerRuntimeContext();
  const { name, playlistId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [visible, setVisible] = useState(false);

  const getPlaylistAudios = async () => {
    setLoading(true);
    try {
      if (typeof playlistId === "string") {
        const result = await loadPlaylistAudios(playlistId);
        setAudios(result);
      }
    } catch (error) {
      console.log("getPlaylistDetails error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getPlaylistAudios();
  }, [playlistId, playlistVersion]);

  const handleAddAudios = async (nextAudios: AudioItem[]) => {
    setVisible(false);
    if (typeof playlistId === "string" && nextAudios.length > 0) {
      const merged = await addAudiosToPlaylist(playlistId, nextAudios);
      setAudios(merged.audios);

      const currentPlayingUri =
        typeof playingAudio.uri === "string" ? playingAudio.uri : "";
      const mergedUriSet = new Set(merged.audios.map((audio) => audio.uri));
      const isCurrentQueueFromThisPlaylist =
        currentPlaylist.length > 0 &&
        currentPlaylist.every((audio) => mergedUriSet.has(audio.uri)) &&
        mergedUriSet.has(currentPlayingUri);

      if (isCurrentQueueFromThisPlaylist) {
        setCurrentPlaylist(merged.audios);
      }
    }
  };

  return (
    <PageBackground>
      <View style={{ flex: 1 }}>
        <Header
          name={name as string}
          handleRightButtonAction={() => {
            setVisible(true);
          }}
        />
        <List
          data={audios}
          loading={loading}
          isPlaying={playing}
          playingUri={
            typeof playingAudio.uri === "string" ? playingAudio.uri : undefined
          }
          handleListItemPress={(item) => {
            const targetIndex = audios.findIndex((audio) => audio.uri === item.uri);
            playFromQueue(audios, targetIndex < 0 ? 0 : targetIndex);
          }}
          handleListRightAction={(item) => {
            setOptionAudio(item);
            setOptionOrigin("playlist");
            setOptionPlaylistId(typeof playlistId === "string" ? playlistId : "");
            setModalName("audioOption");
          }}
        />
        <SelectAudioModal
          visible={visible}
          onCancel={() => {
            setVisible(false);
          }}
          onOk={handleAddAudios}
        />
      </View>
    </PageBackground>
  );
};

export default PlaylistDetails;
