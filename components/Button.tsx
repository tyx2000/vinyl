import { mainColor } from "@/constants/Colors";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: mainColor,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
});

const Button = ({ text, onPress }: { text: string; onPress: Function }) => (
  <TouchableOpacity style={styles.button} onPress={() => onPress}>
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

export default Button;
