import { mainColor } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity } from "react-native";
import ReAnimated, {
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  { id: "close", label: "Close" },
];

const AudioOptionsModal = ({
  visible,
  handleOptionAction,
}: {
  visible: boolean;
  handleOptionAction: (action: string) => void;
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const wrapperBgc = useSharedValue("transparent");
  const translateY = useSharedValue(300);

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
      translateY.value = withSpring(300);
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
      </ReAnimated.View>
    </Modal>
  );
};

export default AudioOptionsModal;
