import {
  divider,
  onMainColor,
  textPrimary,
  textSecondary,
} from "@/constants/Colors";
import { NowPlayingIcon } from "@/components/icons/PlaybackIcons";
import { AudioLike } from "@/context/types";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReAnimated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

const styles = StyleSheet.create({
  item: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: divider,
  },
  audioInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  audioName: {
    flex: 1,
    color: textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  audioNameActive: {
    color: onMainColor,
  },
  dragHandler: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    opacity: 0.7,
  },
  dragIcon: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: textSecondary,
  },
  playingIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});

const ListItem = ({
  item,
  renderRightAction,
  onPressItem,
  isActive = false,
  isPlaying = false,
}: {
  item: AudioLike;
  onPressItem?: (item: AudioLike) => void;
  renderRightAction: (item: AudioLike) => ReactNode;
  isActive?: boolean;
  isPlaying?: boolean;
}) => {
  return (
    <TouchableOpacity
      onPress={() => onPressItem && onPressItem(item)}
      activeOpacity={0.72}
    >
      <ReAnimated.View
        entering={FadeInRight.duration(220)}
        exiting={FadeOutLeft.duration(160)}
        style={styles.item}
      >
        <View style={styles.audioInfo}>
          {isActive ? (
            <View style={styles.playingIcon}>
              <NowPlayingIcon size={24} color={onMainColor} animated={isPlaying} />
            </View>
          ) : (
            <View style={styles.dragHandler}>
              <View style={styles.dragIcon}></View>
              <View style={styles.dragIcon}></View>
            </View>
          )}
          <Text
            style={[styles.audioName, isActive && styles.audioNameActive]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {item.name}
          </Text>
        </View>
        {renderRightAction(item)}
      </ReAnimated.View>
    </TouchableOpacity>
  );
};

export default ListItem;
