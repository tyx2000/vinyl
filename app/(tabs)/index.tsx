import Header from "@/components/Header";
import List from "@/components/List";
import { useGlobalContext } from "@/context/GlobalContext";
import { useFocusEffect } from "expo-router";
import { View } from "react-native";

const Home = () => {
  const {
    loading,
    audios,
    addAudios,
    setPlayingAudio,
    setOptionAudio,
    setModalName,
  } = useGlobalContext();

  useFocusEffect(() => {
    console.log("index focus effect");
  });

  return (
    <View style={{ flex: 1 }}>
      <Header name="Library" handleRightButtonAction={addAudios} />
      <List
        loading={loading}
        data={audios}
        handleListItemPress={(item) => {
          setPlayingAudio(item);
        }}
        handleListRightAction={(item: Record<string, string | number>) => {
          setOptionAudio(item);
          setModalName("audioOption");
        }}
      />
    </View>
  );
};

export default Home;
