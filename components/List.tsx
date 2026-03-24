import { AudioLike } from "@/context/types";
import { FlashList } from "@shopify/flash-list";
import { StyleSheet, View } from "react-native";
import Empty from "./Empty";
import ListItem from "./ListItem";
import Loading from "./Loading";

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 160,
    backgroundColor: "transparent",
  },
  flashList: {
    flex: 1,
    backgroundColor: "transparent",
  },
  divider: {
    height: 0,
  },
});

const List = ({
  type = "audioList",
  loading,
  data,
  playingUri,
  handleListRightAction,
  handleListItemPress,
}: {
  type?: string;
  loading?: boolean;
  playingUri?: string;
  data: AudioLike[];
  handleListRightAction: (audio: AudioLike) => void;
  handleListItemPress: (audio: AudioLike) => void;
}) => {
  const enableSwipeAction = type === "audioList" || type === "playlist";

  const renderItem = ({
    item,
    index,
  }: {
    item: AudioLike;
    index: number;
  }) => (
    <ListItem
      item={{ ...item, index }}
      onPressItem={handleListItemPress}
      isActive={typeof item.uri === "string" && item.uri === playingUri}
      enableSwipeAction={enableSwipeAction}
      onSwipeAction={enableSwipeAction ? handleListRightAction : undefined}
    />
  );

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          style={styles.flashList}
          data={data}
          extraData={{ playingUri, type }}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            String(item.id ?? item.uri ?? `row-${index}`)
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Empty type={type === "playlist" ? "playlist" : "audio"} />
          }
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
};

export default List;
