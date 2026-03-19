import { mainColor, textSecondary } from "@/constants/Colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const styles = StyleSheet.create({
  button: {
    minWidth: 72,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  solid: {
    backgroundColor: mainColor,
    shadowColor: mainColor,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  link: {
    backgroundColor: "transparent",
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
});

const Button = ({
  type,
  text,
  onPress,
}: {
  type?: "link" | "solid";
  text: string;
  onPress: Function;
}) => (
  <TouchableOpacity
    style={[styles.button, type === "link" ? styles.link : styles.solid]}
    onPress={() => onPress()}
    activeOpacity={0.75}
  >
    <Text style={[styles.text, { color: type === "link" ? textSecondary : "#fff" }]}>
      {text}
    </Text>
  </TouchableOpacity>
);

export default Button;
