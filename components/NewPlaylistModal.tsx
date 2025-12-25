import { mainColor } from "@/constants/Colors";
import { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReAnimated, {
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const styles = StyleSheet.create({
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

const NewPlaylistModal = ({
  visible,
  onCancel,
  onOk,
}: {
  visible: boolean;
  onCancel: Function;
  onOk: Function;
}) => {
  const translateY = useSharedValue(-250);
  const [name, setName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const handleModalActions = (action: string) => {
    if (action === "Cancel") {
      translateY.value = withSpring(-250, {}, (done) => {
        if (done) {
          console.log("动画完成");
        }
      });
      setTimeout(() => {
        onCancel();
      }, 300);
    } else {
      onOk(name);
    }
  };

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateY.value = withSpring(0);
    } else {
      translateY.value = withSpring(-250);
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
    return () => {
      console.log("effect return");
    };
  }, [visible]);

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={() => {
        onCancel();
      }}
    >
      <View style={styles.modalView}>
        <ReAnimated.View
          style={[styles.modalContent, { transform: [{ translateY }] }]}
        >
          <TextInput
            autoFocus
            style={styles.playlistNameInput}
            textAlign="center"
            maxLength={12}
            onChange={({ nativeEvent: { text } }) => {
              setName(text);
            }}
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
        </ReAnimated.View>
      </View>
    </Modal>
  );
};

export default NewPlaylistModal;
