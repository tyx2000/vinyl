import { mainColor } from "@/constants/Colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
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
    style={[
      styles.button,
      { backgroundColor: type === "link" ? "transparent" : mainColor },
    ]}
    onPress={() => onPress()}
  >
    <Text style={{ color: type === "link" ? mainColor : "#fff" }}>{text}</Text>
  </TouchableOpacity>
);

export default Button;
