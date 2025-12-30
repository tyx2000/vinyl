import AudioItem from "@/components/AudioItem";
import AudioList from "@/components/AudioList";
import { mainColor, secondColor } from "@/constants/Colors";
import { useGlobalContext } from "@/context/GlobalContext";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  GestureResponderEvent,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReAnimated, {
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    height: 300,
    backgroundColor: "white",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
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
    gap: 10,
  },
  option: {
    width: "100%",
    height: 50,
    borderLeftWidth: 5,
    borderLeftColor: "purple",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  optionLabel: {
    fontWeight: "bold",
    fontSize: 18,
    color: mainColor,
  },
});

const OPTION_ACTIONS = [
  { id: "delete", label: "Delete from library" },
  { id: "addTo", label: "Add to playlist" },
  { id: "addToNewPlaylist", label: "New Playlist then add it" },
  { id: "close", label: "Close" },
];

const Home = () => {
  const { audios, setAudios, setPlayingAudio } = useGlobalContext();
  const [optionAudio, setOptionAudio] = useState<Record<string, string>>({});

  const translateY = useSharedValue(300);

  useFocusEffect(() => {
    console.log("index focus effect");
  });

  const moreOptions = (
    e: GestureResponderEvent,
    item: Record<string, string>,
  ) => {
    e.stopPropagation();
    setOptionAudio(item);
    translateY.value = withSpring(0);
  };

  const handleOptionAction = async (action: string) => {
    if (action === "delete") {
      const t = audios.filter(
        (a: Record<string, string>) => a.uri !== optionAudio.uri,
      );
      await SecureStore.setItemAsync("vinyl-library", JSON.stringify(t));
      await FileSystem.deleteAsync(optionAudio.uri);
      setAudios(t);

      setOptionAudio({});
    }
    if (action === "addTo") {
    }
    if (action === "addToNewPlaylist") {
    }
    if (action === "close") {
      translateY.value = withSpring(300, {}, (finished) => {
        if (finished) {
          console.log("动画完成");
        }
      });
      setTimeout(() => {
        setOptionAudio({});
      }, 300);
    }
  };

  return (
    <View style={styles.container}>
      <AudioList />
      <Modal
        transparent
        animationType="none"
        visible={!!optionAudio.uri}
        onRequestClose={() => {
          translateY.value = withSpring(300);
          setTimeout(() => {
            setOptionAudio({});
          }, 300);
        }}
      >
        <View style={styles.modalWrapper}>
          <ReAnimated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
          >
            {OPTION_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.option}
                onPress={() => handleOptionAction(action.id)}
              >
                <Text style={styles.optionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ReAnimated.View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;
