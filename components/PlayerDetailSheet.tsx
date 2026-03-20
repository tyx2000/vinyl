import { divider, mainColor, textPrimary, textSecondary } from "@/constants/Colors";
import { AudioItem } from "@/context/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SleepTimerPicker from "./SleepTimerPicker";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 18,
    backgroundColor: "#fff",
  },
  queuePanel: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  queueHeader: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queueHeaderTitle: {
    color: textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  queueHeaderCount: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  queueList: {
    flex: 1,
  },
  queueListContent: {
    paddingVertical: 6,
  },
  queueItem: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  queueItemActive: {
    backgroundColor: "rgba(250, 45, 85, 0.08)",
  },
  queueItemText: {
    flex: 1,
    color: textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  queueItemTextActive: {
    color: mainColor,
    fontWeight: "700",
  },
  bottomPanel: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  bottomHeader: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bottomTitleWrap: {
    flex: 1,
    gap: 4,
  },
  bottomTitle: {
    color: textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  bottomSubTitle: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bottomActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionBtn: {
    backgroundColor: mainColor,
  },
  progressTouchArea: {
    width: "100%",
    height: 32,
    justifyContent: "center",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E1E5EE",
    overflow: "hidden",
  },
  progressCurrent: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: mainColor,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  infoButton: {
    minWidth: 96,
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  infoButtonText: {
    color: textPrimary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 56,
    textAlign: "center",
  },
  durationText: {
    color: textSecondary,
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 108,
    textAlign: "center",
  },
});

export default function PlayerDetailSheet({
  title,
  subtitle,
  queue,
  activeQueueIndex,
  playing,
  progressRatio,
  currentTimeLabel,
  durationLabel,
  timerText,
  modeLabel,
  modeIcon,
  timerPickerVisible,
  timerInitialMinutes,
  insetsTop,
  insetsBottom,
  onSelectQueue,
  onPrevious,
  onTogglePlay,
  onNext,
  onTrackLayout,
  onSeekByX,
  onSeekRelease,
  onOpenTimerPicker,
  onCloseTimerPicker,
  onApplyTimerMinutes,
  onCyclePlayMode,
}: {
  title: string;
  subtitle: string;
  queue: AudioItem[];
  activeQueueIndex: number;
  playing: boolean;
  progressRatio: number;
  currentTimeLabel: string;
  durationLabel: string;
  timerText: string;
  modeLabel: string;
  modeIcon: React.ComponentProps<typeof FontAwesome>["name"];
  timerPickerVisible: boolean;
  timerInitialMinutes: number | null;
  insetsTop: number;
  insetsBottom: number;
  onSelectQueue: (index: number) => void;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onTrackLayout: (width: number) => void;
  onSeekByX: (x: number) => void;
  onSeekRelease: () => void;
  onOpenTimerPicker: () => void;
  onCloseTimerPicker: () => void;
  onApplyTimerMinutes: (minutes: number | null) => void;
  onCyclePlayMode: () => void;
}) {
  return (
    <View
      style={[
        styles.root,
        { paddingTop: insetsTop + 10, paddingBottom: insetsBottom + 14 },
      ]}
    >
      <View style={styles.queuePanel}>
        <View style={styles.queueHeader}>
          <Text style={styles.queueHeaderTitle}>当前播放列表</Text>
          <Text style={styles.queueHeaderCount}>{queue.length} 首</Text>
        </View>
        <ScrollView
          style={styles.queueList}
          contentContainerStyle={styles.queueListContent}
          showsVerticalScrollIndicator={false}
        >
          {queue.map((item, index) => {
            const active = index === activeQueueIndex;
            return (
              <TouchableOpacity
                key={`${item.uri}-${index}`}
                style={[styles.queueItem, active && styles.queueItemActive]}
                onPress={() => onSelectQueue(index)}
              >
                <Text
                  style={[styles.queueItemText, active && styles.queueItemTextActive]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {item.name}
                </Text>
                {active && <FontAwesome name="volume-up" size={14} color={mainColor} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.bottomHeader}>
          <View style={styles.bottomTitleWrap}>
            <Text style={styles.bottomTitle} numberOfLines={1} ellipsizeMode="middle">
              {title}
            </Text>
            <Text style={styles.bottomSubTitle}>{subtitle}</Text>
          </View>
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.bottomActionBtn} onPress={onPrevious}>
              <FontAwesome size={20} color={textPrimary} name="backward" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bottomActionBtn, styles.mainActionBtn]}
              onPress={onTogglePlay}
            >
              <FontAwesome size={18} color="#fff" name={playing ? "pause" : "play"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomActionBtn} onPress={onNext}>
              <FontAwesome size={20} color={textPrimary} name="forward" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={styles.progressTouchArea}
          onLayout={(e) => onTrackLayout(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => onSeekByX(e.nativeEvent.locationX)}
          onResponderMove={(e) => onSeekByX(e.nativeEvent.locationX)}
          onResponderRelease={onSeekRelease}
          onResponderTerminate={onSeekRelease}
        >
          <View style={styles.progressTrack}>
            <View style={[styles.progressCurrent, { width: `${progressRatio * 100}%` }]} />
          </View>
        </View>

        <View style={styles.infoRow}>
          <TouchableOpacity style={styles.infoButton} onPress={onOpenTimerPicker}>
            <FontAwesome name="clock-o" size={14} color={textPrimary} />
            <Text style={styles.infoButtonText}>{timerText}</Text>
          </TouchableOpacity>

          <Text style={styles.durationText}>
            {currentTimeLabel} / {durationLabel}
          </Text>

          <TouchableOpacity style={styles.infoButton} onPress={onCyclePlayMode}>
            <FontAwesome name={modeIcon} size={14} color={textPrimary} />
            <Text style={styles.infoButtonText}>{modeLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SleepTimerPicker
        visible={timerPickerVisible}
        initialMinutes={timerInitialMinutes}
        onClose={onCloseTimerPicker}
        onApply={onApplyTimerMinutes}
      />
    </View>
  );
}
