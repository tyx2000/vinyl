import { onMainColor, textSecondary } from "@/constants/Colors";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "react-native";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  text: {
    color: textSecondary,
    fontWeight: "600",
  },
});

export default function Loading({ size }: { size?: "small" | "large" }) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size={size || "large"} animating color={onMainColor} />
      <Text style={styles.text}>Loading library...</Text>
    </View>
  );
}
