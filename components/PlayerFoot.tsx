// import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { mainColor } from "@/constants/Colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AudioPlayer, AudioStatus, createAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReAnimated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    height: 60,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
    backgroundColor: "#fff",
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 1,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  playStatus: {
    flex: 1,
    gap: 10,
  },
  audioName: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 12,
  },
  playTime: {
    flexDirection: "row",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  playControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  controlIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  modalView: {},
  modalContent: {},
});

const formatSeconds = (s: number) => {
  const minutes = Math.floor(s / 60);
  const seconds = s - minutes * 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    seconds < 10 ? "0" : ""
  }${Math.floor(seconds)}`;
};

export default function PlayerFoot({
  playingAudio,
}: {
  playingAudio: Record<string, string>;
}) {
  const playerRef = useRef<AudioPlayer>(null);
  const durationRef = useRef<TextInput>(null);
  const currentTimeRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const togglePlayer = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (playerRef.current) {
      if (playing) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setPlaying((c) => !c);
    }
  };

  const nextAudio = (e: GestureResponderEvent) => {
    e.stopPropagation();
  };

  const updateTime = (type: "current" | "duration", seconds: number) => {
    const textRef = type === "current" ? currentTimeRef : durationRef;
    if (!textRef.current) return;
    textRef.current.setNativeProps({
      text: formatSeconds(seconds),
    });
  };

  const playerStatusUpdate = (status: AudioStatus) => {
    updateTime("current", status.currentTime);
    updateTime("duration", status.duration);
  };

  const initPlayer = () => {
    if (playingAudio.uri) {
      try {
        playerRef.current = createAudioPlayer(playingAudio.uri);
        playerRef.current.addListener(
          "playbackStatusUpdate",
          playerStatusUpdate,
        );
        // playerRef.current.play();
        // setPlaying(true);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const clearPlayer = () => {
    setPlaying(false);
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current.release();
    }
  };

  useEffect(() => {
    initPlayer();
    return () => {
      clearPlayer();
    };
  }, [JSON.stringify(playingAudio)]);

  if (!playingAudio || !playingAudio.uri) {
    return null;
  }

  return (
    <ReAnimated.View
      entering={FadeInRight.springify()}
      exiting={FadeOutLeft.springify()}
      style={[styles.wrapper, { bottom: insets.bottom + 60 }]}
    >
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <View style={styles.content}>
          <Text
            style={styles.audioName}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {playingAudio.name}
          </Text>
          <View style={styles.playControl}>
            <View style={styles.playTime}>
              <TextInput
                editable={false}
                style={styles.timeText}
                ref={currentTimeRef}
              ></TextInput>
              <TextInput editable={false} style={styles.timeText}>
                /
              </TextInput>
              <TextInput
                editable={false}
                style={styles.timeText}
                ref={durationRef}
              ></TextInput>
            </View>
            <Pressable onPress={togglePlayer} style={styles.controlIcon}>
              <FontAwesome
                size={24}
                color={mainColor}
                name={playing ? "pause" : "play"}
              />
            </Pressable>
            <Pressable onPress={nextAudio} style={styles.controlIcon}>
              <FontAwesome size={24} color={mainColor} name="forward" />
            </Pressable>
          </View>
        </View>
      </TouchableOpacity>
      <Modal animationType="none" visible={showModal}>
        <View style={styles.modalView}>
          <View style={styles.modalContent}></View>
        </View>
      </Modal>
    </ReAnimated.View>
  );
}
