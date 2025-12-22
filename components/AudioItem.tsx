import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import ReAnimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { mainColor } from "@/constants/Colors";

const styles = StyleSheet.create({
  item: {
    borderLeftWidth: 4,
    borderColor: mainColor,
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

export default function AudioItem({
  item,
  moreOptions,
  setPlayingAudio,
}: {
  item: Record<string, string>;
  moreOptions: Function;
  setPlayingAudio: Function;
}) {
  const rightActions = (
    progress: SharedValue<number>,
    drag: SharedValue<number>,
  ) => {
    const styleAnimation = useAnimatedStyle(() => {
      console.log(progress.value, drag.value);
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
        <Pressable onPress={() => setPlayingAudio(item)}>
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
          </View>
        </Pressable>
      </GestureDetector>
    </ReanimatedSwipeable>
  );
}
