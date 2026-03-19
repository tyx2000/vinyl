import Header from "@/components/Header";
import List from "@/components/List";
import PageBackground from "@/components/PageBackground";
import { useGlobalContext } from "@/context/GlobalContext";
import useMounted from "@/hooks/useMounted";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function Playlist() {
  const router = useRouter();
  const { playlist, playlistLoading, loadPlaylists, setModalName } =
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
          handleListRightAction={(item) => {}}
        />
      </View>
    </PageBackground>
  );
}
