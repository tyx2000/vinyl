import { divider, mainColor, textPrimary, textSecondary } from "@/constants/Colors";
import { PlaylistItem } from "@/context/types";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    paddingBottom: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,18,30,0.16)",
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#DEE2EB",
    minHeight: 280,
    backgroundColor: "#FFFFFF",
  },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subHeader: {
    color: textSecondary,
    marginBottom: 8,
  },
  playlistItem: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  playlistName: {
    color: textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  includedTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(250, 45, 85, 0.12)",
  },
  includedText: {
    color: mainColor,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyBox: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyText: {
    color: textSecondary,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: divider,
    backgroundColor: "#F3F5FA",
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimary: {
    borderColor: mainColor,
    backgroundColor: mainColor,
  },
  actionText: {
    color: textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  actionPrimaryText: {
    color: "#fff",
  },
});

export default function AddToPlaylistModal({
  visible,
  playlists,
  loading,
  onReload,
  onCancel,
  onSelectPlaylist,
  onCreatePlaylist,
  includedPlaylistIds = [],
}: {
  visible: boolean;
  playlists: PlaylistItem[];
  loading?: boolean;
  onReload: () => Promise<void> | void;
  onCancel: () => void;
  onSelectPlaylist: (playlistId: string) => void;
  onCreatePlaylist: () => void;
  includedPlaylistIds?: string[];
}) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperBgc = useSharedValue("transparent");
  const translateY = useSharedValue(340);

  useEffect(() => {
    if (visible) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      onReload();
      setModalVisible(true);
      wrapperBgc.value = withTiming("rgba(18, 18, 24, 0.22)");
      translateY.value = withSpring(0);
    } else {
      wrapperBgc.value = withTiming("transparent");
      translateY.value = withSpring(340);
      hideTimerRef.current = setTimeout(() => {
        setModalVisible(false);
        hideTimerRef.current = null;
      }, 260);
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
      onRequestClose={onCancel}
    >
      <ReAnimated.View
        style={[
          styles.wrapper,
          { backgroundColor: wrapperBgc, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <ReAnimated.View
          style={[styles.modalContent, { transform: [{ translateY }] }]}
        >
          <Text style={styles.header}>Add to Playlist</Text>
          <Text style={styles.subHeader}>Choose a target playlist</Text>

          {playlists.length > 0 ? (
            playlists.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.playlistItem}
                onPress={() => onSelectPlaylist(item.id)}
              >
                <View style={styles.playlistRow}>
                  <Text style={styles.playlistName}>{item.name}</Text>
                  {includedPlaylistIds.includes(item.id) && (
                    <View style={styles.includedTag}>
                      <Text style={styles.includedText}>Already added</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {loading ? "Loading playlists..." : "No playlist yet."}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.actionBtn} onPress={onCancel}>
              <Text style={styles.actionText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={onCreatePlaylist}
            >
              <Text style={[styles.actionText, styles.actionPrimaryText]}>
                New Playlist
              </Text>
            </TouchableOpacity>
          </View>
        </ReAnimated.View>
      </ReAnimated.View>
    </Modal>
  );
}
