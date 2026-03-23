import {
  divider,
  mainColor,
  onMainColor,
  surfacePrimary,
  surfaceSecondary,
  textPrimary,
  textSecondary,
} from "@/constants/Colors";
import {
  NextIcon,
  NowPlayingIcon,
  PauseIcon,
  PlayIcon,
  PlayModeIcon,
  PreviousIcon,
  TimerIcon,
} from "@/components/icons/PlaybackIcons";
import { AudioItem, PlayMode } from "@/context/types";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ReAnimated, { FadeIn, FadeOut } from "react-native-reanimated";
import SleepTimerPicker from "./SleepTimerPicker";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 18,
    backgroundColor: "transparent",
  },
  queuePanel: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: surfacePrimary,
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
    backgroundColor: "rgba(240, 246, 252, 0.06)",
  },
  queueItemText: {
    flex: 1,
    color: textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  queueItemTextActive: {
    color: onMainColor,
    fontWeight: "700",
  },
  bottomPanel: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: surfacePrimary,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTransition: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionBtn: {
    backgroundColor: mainColor,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: surfaceSecondary,
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
    width: 42,
    height: 42,
    borderRadius: 999,
    // borderWidth: 1,
    // borderColor: divider,
    // backgroundColor: "#F3F5FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  playMode,
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
  playMode: PlayMode;
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
          <Text style={styles.queueHeaderTitle}>Playlist</Text>
          <Text style={styles.queueHeaderCount}>{queue.length}</Text>
        </View>
        <ScrollView
          style={styles.queueList}
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
                {active && <NowPlayingIcon size={24} color={onMainColor} animated={playing} />}
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
              <PreviousIcon size={24} color={textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bottomActionBtn, styles.mainActionBtn]}
              onPress={onTogglePlay}
            >
              <ReAnimated.View
                key={playing ? "pause" : "play"}
                entering={FadeIn.duration(140)}
                exiting={FadeOut.duration(140)}
                style={styles.iconTransition}
              >
                {playing ? (
                  <PauseIcon size={24} color={onMainColor} />
                ) : (
                  <PlayIcon size={24} color={onMainColor} />
                )}
              </ReAnimated.View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomActionBtn} onPress={onNext}>
              <NextIcon size={24} color={textPrimary} />
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
            {timerText === "Off" ? (
              <TimerIcon size={24} color={textPrimary} />
            ) : (
              <Text style={styles.infoButtonText}>{timerText}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.durationText}>
            {currentTimeLabel} / {durationLabel}
          </Text>

          <TouchableOpacity style={styles.infoButton} onPress={onCyclePlayMode}>
            <ReAnimated.View style={styles.iconTransition}>
              <PlayModeIcon mode={playMode} size={24} color={textPrimary} />
            </ReAnimated.View>
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
