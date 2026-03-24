import Header from "@/components/Header";
import List from "@/components/List";
import PageBackground from "@/components/PageBackground";
import { mainColor, onMainColor, overlayColor, textPrimary, textSecondary } from "@/constants/Colors";
import { useGlobalContext } from "@/context/GlobalContext";
import { usePlayerRuntimeContext } from "@/context/PlayerRuntimeContext";
import { AudioItem } from "@/context/types";
import { normalizeAudioName, pickAudioFile } from "@/utils/helper";
import { File } from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const styles = StyleSheet.create({
  importOverlay: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    borderRadius: 14,
    backgroundColor: overlayColor,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  importHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  importTitle: {
    color: textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  importMeta: {
    color: textSecondary,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  cancelButton: {
    alignSelf: "flex-end",
    borderRadius: 999,
    backgroundColor: mainColor,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: onMainColor,
    fontSize: 12,
    fontWeight: "700",
  },
});

const PlaylistDetails = () => {
  const {
    playFromQueue,
    playingAudio,
    setPlayingAudio,
    currentPlaylist,
    setCurrentPlaylist,
    playMode,
    clearSleepTimer,
    playlistVersion,
    runInImportSession,
    loadPlaylistAudios,
    addAudiosToPlaylist,
    removeAudioFromPlaylist,
    showToast,
  } = useGlobalContext();
  const { playing, currentTime, duration } = usePlayerRuntimeContext();
  const { name, playlistId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>([]);
  const [importProgress, setImportProgress] = useState({
    totalCount: 0,
    processedCount: 0,
    copiedCount: 0,
    failedCount: 0,
    skippedCount: 0,
  });
  const cancelImportRef = useRef(false);
  const playingUriRef = useRef<string>("");
  const playModeRef = useRef(playMode);

  const getPlaylistAudios = async () => {
    setLoading(true);
    try {
      if (typeof playlistId === "string") {
        const result = await loadPlaylistAudios(playlistId);
        setAudios(result);
      }
    } catch (error) {
      console.log("getPlaylistDetails error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getPlaylistAudios();
  }, [playlistId, playlistVersion]);

  useEffect(() => {
    playingUriRef.current =
      typeof playingAudio.uri === "string" ? playingAudio.uri : "";
  }, [playingAudio.uri]);

  useEffect(() => {
    playModeRef.current = playMode;
  }, [playMode]);

  const sortAudiosByName = (items: AudioItem[]) =>
    [...items].sort((a, b) =>
      normalizeAudioName(a.name, a.uri).localeCompare(
        normalizeAudioName(b.name, b.uri),
        undefined,
        { sensitivity: "base", numeric: true },
      ),
    );

  const orderedAudios = useMemo(() => sortAudiosByName(audios), [audios]);

  const syncQueueAfterPlaylistChanged = (mergedAudios: AudioItem[]) => {
    const mergedUriSet = new Set(mergedAudios.map((audio) => audio.uri));
    const currentPlayingUri = playingUriRef.current;

    setCurrentPlaylist((queue) => {
      const isCurrentQueueFromThisPlaylist =
        queue.length > 0 &&
        queue.every((audio) => mergedUriSet.has(audio.uri)) &&
        mergedUriSet.has(currentPlayingUri);

      if (!isCurrentQueueFromThisPlaylist) {
        return queue;
      }

      if (playModeRef.current !== "shuffle") {
        return sortAudiosByName(mergedAudios);
      }

      const preservedOrder = queue.filter((audio) => mergedUriSet.has(audio.uri));
      const preservedUriSet = new Set(preservedOrder.map((audio) => audio.uri));
      const appended = mergedAudios.filter((audio) => !preservedUriSet.has(audio.uri));
      for (let i = appended.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [appended[i], appended[j]] = [appended[j], appended[i]];
      }
      return [...preservedOrder, ...appended];
    });
  };

  const getAudioSignature = (audio: AudioItem) => {
    const file = new File(audio.uri);
    const size = file.exists && typeof file.size === "number" ? file.size : -1;
    const normalizedName = normalizeAudioName(audio.name, audio.uri)
      .trim()
      .toLowerCase();
    return `${normalizedName}::${size}`;
  };

  const handleImportAudios = async () => {
    if (typeof playlistId !== "string" || importing) return;
    setImporting(true);
    setImportProgress({
      totalCount: 0,
      processedCount: 0,
      copiedCount: 0,
      failedCount: 0,
      skippedCount: 0,
    });
    cancelImportRef.current = false;

    try {
      await runInImportSession(async () => {
        const importResult = await pickAudioFile({
          shouldCancel: () => cancelImportRef.current,
          onProgress: (progress) => {
            setImportProgress({
              totalCount: progress.totalCount,
              processedCount: progress.processedCount,
              copiedCount: progress.copiedCount,
              failedCount: progress.failedCount,
              skippedCount: progress.skippedCount,
            });
          },
        });

        if (!importResult || importResult.files.length === 0) {
          if (importResult?.cancelled) {
            showToast("Import cancelled", "info");
          }
          if (importResult && importResult.failedCount > 0) {
            Alert.alert(
              "Import incomplete",
              `${importResult.failedCount} file(s) failed to import.`,
            );
          }
          return;
        }

        const dedupedAudios: AudioItem[] = [];
        const uriSet = new Set<string>(audios.map((audio) => audio.uri));
        const signatureSet = new Set<string>(audios.map(getAudioSignature));

        importResult.files.forEach((rawAudio) => {
          const audio: AudioItem = {
            ...rawAudio,
            name: normalizeAudioName(rawAudio.name, rawAudio.uri),
          };
          const signature = getAudioSignature(audio);
          const duplicated = uriSet.has(audio.uri) || signatureSet.has(signature);

          if (duplicated) {
            const copiedFile = new File(audio.uri);
            if (copiedFile.exists) {
              copiedFile.delete();
            }
            return;
          }

          uriSet.add(audio.uri);
          signatureSet.add(signature);
          dedupedAudios.push(audio);
        });
        const duplicateAfterCopyCount =
          importResult.files.length - dedupedAudios.length;

        if (dedupedAudios.length === 0) {
          if (importResult.cancelled) {
            showToast("Import cancelled", "info");
          }
          return;
        }

        const merged = await addAudiosToPlaylist(playlistId, dedupedAudios);
        setAudios(merged.audios);
        syncQueueAfterPlaylistChanged(merged.audios);

        if (importResult.cancelled) {
          showToast(
            `Import cancelled (${importResult.processedCount}/${importResult.totalCandidateCount})`,
            "info",
          );
        }

        if (
          importResult.cancelled ||
          importResult.failedCount > 0 ||
          importResult.skippedCount > 0 ||
          duplicateAfterCopyCount > 0 ||
          merged.skippedCount > 0
        ) {
          Alert.alert(
            "Import summary",
            `Added to playlist: ${merged.addedCount}\nCancelled: ${importResult.cancelled ? "Yes" : "No"}\nProcessed: ${importResult.processedCount}/${importResult.totalCandidateCount}\nFailed copy: ${importResult.failedCount}\nUnsupported: ${importResult.skippedCount}\nDuplicate in current list: ${duplicateAfterCopyCount + merged.skippedCount}`,
          );
        }
      });
    } catch (error) {
      console.log("import audios error", error);
      const message =
        error instanceof Error &&
        error.message === "INSUFFICIENT_DISK_SPACE_FOR_IMPORT"
          ? "Not enough free storage space. Please import fewer files at a time."
          : "Import failed. Please try importing fewer files.";
      Alert.alert("Import failed", message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <PageBackground>
      <View style={{ flex: 1 }}>
        <Header
          name={name as string}
          rightButtonText={importing ? "Importing" : "Add"}
          rightButtonDisabled={importing}
          handleRightButtonAction={() => {
            void handleImportAudios();
          }}
        />
        <List
          data={orderedAudios}
          loading={loading}
          swipeActionsEnabled={!importing}
          playingUri={
            typeof playingAudio.uri === "string" ? playingAudio.uri : undefined
          }
          handleListItemPress={(item) => {
            if (importing) return;
            const targetIndex = orderedAudios.findIndex(
              (audio) => audio.uri === item.uri,
            );
            const currentPlayingUri =
              typeof playingAudio.uri === "string" ? playingAudio.uri : "";
            const isSameAudio = item.uri === currentPlayingUri;
            const playlistUriSet = new Set(orderedAudios.map((audio) => audio.uri));
            const isSamePlaylistQueue =
              currentPlaylist.length === orderedAudios.length &&
              currentPlaylist.every((audio) => playlistUriSet.has(audio.uri));
            const trackFinishedWhilePaused =
              !playing && duration > 0 && currentTime >= duration - 0.2;

            if (isSameAudio && isSamePlaylistQueue && !trackFinishedWhilePaused) {
              return;
            }
            playFromQueue(orderedAudios, targetIndex < 0 ? 0 : targetIndex);
          }}
          handleListRightAction={(item) => {
            if (importing) return;
            if (typeof playlistId !== "string" || typeof item.uri !== "string") {
              return;
            }
            const targetUri = item.uri;

            void (async () => {
              const previousAudios = await loadPlaylistAudios(playlistId);
              await removeAudioFromPlaylist(playlistId, targetUri);
              const nextAudios = await loadPlaylistAudios(playlistId);
              setAudios(nextAudios);

              const isDeletingCurrentPlayingAudio =
                typeof playingAudio.uri === "string" &&
                playingAudio.uri === targetUri;
              if (isDeletingCurrentPlayingAudio) {
                setPlayingAudio({});
                setCurrentPlaylist([]);
                clearSleepTimer();
                showToast("Playback stopped (current track was deleted)", "warn");
                return;
              }

              const sourceUriSet = new Set(
                previousAudios.map((audio) => audio.uri),
              );
              const latestSourceUriSet = new Set(
                nextAudios.map((audio) => audio.uri),
              );
              setCurrentPlaylist((queue) => {
                const isCurrentQueueFromThisPlaylist =
                  queue.length > 0 &&
                  queue.every((audio) => sourceUriSet.has(audio.uri));
                if (!isCurrentQueueFromThisPlaylist) {
                  return queue;
                }
                if (playModeRef.current === "shuffle") {
                  return queue.filter((audio) =>
                    latestSourceUriSet.has(audio.uri),
                  );
                }
                return sortAudiosByName(nextAudios);
              });
            })();
          }}
        />
        {importing ? (
          <View style={styles.importOverlay}>
            <View style={styles.importHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator size="small" color={onMainColor} />
                <Text style={styles.importTitle}>Importing local audio files</Text>
              </View>
              <Text style={styles.importMeta}>
                {importProgress.processedCount}/{importProgress.totalCount || "?"}
              </Text>
            </View>
            <Text style={styles.importMeta}>
              Copied: {importProgress.copiedCount}  Failed: {importProgress.failedCount}  Unsupported:{" "}
              {importProgress.skippedCount}
            </Text>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                cancelImportRef.current = true;
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </PageBackground>
  );
};

export default PlaylistDetails;
