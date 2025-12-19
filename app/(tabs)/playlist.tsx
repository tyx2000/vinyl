import { FlashList } from "@shopify/flash-list";
import { StyleSheet, Text, View } from "react-native";

export default function Playlist() {
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
    <FlashList
      data={[]}
      renderItem={renderItem}
      ListEmptyComponent={<Text>空列表</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 20,
    borderColor: "#fff",
    backgroundColor: "lightyellow",
  },
});
