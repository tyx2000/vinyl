import Button from "@/components/Button";
import Empty from "@/components/Empty";
import Loading from "@/components/Loading";
import { mainColor } from "@/constants/Colors";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useLayoutEffect, useState } from "react";
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
});

const PlaylistDetails = () => {
  const { name, playlistId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
    });
  }, [navigation]);

  const getPlaylistAudios = async () => {
    setLoading(true);
    try {
      const [result] = await Promise.all([
        SecureStore.getItemAsync(playlistId as string),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
      if (result) {
        console.log(result);
      }
    } catch (error) {
      console.log("getPlaylistDetails error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPlaylistAudios();
  }, []);

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          data={audios}
          ListEmptyComponent={() => <Empty />}
          renderItem={({ item, index }) => <View></View>}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Button text="New playlist" onPress={() => {}} />
            </View>
          )}
        />
      )}
    </View>
  );
};

export default PlaylistDetails;
