import { mainColor, secondColor } from "@/constants/Colors";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ReAnimated, {
  FlipInEasyX,
  FlipOutEasyX,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

const styles = StyleSheet.create({
  item: {
    borderLeftWidth: 4,
    height: 45,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    backgroundColor: "#fafafa",
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
});

const ListItem = ({
  item,
  renderRightAction,
  onPressItem,
}: {
  item: Record<string, string | number>;
  onPressItem?: (item: Record<string, string | number>) => void;
  renderRightAction: (item: Record<string, string | number>) => ReactNode;
}) => {
  const color = (item.index as number) % 2 === 0 ? mainColor : secondColor;
  const rightActions = (
    progress: SharedValue<number>,
    drag: SharedValue<number>,
  ) => {
    const styleAnimation = useAnimatedStyle(() => {
      // console.log(progress.value, drag.value);
      return { transform: [{ translateX: drag.value + 50 }] };
    });
    return (
      <ReAnimated.View style={styleAnimation}>
        <Text>Text</Text>
      </ReAnimated.View>
    );
  };

  const longPressGesture = Gesture.LongPress().onEnd((e, success) => {
    if (success) {
      console.log(`longPressed for ${e.duration} ms`);
    }
  });

  return (
    <ReanimatedSwipeable
      friction={2}
      enableTrackpadTwoFingerGesture
      rightThreshold={40}
      renderRightActions={rightActions}
    >
      <GestureDetector gesture={longPressGesture}>
        <TouchableOpacity onPress={() => onPressItem && onPressItem(item)}>
          <ReAnimated.View
            entering={FlipInEasyX.springify()}
            exiting={FlipOutEasyX.springify()}
            style={[styles.item, { borderColor: color }]}
          >
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
            {renderRightAction(item)}
          </ReAnimated.View>
        </TouchableOpacity>
      </GestureDetector>
    </ReanimatedSwipeable>
  );
};

export default ListItem;
