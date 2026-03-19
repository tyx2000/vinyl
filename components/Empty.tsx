import { textSecondary } from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";
import ReAnimated from "react-native-reanimated";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  empty: {
    width: "100%",
    minHeight: 180,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#F3F5FA",
  },
  message: {
    color: textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default function Empty() {
  return (
    <View style={styles.wrapper}>
      <ReAnimated.View style={styles.empty}>
        <Text style={styles.message}>No songs yet. Import from your library.</Text>
      </ReAnimated.View>
    </View>
  );
}
