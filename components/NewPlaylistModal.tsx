import { divider, mainColor, textPrimary } from "@/constants/Colors";
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
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(15,18,30,0.16)",
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#FFFFFF",
  },
  playlistNameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: divider,
    borderRadius: 14,
    backgroundColor: "#F3F5FA",
    color: textPrimary,
    fontWeight: "700",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalActions: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  baseButton: {
    width: "100%",
    textAlign: "center",
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    overflow: "hidden",
    fontWeight: "700",
    color: textPrimary,
  },
  okButton: {
    backgroundColor: mainColor,
    borderColor: mainColor,
    color: "#fff",
  },
  actionItem: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    width: "100%",
    fontSize: 22,
    fontWeight: "800",
    color: textPrimary,
    marginBottom: 12,
    letterSpacing: -0.4,
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
      setName("");
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
      setName("");
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
          <Text style={styles.title}>New Playlist</Text>
          <TextInput
            autoFocus
            style={styles.playlistNameInput}
            textAlign="left"
            maxLength={12}
            onChange={({ nativeEvent: { text } }) => {
              setName(text);
            }}
            placeholder="Name your playlist"
            placeholderTextColor="rgba(31, 31, 40, 0.4)"
            value={name}
          />
          <View style={styles.modalActions}>
            {["Cancel", "OK"].map((text) => (
              <TouchableOpacity
                key={text}
                style={styles.actionItem}
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
