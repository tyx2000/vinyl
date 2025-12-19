// import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 80,
    backgroundColor: "#eee",
    position: "absolute",
  },
});

export default function PlayerFoot({ uri }: { uri: null | string }) {
  if (!uri) return null;
  const insets = useSafeAreaInsets();
  console.log(insets);

  // const audio = useAudioPlayer(uri);
  // const status = useAudioPlayerStatus(audio);

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 50 }]}>
      <Text></Text>
    </View>
  );
}
