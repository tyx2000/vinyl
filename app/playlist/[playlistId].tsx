import Header from "@/components/Header";
import List from "@/components/List";
import SelectAudioModal from "@/components/SelectAudioModal";
import { mainColor } from "@/constants/Colors";
import { useGlobalContext } from "@/context/GlobalContext";
import useMounted from "@/hooks/useMounted";
import { getLocalValue, minResolve, setLocalValue } from "@/utils/helper";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    // transform: [{ scale: 0.9 }],
  },
  footer: {
    height: 110,
    marginTop: 20,
    alignItems: "center",
  },
  footButton: {
    color: "#fff",
    borderRadius: 20,
    backgroundColor: mainColor,
    fontWeight: "bold",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  modalView: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

const PlaylistDetails = () => {
  const { setPlayingAudio } = useGlobalContext();
  const { name, playlistId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState<Record<string, string | number>[]>([]);
  const [visible, setVisible] = useState(false);

  const getPlaylistAudios = async () => {
    setLoading(true);
    try {
      const result = await minResolve(getLocalValue(playlistId as string));
      if (result) {
        setAudios(JSON.parse(result));
      }
    } catch (error) {
      console.log("getPlaylistDetails error", error);
    } finally {
      setLoading(false);
    }
  };

  useMounted(getPlaylistAudios);

  const handleAddAudios = async (audios: Record<string, string | number>[]) => {
    setVisible(false);
    if (audios && audios.length > 0) {
      await setLocalValue(playlistId + "", JSON.stringify(audios));
      setAudios(audios);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Header
        name={name as string}
        handleRightButtonAction={() => {
          setVisible(true);
        }}
      />
      <List
        data={audios}
        loading={loading}
        handleListItemPress={(item) => {
          setPlayingAudio(item);
        }}
        handleListRightAction={(item) => {}}
      />
      <SelectAudioModal
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        onOk={handleAddAudios}
      />
    </View>
  );
};

export default PlaylistDetails;
