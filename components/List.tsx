import {
  divider,
  onMainColor,
  surfaceSecondary,
  textSecondary,
} from "@/constants/Colors";
import { AudioLike } from "@/context/types";
import { FontAwesome } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { StyleSheet, TouchableOpacity, View } from "react-native";
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
  options: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: surfaceSecondary,
    borderWidth: 1,
    borderColor: divider,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: textSecondary,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
});

const List = ({
  type = "audioList",
  loading,
  data,
  selectedData = [],
  playingUri,
  isPlaying = false,
  handleListRightAction,
  handleListItemPress,
}: {
  type?: string;
  loading?: boolean;
  selectedData?: AudioLike[];
  playingUri?: string;
  isPlaying?: boolean;
  data: AudioLike[];
  handleListRightAction: (audio: AudioLike) => void;
  handleListItemPress: (audio: AudioLike) => void;
}) => {
  const renderRightAction = (item: AudioLike) => {
    if (type === "audioList") {
      return (
        <TouchableOpacity
          style={styles.options}
          onPress={(e) => {
            e.stopPropagation();
            handleListRightAction(item);
          }}
        >
          <FontAwesome size={16} color={onMainColor} name="ellipsis-h" />
        </TouchableOpacity>
      );
    }
    if (type === "selectAudio") {
      const selected = selectedData.find((a) => a.uri === item.uri);
      return (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleListRightAction(item);
          }}
        >
          <View style={styles.checkbox}>
            {selected && <FontAwesome size={14} color={onMainColor} name="check" />}
          </View>
        </TouchableOpacity>
      );
    }
  };

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
      renderRightAction={renderRightAction}
      isActive={typeof item.uri === "string" && item.uri === playingUri}
      isPlaying={isPlaying}
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
          extraData={{ playingUri, isPlaying, selectedCount: selectedData.length, type }}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            String(item.id ?? item.uri ?? `row-${index}`)
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Empty />}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
};

export default List;
