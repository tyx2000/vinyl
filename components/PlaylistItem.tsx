import { FontAwesome } from "@expo/vector-icons";
import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ReAnimated, {
  SharedValue,
  SlideInLeft,
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

const PlaylistItem = ({
  item,
  color,
  moreOptions,
  onPress,
}: {
  color: string;
  item: Record<string, string>;
  moreOptions: Function;
  onPress: Function;
}) => {
  const rightActions = (
    progress: SharedValue<number>,
    drag: SharedValue<number>,
  ) => {
    const styleAnimation = useAnimatedStyle(() => {
      return { transform: [{ translateX: drag.value + 50 }] };
    });
    return (
      <ReAnimated.View style={styleAnimation}>
        <Text>text</Text>
      </ReAnimated.View>
    );
  };

  const longPressGesture = Gesture.LongPress().onEnd((e, success) => {
    if (success) {
      console.log(`long pressed for ${e.duration} ms`);
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
        <Link href={`/playlist/${item.id}?name=${item.name}`}>
          <ReAnimated.View
            entering={SlideInLeft.springify()}
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
            <TouchableOpacity
              style={{
                width: 30,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={(e) => moreOptions(e, item)}
            >
              <FontAwesome size={24} name="ellipsis-v" />
            </TouchableOpacity>
          </ReAnimated.View>
        </Link>
      </GestureDetector>
    </ReanimatedSwipeable>
  );
};

export default PlaylistItem;
