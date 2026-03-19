import { bgEnd, bgStart } from "@/constants/Colors";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default function PageBackground({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={[bgStart, bgEnd]} style={styles.root}>
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}
