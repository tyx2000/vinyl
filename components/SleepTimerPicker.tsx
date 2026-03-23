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
import { Animated, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const PRESET_OPTIONS = [15, 30, 45, 60];

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
    backgroundColor: surfaceSecondary,
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
    backgroundColor: surfaceSecondary,
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
    color: onMainColor,
    fontSize: 13,
    fontWeight: "700",
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
  const keyboardHeight = useKeyboardHeight(visible);
  const keyboardOffset = Math.max(0, keyboardHeight - 150);
  const panelStyle = useMemo(
    () => ({
      transform: [{ translateY: -keyboardOffset }],
    }),
    [keyboardOffset],
  );

  useEffect(() => {
    if (!visible) return;
    setCustomMinutes(initialMinutes ? String(initialMinutes) : "");
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
      <Animated.View style={[styles.panel, panelStyle]}>
        <Text style={styles.title}>Sleep Timer</Text>
        <TouchableOpacity style={styles.option} onPress={() => onApply(null)}>
          <Text style={styles.optionText}>Turn Off</Text>
        </TouchableOpacity>
        {PRESET_OPTIONS.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={styles.option}
            onPress={() => onApply(minutes)}
          >
            <Text style={styles.optionText}>{minutes} mins</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.customRow}>
          <TextInput
            style={styles.input}
            value={customMinutes}
            onChangeText={setCustomMinutes}
            keyboardType="number-pad"
            placeholder="Custom mins"
            placeholderTextColor="rgba(163,174,200,0.62)"
            maxLength={2}
          />
          <TouchableOpacity style={styles.setBtn} onPress={applyCustom}>
            <Text style={styles.setBtnText}>Set</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
