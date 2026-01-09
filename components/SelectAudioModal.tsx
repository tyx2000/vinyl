import { useGlobalContext } from "@/context/GlobalContext";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
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
  },
  modalContent: {
    height: 600,
    backgroundColor: "#fff",
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
  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const SelectAudioModal = ({
  visible,
  onCancel,
  onOk,
}: {
  visible: boolean;
  onCancel: Function;
  onOk: (audios: Record<string, string | number>[]) => void;
}) => {
  const { audios } = useGlobalContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAudios, setSelectedAudios] = useState<
    Record<string, string | number>[]
  >([]);

  const wrapperBgc = useSharedValue("transparent");
  const translateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      wrapperBgc.value = withTiming("rgba(0, 0, 0, 0.5)");
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
          <List
            type="selectAudio"
            data={audios}
            selectedData={selectedAudios}
            handleListItemPress={() => {}}
            handleListRightAction={(item) => {
              setSelectedAudios((c: Record<string, string | number>[]) => [
                ...c,
                item,
              ]);
            }}
          />
        </ReAnimated.View>
      </ReAnimated.View>
    </Modal>
  );
};

export default SelectAudioModal;
