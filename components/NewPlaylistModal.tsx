import {
  divider,
  mainColor,
  onMainColor,
  overlayColor,
  surfacePrimary,
  surfaceSecondary,
  textPrimary,
} from "@/constants/Colors";
import useKeyboardHeight from "@/hooks/useKeyboardHeight";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: overlayColor,
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: surfacePrimary,
    padding: 16,
  },
  playlistNameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: divider,
    borderRadius: 14,
    backgroundColor: surfaceSecondary,
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
    backgroundColor: surfaceSecondary,
    overflow: "hidden",
    fontWeight: "700",
    color: textPrimary,
  },
  okButton: {
    backgroundColor: mainColor,
    borderColor: mainColor,
    color: onMainColor,
  },
  actionItem: {
    flex: 1,
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
  const [name, setName] = useState("");
  const keyboardHeight = useKeyboardHeight(visible);
  const keyboardOffset = Math.max(0, keyboardHeight - 150);
  const panelStyle = useMemo(
    () => ({
      transform: [{ translateY: -keyboardOffset }],
    }),
    [keyboardOffset],
  );

  const handleModalActions = (action: string) => {
    if (action === "Cancel") {
      setName("");
      onCancel();
    } else {
      onOk(name);
      setName("");
    }
  };

  useEffect(() => {
    if (!visible) {
      setName("");
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => {
        onCancel();
      }}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => handleModalActions("Cancel")} />
        <Animated.View style={[styles.panel, panelStyle]}>
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
            placeholderTextColor="rgba(163,174,200,0.6)"
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
        </Animated.View>
      </View>
    </Modal>
  );
};

export default NewPlaylistModal;
