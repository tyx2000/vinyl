import { divider, textPrimary } from "@/constants/Colors";
import { useGlobalContext } from "@/context/GlobalContext";
import { AudioItem } from "@/context/types";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import ReAnimated, {
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Button from "./Button";
import List from "./List";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,18,30,0.16)",
  },
  modalContent: {
    height: "76%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#FFFFFF",
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: divider,
    paddingBottom: 10,
  },
  title: {
    color: textPrimary,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
});

const SelectAudioModal = ({
  visible,
  onCancel,
  onOk,
}: {
  visible: boolean;
  onCancel: Function;
  onOk: (audios: AudioItem[]) => void;
}) => {
  const { audios } = useGlobalContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAudios, setSelectedAudios] = useState<AudioItem[]>([]);

  const wrapperBgc = useSharedValue("transparent");
  const translateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      setSelectedAudios([]);
      setModalVisible(true);
      wrapperBgc.value = withTiming("rgba(18, 18, 24, 0.2)");
      translateY.value = withSpring(0);
    } else {
      wrapperBgc.value = withTiming("transparent", {}, (finished) => {
        if (finished) {
          console.log("finished");
        }
      });
      translateY.value = withSpring(600);
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={modalVisible}
      onRequestClose={() => {
        return;
      }}
    >
      <ReAnimated.View
        style={[styles.wrapper, { backgroundColor: wrapperBgc }]}
      >
        <ReAnimated.View
          style={[styles.modalContent, { transform: [{ translateY }] }]}
        >
          <View style={styles.actions}>
            <Button
              type="link"
              text="Cancel"
              onPress={() => {
                setSelectedAudios([]);
                onCancel();
              }}
            />
            <Button
              type="link"
              text="Okay"
              onPress={() => {
                onOk(selectedAudios);
              }}
            />
          </View>
          <Text style={styles.title}>Select Songs</Text>
          <List
            type="selectAudio"
            data={audios}
            selectedData={selectedAudios}
            handleListItemPress={() => {}}
            handleListRightAction={(item) => {
              setSelectedAudios((current) => {
                const exists = current.some((audio) => audio.uri === item.uri);
                if (exists) {
                  return current.filter((audio) => audio.uri !== item.uri);
                }
                return [...current, item as AudioItem];
              });
            }}
          />
        </ReAnimated.View>
      </ReAnimated.View>
    </Modal>
  );
};

export default SelectAudioModal;
