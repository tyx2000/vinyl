import { divider, mainColor, textPrimary } from "@/constants/Colors";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity } from "react-native";
import ReAnimated, {
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  modalContent: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
    gap: 8,
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#FFFFFF",
  },
  option: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#F3F5FA",
    borderWidth: 1,
    borderColor: divider,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontWeight: "700",
    fontSize: 16,
    color: textPrimary,
  },
  closeOption: {
    backgroundColor: mainColor,
    borderColor: mainColor,
  },
  closeLabel: {
    color: "#fff",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,18,30,0.16)",
  },
});

const AudioOptionsModal = ({
  visible,
  origin,
  handleOptionAction,
}: {
  visible: boolean;
  origin: "library" | "playlist";
  handleOptionAction: (action: string) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wrapperBgc = useSharedValue("transparent");
  const translateY = useSharedValue(300);
  const optionActions =
    origin === "playlist"
      ? [
          { id: "delete", label: "Delete from list" },
          { id: "close", label: "Close" },
        ]
      : [
          { id: "delete", label: "Delete from library" },
          { id: "addTo", label: "Add to playlist" },
          { id: "close", label: "Close" },
        ];

  useEffect(() => {
    if (visible) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setModalVisible(true);
      wrapperBgc.value = withTiming("rgba(18, 18, 24, 0.22)");
      translateY.value = withSpring(0);
    } else {
      wrapperBgc.value = withTiming("transparent");
      translateY.value = withSpring(300);
      hideTimerRef.current = setTimeout(() => {
        setModalVisible(false);
        hideTimerRef.current = null;
      }, 300);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="none"
      visible={modalVisible}
      statusBarTranslucent
      navigationBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => {
        handleOptionAction("close");
      }}
    >
      <ReAnimated.View
        style={[
          styles.wrapper,
          { backgroundColor: wrapperBgc, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Pressable style={styles.backdrop} onPress={() => handleOptionAction("close")} />
        <ReAnimated.View
          style={[styles.modalContent, { transform: [{ translateY }] }]}
        >
          {optionActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.option, action.id === "close" && styles.closeOption]}
              onPress={() => handleOptionAction(action.id)}
            >
              <Text
                style={[
                  styles.optionLabel,
                  action.id === "close" && styles.closeLabel,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ReAnimated.View>
      </ReAnimated.View>
    </Modal>
  );
};

export default AudioOptionsModal;
