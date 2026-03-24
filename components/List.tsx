import {
  divider,
  mainColor,
  onMainColor,
  overlayColor,
  surfacePrimary,
  textPrimary,
} from "@/constants/Colors";
import { AudioLike } from "@/context/types";
import { FontAwesome } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import ReAnimated, { FadeIn, FadeOut } from "react-native-reanimated";
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
  playlistGridContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 160,
    backgroundColor: "transparent",
  },
  playlistCardCell: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  playlistCard: {
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: surfacePrimary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: 'center',
    overflow: "hidden",
  },
  playlistName: {
    color: textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: overlayColor,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: mainColor,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: mainColor,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});

const List = ({
  type = "audioList",
  loading,
  data,
  playingUri,
  swipeActionsEnabled = true,
  handleListRightAction,
  handleListItemPress,
}: {
  type?: string;
  loading?: boolean;
  playingUri?: string;
  swipeActionsEnabled?: boolean;
  data: AudioLike[];
  handleListRightAction: (audio: AudioLike) => void;
  handleListItemPress: (audio: AudioLike) => void;
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isPlaylistGrid = type === "playlist";
  const playlistColumns = windowWidth >= 700 ? 3 : 2;
  const enableSwipeAction = swipeActionsEnabled && type === "audioList";
  const [activeDeleteKey, setActiveDeleteKey] = useState<string | null>(null);

  const getItemKey = (item: AudioLike) => String(item.id ?? item.uri ?? "");

  const renderAudioItem = ({
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

  const renderPlaylistCard = ({ item }: { item: AudioLike }) => {
    const key = getItemKey(item);
    const isDeleteActive = activeDeleteKey === key;

    return (
      <View style={styles.playlistCardCell}>
        <Pressable
          style={styles.playlistCard}
          onPress={() => {
            if (isDeleteActive) {
              setActiveDeleteKey(null);
              return;
            }
            handleListItemPress(item);
          }}
          onLongPress={() => {
            setActiveDeleteKey(key);
          }}
          delayLongPress={280}
        >
          <Text
            style={styles.playlistName}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {String(item.name ?? "")}
          </Text>
          {isDeleteActive ? (
            <ReAnimated.View
              style={styles.deleteOverlay}
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(140)}
            >
              <ReAnimated.View
                entering={FadeIn.duration(180).delay(40)}
                exiting={FadeOut.duration(120)}
              >
                <Pressable
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setActiveDeleteKey(null);
                    handleListRightAction(item);
                  }}
                >
                  <FontAwesome name="trash" size={18} color={onMainColor} />
                </Pressable>
              </ReAnimated.View>
            </ReAnimated.View>
          ) : null}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          key={isPlaylistGrid ? `playlist-grid-${playlistColumns}` : "audio-list"}
          style={styles.flashList}
          data={data}
          extraData={{ playingUri, type, playlistColumns }}
          renderItem={isPlaylistGrid ? renderPlaylistCard : renderAudioItem}
          numColumns={isPlaylistGrid ? playlistColumns : 1}
          keyExtractor={(item, index) =>
            String(item.id ?? item.uri ?? `row-${index}`)
          }
          contentContainerStyle={
            isPlaylistGrid ? styles.playlistGridContainer : styles.listContainer
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Empty type={type === "playlist" ? "playlist" : "audio"} />
          }
          ItemSeparatorComponent={
            isPlaylistGrid ? undefined : () => <View style={styles.divider} />
          }
        />
      )}
    </View>
  );
};

export default List;
