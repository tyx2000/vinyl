import {
  divider,
  onMainColor,
  surfacePrimary,
  textPrimary,
} from "@/constants/Colors";
import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import ReAnimated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 90,
    alignItems: "center",
    zIndex: 1000,
    pointerEvents: "none",
  },
  banner: {
    minHeight: 48,
    maxWidth: "86%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: surfacePrimary,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    color: textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default function ToastBanner({
  message,
  type = "info",
}: {
  message: string;
  type?: "success" | "info" | "warn";
}) {
  const iconName =
    type === "success" ? "check-circle" : type === "warn" ? "exclamation-circle" : "info-circle";
  const iconColor = type === "warn" ? "#FF9F0A" : onMainColor;

  return (
    <View style={styles.wrapper}>
      <ReAnimated.View
        entering={FadeInDown.duration(220)}
        exiting={FadeOutDown.duration(180)}
        style={styles.banner}
      >
        <FontAwesome name={iconName} color={iconColor} size={16} />
        <Text style={styles.text}>{message}</Text>
      </ReAnimated.View>
    </View>
  );
}
