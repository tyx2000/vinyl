import { mainColor } from "@/constants/Colors";
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
    padding: 10,
  },
  divider: {
    height: 10,
  },
  footer: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  options: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: mainColor,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
});

const footButtonText: Record<string, string> = {
  audioList: "Add more",
  playlist: "New playlist",
  selectAudio: "Add more",
};

const List = ({
  type = "audioList",
  loading,
  data,
  selectedData = [],
  handleListRightAction,
  handleListItemPress,
}: {
  type?: string;
  loading?: boolean;
  selectedData?: Record<string, string | number>[];
  data: Record<string, string>[];
  handleListRightAction: (audio: Record<string, string | number>) => void;
  handleListItemPress: (audio: Record<string, string | number>) => void;
}) => {
  const renderRightAction = (item: Record<string, string | number>) => {
    if (type === "audioList") {
      return (
        <TouchableOpacity
          style={styles.options}
          onPress={(e) => {
            e.stopPropagation();
            handleListRightAction(item);
          }}
        >
          <FontAwesome size={24} name="ellipsis-v" />
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
            {selected && <FontAwesome size={18} name="check" />}
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: Record<string, string | number>;
    index: number;
  }) => (
    <ListItem
      item={{ ...item, index }}
      onPressItem={handleListItemPress}
      renderRightAction={renderRightAction}
    />
  );

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Empty />}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      )}
    </View>
  );
};

export default List;
