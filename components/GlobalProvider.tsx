import { GlobalContext } from "@/context/GlobalContext";
import * as SecureStore from "expo-secure-store";
import { ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import PlayerFoot from "./PlayerFoot";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: "relative",
  },
});

export default function GlobalProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState([]);
  const [playingUri, setPlayingUri] = useState<null | string>(null);

  async function initLibrary() {
    setLoading(true);
    try {
      const [lib] = await Promise.all([
        SecureStore.getItemAsync("vinyl-library"),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      if (lib) {
        console.log({ lib });
        setAudios(JSON.parse(lib));
      }
    } catch (error) {
      console.log("init lib error", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initLibrary();
  }, []);

  return (
    <GlobalContext.Provider
      value={{ setPlayingUri, audios, setAudios, loading }}
    >
      <View style={styles.wrapper}>
        {children}
        <PlayerFoot uri={playingUri} />
      </View>
    </GlobalContext.Provider>
  );
}
