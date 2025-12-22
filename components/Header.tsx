import { mainColor } from "@/constants/Colors";
import { useGlobalContext } from "@/context/GlobalContext";
import { usePathname } from "expo-router";
import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { pickAudios } = useGlobalContext();
  const [showModal, setShowModal] = useState(false);
  const isHome = pathname === "/";

  const translateY = useSharedValue(-250);

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
      setShowModal(true);
      translateY.value = withSpring(0);
    }
  };

  const handleModalActions = (action: string) => {
    if (action === "Cancel") {
      translateY.value = withSpring(-250, {}, (done) => {
        if (done) {
          // scheduleOnRN(() => {
          //   setShowModal(false);
          // });
          console.log("动画完成");
        }
      });
      setTimeout(() => {
        setShowModal(false);
      }, 300);
    } else {
    }
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{isHome ? "Library" : "Playlist"}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleHeaderButtonClick}
        >
          <Text style={styles.buttonText}>{isHome ? "ADD" : "NEW"}</Text>
        </TouchableOpacity>
      </View>
      <Modal
        transparent
        visible={showModal}
        animationType="none"
        onRequestClose={() => {
          setShowModal(false);
        }}
      >
        <View style={styles.modalView}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
          >
            <TextInput
              style={styles.playlistNameInput}
              textAlign="center"
              maxLength={12}
            />
            <View style={styles.modalActions}>
              {["Cancel", "OOOOK"].map((text) => (
                <TouchableOpacity
                  key={text}
                  onPress={() => handleModalActions(text)}
                >
                  <Text
                    style={[
                      styles.baseButton,
                      text === "Cancel" ? "" : styles.okButton,
                    ]}
                  >
                    {text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  button: {
    width: 60,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: mainColor,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
  modalView: {
    flex: 1,
  },
  modalContent: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  playlistNameInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: mainColor,
    borderRadius: 20,
    fontWeight: "bold",
    fontSize: 16,
  },
  modalActions: {
    marginTop: 35,
    flexDirection: "row",
    justifyContent: "center",
    gap: 50,
  },
  baseButton: {
    width: 90,
    textAlign: "center",
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: mainColor,
  },
  okButton: {
    backgroundColor: mainColor,
    color: "#fff",
  },
});
