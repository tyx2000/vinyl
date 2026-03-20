import { divider, mainColor, textPrimary, textSecondary } from "@/constants/Colors";
import { useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PRESET_OPTIONS = [15, 30, 60];

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,12,20,0.26)",
  },
  panel: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DEE2EB",
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  title: {
    color: textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  option: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    color: textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    paddingHorizontal: 12,
    color: textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  setBtn: {
    minWidth: 70,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mainColor,
    backgroundColor: mainColor,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  setBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  hint: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default function SleepTimerPicker({
  visible,
  initialMinutes,
  onClose,
  onApply,
}: {
  visible: boolean;
  initialMinutes: number | null;
  onClose: () => void;
  onApply: (minutes: number | null) => void;
}) {
  const [customMinutes, setCustomMinutes] = useState("");
  const keyboardOffset = useSharedValue(0);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardOffset.value }],
  }));

  useEffect(() => {
    if (!visible) {
      keyboardOffset.value = withTiming(0, {
        duration: 220,
        easing: Easing.inOut(Easing.quad),
      });
      return;
    }
    setCustomMinutes(initialMinutes ? String(initialMinutes) : "");

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;
      const nextOffset = Math.max(0, keyboardHeight - 56);
      keyboardOffset.value = withTiming(nextOffset, {
        duration: 240,
        easing: Easing.inOut(Easing.quad),
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = withTiming(0, {
        duration: 220,
        easing: Easing.inOut(Easing.quad),
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible, initialMinutes]);

  const applyCustom = () => {
    const minutes = Math.floor(Number(customMinutes));
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    onApply(minutes);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ReAnimated.View style={[styles.panel, panelStyle]}>
        <Text style={styles.title}>定时关闭</Text>
        <TouchableOpacity style={styles.option} onPress={() => onApply(null)}>
          <Text style={styles.optionText}>关闭定时器</Text>
        </TouchableOpacity>
        {PRESET_OPTIONS.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={styles.option}
            onPress={() => onApply(minutes)}
          >
            <Text style={styles.optionText}>{minutes} 分钟后</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.customRow}>
          <TextInput
            style={styles.input}
            value={customMinutes}
            onChangeText={setCustomMinutes}
            keyboardType="number-pad"
            placeholder="自定义分钟"
            placeholderTextColor="rgba(99,99,120,0.6)"
            maxLength={4}
          />
          <TouchableOpacity style={styles.setBtn} onPress={applyCustom}>
            <Text style={styles.setBtnText}>设置</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>播放列表结束后会自动关闭定时器</Text>
      </ReAnimated.View>
    </View>
  );
}
