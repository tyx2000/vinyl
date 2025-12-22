// import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 60,
    backgroundColor: "#eee",
    position: "absolute",
    borderWidth: 1,
    borderColor: "purple",
  },
});

export default function PlayerFoot({
  playingAudio,
}: {
  playingAudio?: Record<string, string>;
}) {
  if (!playingAudio || !playingAudio.uri) return null;
  const insets = useSafeAreaInsets();
  console.log(insets);

  console.log({ playingAudio });

  // const audio = useAudioPlayer(uri);
  // const status = useAudioPlayerStatus(audio);

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 50 }]}>
      <Text></Text>
    </View>
  );
}
