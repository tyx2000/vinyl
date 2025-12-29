import Button from "@/components/Button";
import Empty from "@/components/Empty";
import Loading from "@/components/Loading";
import PlaylistItem from "@/components/PlaylistItem";
import { mainColor, secondColor } from "@/constants/Colors";
import { useGlobalContext } from "@/context/GlobalContext";
import { FlashList } from "@shopify/flash-list";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function Playlist() {
  const { playlist, setPlaylist, setModalName } = useGlobalContext();
  const [loading, setLoading] = useState(false);

  async function initPlaylist() {
    setLoading(true);
    try {
      const [result] = await Promise.all([
        SecureStore.getItemAsync("vinyl-playlist"),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
      if (result) {
        setPlaylist(JSON.parse(result));
      }
    } catch (error) {
      console.log("init playlist error", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initPlaylist();
  }, []);

  function renderItem({
    item,
    index,
  }: {
    index: number;
    item: Record<string, string>;
  }) {
    return (
      <PlaylistItem
        item={item}
        color={index % 2 === 0 ? mainColor : secondColor}
        moreOptions={() => {}}
        onPress={() => {}}
      />
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          data={playlist}
          renderItem={renderItem}
          ListEmptyComponent={<Empty />}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Button
                text="New playlist"
                onPress={() => setModalName("playlist")}
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.divider}></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
  },
  divider: {
    height: 5,
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
