import Header from "@/components/Header";
import List from "@/components/List";
import PageBackground from "@/components/PageBackground";
import { useGlobalContext } from "@/context/GlobalContext";
import { usePlayerRuntimeContext } from "@/context/PlayerRuntimeContext";
import { useFocusEffect } from "expo-router";
import { View } from "react-native";

const Home = () => {
  const {
    loading,
    audios,
    addAudios,
    playingAudio,
    playFromQueue,
    setOptionAudio,
    setOptionOrigin,
    setOptionPlaylistId,
    setModalName,
  } = useGlobalContext();
  const { playing } = usePlayerRuntimeContext();


  return (
    <PageBackground>
      <View style={{ flex: 1 }}>
        <Header name="Library" handleRightButtonAction={addAudios} />
        <List
          loading={loading}
          data={audios}
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
            setOptionOrigin("library");
            setOptionPlaylistId("");
            setModalName("audioOption");
          }}
        />
      </View>
    </PageBackground>
  );
};

export default Home;
