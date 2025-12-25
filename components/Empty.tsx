import { StyleSheet, View } from "react-native";
import ReAnimated, { FlipInEasyY } from "react-native-reanimated";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  empty: {
    width: "80%",
    height: 300,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default function Empty() {
  return (
    <View style={styles.wrapper}>
      <ReAnimated.View
        entering={FlipInEasyY.springify()}
        style={styles.empty}
      ></ReAnimated.View>
    </View>
  );
}
