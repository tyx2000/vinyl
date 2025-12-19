import Empty from "@/components/Empty";
import Loading from "@/components/Loading";
import { useGlobalContext } from "@/context/GlobalContext";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    height: 50,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  audioInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  audioName: {
    flex: 1,
    height: 40,
    lineHeight: 40,
    fontWeight: "bold",
  },
  dragHandler: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  dragIcon: {
    width: 16,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },
  divider: {
    marginVertical: 5,
  },
  listContent: {
    flex: 1,
    padding: 10,
  },
});

export default function Home() {
  const { audios, loading } = useGlobalContext();
  const [showModal, setShowModal] = useState(false);

  if (loading) {
    return <Loading></Loading>;
  }

  function moreOptions(e: GestureResponderEvent) {
    e.stopPropagation();
  }

  function playAudio(uri: string) {
    console.log(uri);
  }

  function renderItem({
    item,
  }: {
    item: { name: string; customName: string; uri: string };
  }) {
    return (
      <TouchableOpacity onPress={() => playAudio(item.uri)}>
        <View style={styles.item}>
          <View style={styles.audioInfo}>
            <View style={styles.dragHandler}>
              <View style={styles.dragIcon}></View>
              <View style={styles.dragIcon}></View>
            </View>
            <Text
              style={styles.audioName}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {item.name}
            </Text>
          </View>
          <TouchableOpacity onPress={moreOptions}>
            <FontAwesome size={24} name="ellipsis-v" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.container}>
      <FlashList
        data={audios}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Empty text="Empty Library"></Empty>}
        ItemSeparatorComponent={() => <View style={styles.divider}></View>}
      />
    </View>
  );
}
