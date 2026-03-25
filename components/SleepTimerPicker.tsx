import {
  divider,
  overlayColor,
  surfacePrimary,
  surfaceSecondary,
  textPrimary,
} from "@/constants/Colors";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
});

export default function SleepTimerPicker({
  visible,
  onClose,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (minutes: number | null) => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.panel}>
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
      </View>
    </View>
  );
}
