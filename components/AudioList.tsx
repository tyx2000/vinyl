import { mainColor } from "@/constants/Colors";
import { useGlobalContext } from "@/context/GlobalContext";
import { FontAwesome } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { usePathname } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import AudioItem from "./AudioItem";
import Button from "./Button";
import Empty from "./Empty";
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

const AudioList = ({
  customData,
  showOptionModal,
  selectedAudios,
  setSelectedAudios,
}: {
  customData?: Record<string, string | number>[];
  showOptionModal?: Function;
  selectedAudios?: Record<string, string | number>[];
  setSelectedAudios?: Function;
}) => {
  const { loading, audios, pickAudios, setPlayingAudio } = useGlobalContext();
  const pathname = usePathname();

  const renderRightAction = (item: Record<string, string | number>) => {
    if (pathname === "/") {
      return (
        <TouchableOpacity
          style={styles.options}
          onPress={(e) => showOptionModal!(e, item)}
        >
          <FontAwesome size={24} name="ellipsis-v" />
        </TouchableOpacity>
      );
    } else {
      const selected = selectedAudios?.find((a) => a.uri === item.uri);
      return (
        <View style={styles.checkbox}>
          {selected && <FontAwesome size={18} name="check" />}
        </View>
      );
    }
  };

  const onPressItem = (item: Record<string, string | number>) => {
    if (pathname === "/") {
      setPlayingAudio(item);
    } else {
      const t = selectedAudios?.find((a) => a.uri === item.uri);
      const k = t
        ? selectedAudios?.filter((a) => a.uri !== item.uri)
        : [...(selectedAudios || []), item];
      console.log({ k });
      setSelectedAudios!(k);
    }
  };

  const renderItem = ({
    index,
    item,
  }: {
    index: number;
    item: Record<string, string>;
  }) => (
    <AudioItem
      item={{ ...item, index }}
      setPlayingAudio={setPlayingAudio}
      renderRightAction={renderRightAction}
      onPressItem={onPressItem}
    />
  );

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          data={customData || audios}
          renderItem={renderItem}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Empty />}
          ItemSeparatorComponent={() => <View style={styles.divider}></View>}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Button text="Add more" onPress={pickAudios} />
            </View>
          )}
        />
      )}
    </View>
  );
};

export default AudioList;
