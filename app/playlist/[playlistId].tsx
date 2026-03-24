import Header from "@/components/Header";
import List from "@/components/List";
import PageBackground from "@/components/PageBackground";
import { useGlobalContext } from "@/context/GlobalContext";
import { AudioItem } from "@/context/types";
import { normalizeAudioName, pickAudioFile } from "@/utils/helper";
import { File } from "expo-file-system";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

const PlaylistDetails = () => {
  const {
    playFromQueue,
    playingAudio,
    setPlayingAudio,
    currentPlaylist,
    setCurrentPlaylist,
    clearSleepTimer,
    playlistVersion,
    loadPlaylistAudios,
    addAudiosToPlaylist,
    removeAudioFromPlaylist,
  } = useGlobalContext();
  const { name, playlistId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [audios, setAudios] = useState<AudioItem[]>([]);

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

  const syncQueueAfterPlaylistChanged = (mergedAudios: AudioItem[]) => {
    const currentPlayingUri =
      typeof playingAudio.uri === "string" ? playingAudio.uri : "";
    const mergedUriSet = new Set(mergedAudios.map((audio) => audio.uri));
    const isCurrentQueueFromThisPlaylist =
      currentPlaylist.length > 0 &&
      currentPlaylist.every((audio) => mergedUriSet.has(audio.uri)) &&
      mergedUriSet.has(currentPlayingUri);

    if (isCurrentQueueFromThisPlaylist) {
      setCurrentPlaylist(mergedAudios);
    }
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
    if (typeof playlistId !== "string") return;
    setImporting(true);
    try {
      const pickedAudios = await pickAudioFile();
      if (!pickedAudios || pickedAudios.length === 0) return;

      const dedupedAudios: AudioItem[] = [];
      const uriSet = new Set<string>(audios.map((audio) => audio.uri));
      const signatureSet = new Set<string>(audios.map(getAudioSignature));

      pickedAudios.forEach((rawAudio) => {
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

      if (dedupedAudios.length === 0) return;

      const merged = await addAudiosToPlaylist(playlistId, dedupedAudios);
      setAudios(merged.audios);
      syncQueueAfterPlaylistChanged(merged.audios);
    } catch (error) {
      console.log("import audios error", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <PageBackground>
      <View style={{ flex: 1 }}>
        <Header
          name={name as string}
          handleRightButtonAction={() => {
            void handleImportAudios();
          }}
        />
        <List
          data={audios}
          loading={loading || importing}
          playingUri={
            typeof playingAudio.uri === "string" ? playingAudio.uri : undefined
          }
          handleListItemPress={(item) => {
            const targetIndex = audios.findIndex((audio) => audio.uri === item.uri);
            playFromQueue(audios, targetIndex < 0 ? 0 : targetIndex);
          }}
          handleListRightAction={(item) => {
            if (typeof playlistId !== "string" || typeof item.uri !== "string") {
              return;
            }
            const targetUri = item.uri;

            void (async () => {
              await removeAudioFromPlaylist(playlistId, targetUri);
              const nextAudios = audios.filter((audio) => audio.uri !== targetUri);
              setAudios(nextAudios);

              const isDeletingCurrentPlayingAudio =
                typeof playingAudio.uri === "string" &&
                playingAudio.uri === targetUri;
              if (isDeletingCurrentPlayingAudio) {
                setPlayingAudio({});
                setCurrentPlaylist([]);
                clearSleepTimer();
                return;
              }

              const sourceUriSet = new Set(audios.map((audio) => audio.uri));
              const isCurrentQueueFromThisPlaylist =
                currentPlaylist.length > 0 &&
                currentPlaylist.every((audio) => sourceUriSet.has(audio.uri));

              if (isCurrentQueueFromThisPlaylist) {
                setCurrentPlaylist(nextAudios);
              }
            })();
          }}
        />
      </View>
    </PageBackground>
  );
};

export default PlaylistDetails;
