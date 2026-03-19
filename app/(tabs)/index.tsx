import Header from "@/components/Header";
import List from "@/components/List";
import PageBackground from "@/components/PageBackground";
import { useGlobalContext } from "@/context/GlobalContext";
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
    setModalName,
  } = useGlobalContext();

  useFocusEffect(() => {
    console.log("index focus effect");
  });

  return (
    <PageBackground>
      <View style={{ flex: 1 }}>
        <Header name="Library" handleRightButtonAction={addAudios} />
        <List
          loading={loading}
          data={audios}
          playingUri={
            typeof playingAudio.uri === "string" ? playingAudio.uri : undefined
          }
          handleListItemPress={(item) => {
            const targetIndex = audios.findIndex((audio) => audio.uri === item.uri);
            playFromQueue(audios, targetIndex < 0 ? 0 : targetIndex);
          }}
          handleListRightAction={(item) => {
            setOptionAudio(item);
            setModalName("audioOption");
          }}
        />
      </View>
    </PageBackground>
  );
};

export default Home;
