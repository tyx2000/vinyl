import {
  divider,
  mainColor,
  onMainColor,
  textPrimary,
} from "@/constants/Colors";
import { AudioLike } from "@/context/types";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import ReAnimated, {
  Extrapolation,
  FadeInRight,
  FadeOutLeft,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

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
  itemActive: {
    backgroundColor: "rgba(240, 246, 252, 0.06)",
    borderRadius: 10,
  },
  audioInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  audioName: {
    flex: 1,
    color: textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  swipeRightActionWrap: {
    width: 96,
    height: "100%",
    paddingLeft: 10,
    justifyContent: 'center'
  },
  swipeRightAction: {
    width: "100%",
    height: '90%',
    borderRadius: 12,
    backgroundColor: mainColor,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeRightActionText: {
    color: onMainColor,
    fontSize: 13,
    fontWeight: "700",
  },
});

function SwipeRightAction({
  progress,
  translation,
  onPress,
}: {
  progress: SharedValue<number>;
  translation: SharedValue<number>;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const reveal = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const offset = interpolate(
      progress.value,
      [0, 1],
      [20, 0],
      Extrapolation.CLAMP,
    );
    const drag = Math.min(0, translation.value);

    return {
      opacity: reveal,
      transform: [{ translateX: offset + drag * 0.08 }],
    };
  });

  return (
    <ReAnimated.View style={animatedStyle}>
      <View style={styles.swipeRightActionWrap}>
        <TouchableOpacity
          style={styles.swipeRightAction}
          activeOpacity={0.88}
          onPress={onPress}
        >
          <Text style={styles.swipeRightActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ReAnimated.View>
  );
}

const ListItem = ({
  item,
  onPressItem,
  isActive = false,
  enableSwipeAction = false,
  onSwipeAction,
}: {
  item: AudioLike;
  onPressItem?: (item: AudioLike) => void;
  isActive?: boolean;
  enableSwipeAction?: boolean;
  onSwipeAction?: (item: AudioLike) => void;
}) => {
  const row = (
    <TouchableOpacity
      onPress={() => onPressItem && onPressItem(item)}
      activeOpacity={0.72}
    >
      <ReAnimated.View
        entering={FadeInRight.duration(220)}
        exiting={FadeOutLeft.duration(160)}
        style={[styles.item, isActive && styles.itemActive]}
      >
        <View style={styles.audioInfo}>
          <Text
            style={styles.audioName}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {item.name}
          </Text>
        </View>
      </ReAnimated.View>
    </TouchableOpacity>
  );

  if (!enableSwipeAction || !onSwipeAction) {
    return row;
  }

  return (
    <ReanimatedSwipeable
      overshootRight={false}
      rightThreshold={44}
      renderRightActions={(progress, translation, swipeableMethods: SwipeableMethods) => (
        <SwipeRightAction
          progress={progress}
          translation={translation}
          onPress={() => {
            swipeableMethods.close();
            onSwipeAction(item);
          }}
        />
      )}
    >
      {row}
    </ReanimatedSwipeable>
  );
};

export default ListItem;
