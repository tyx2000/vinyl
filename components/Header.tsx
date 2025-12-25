import { useGlobalContext } from "@/context/GlobalContext";
import { usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "./Button";

export default function Header() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { pickAudios, setModalName } = useGlobalContext();
  const isHome = pathname === "/";

  // const requestMediaPermission = useCallback(async () => {
  //   try {
  //     const mediaPermission = await MediaLibrary.requestPermissionsAsync(
  //       false,
  //       ["audio"],
  //     );
  //     console.log(mediaPermission);
  //     if (!mediaPermission.granted) {
  //       Alert.alert("no permission");
  //       return false;
  //     }
  //     return true;
  //   } catch (error) {
  //     console.log("request permission failed", error);
  //     setErrorMsg("request permission failed");
  //     return false;
  //   }
  // }, []);

  const handleHeaderButtonClick = () => {
    if (isHome) {
      pickAudios();
    } else {
      setModalName("playlist");
    }
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{isHome ? "Library" : "Playlist"}</Text>
        <Button
          text={isHome ? "ADD" : "NEW"}
          onPress={handleHeaderButtonClick}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 100,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
