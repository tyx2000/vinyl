import { mainColor } from "@/constants/Colors";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function Loading({ size }: { size?: "small" | "large" }) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size={size || "large"} animating color={mainColor} />
    </View>
  );
}
