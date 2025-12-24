import { useGlobalContext } from "@/context/GlobalContext";
import { FlashList } from "@shopify/flash-list";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Playlist() {
  const { playlist, setPlaylist } = useGlobalContext();
  const [loading, setLoading] = useState(false);

  async function initPlaylist() {
    setLoading(true);
    try {
      const [result] = await Promise.all([
        SecureStore.getItemAsync("vinyl-playlist"),
        new Promise((resolve) => setTimeout(resolve, 800)),
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

  function renderItem({
    item,
    index,
  }: {
    index: number;
    item: {
      id: string;
      name: string;
      audios: { id: string; name: string; customName: string; uri: string }[];
    };
  }) {
    return <View>{index}</View>;
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={[]}
        renderItem={renderItem}
        ListEmptyComponent={<Text>空列表</Text>}
      />
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
});
