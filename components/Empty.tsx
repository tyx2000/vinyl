import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function Empty({
  text,
  children,
}: {
  children?: ReactNode;
  text: string;
}) {
  return (
    <View style={styles.wrapper}>
      <Text>{text}</Text>
      {children}
    </View>
  );
}
