import { divider, textPrimary } from "@/constants/Colors";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button from "./Button";

export default function Header({
  name,
  handleRightButtonAction,
}: {
  name: string;
  handleRightButtonAction: () => void;
}) {
  const insets = useSafeAreaInsets();

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

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{name}</Text>
        <Button text="Add" onPress={handleRightButtonAction} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 112,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  content: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    // borderWidth: 1,
    // borderColor: "#DEE2EB",
    // backgroundColor: "#F3F5FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // borderBottomWidth: 1,
    // borderBottomColor: divider,
  },
  title: {
    color: textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
});
