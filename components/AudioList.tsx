import { useGlobalContext } from "@/context/GlobalContext";
import useMounted from "@/hooks/useMounted";
import {
  getLocalValue,
  minResolve,
  pickAudioFile,
  setLocalValue,
} from "@/utils/helper";
import { FlashList } from "@shopify/flash-list";
import { usePathname } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import AudioItem from "./AudioItem";
import Button from "./Button";
import Empty from "./Empty";
import Loading from "./Loading";

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    flex: 1,
  },
  listContainer: {
    padding: 10,
  },
  divider: { height: 10 },
  footer: { height: 100, alignItems: "center", justifyContent: "center" },
});

const AudioList = () => {
  const pathname = usePathname();
  console.log({ pathname });
  const { setPlayingAudio } = useGlobalContext();
  const [audios, setAudios] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);

  const initAudioList = async () => {
    setLoading(true);
    try {
      const result = await minResolve(getLocalValue("vinyl-library"));
      if (result) {
        setAudios(JSON.parse(result));
      }
    } catch (error) {
      console.log("initAudioList error", error);
    } finally {
      setLoading(false);
    }
  };

  useMounted(initAudioList);

  const renderItem = ({
    index,
    item,
  }: {
    index: number;
    item: Record<string, string>;
  }) => (
    <AudioItem item={{ ...item, index }} setPlayingAudio={setPlayingAudio} />
  );

  const pickAudios = async () => {
    try {
      const files = await pickAudioFile();
      if (files) {
        const newAudios: Record<string, string>[] = [],
          uris = new Set();
        [...audios, ...files].forEach((a) => {
          if (uris.has(a.uri)) {
            return;
          } else {
            uris.add(a.uri);
            newAudios.push(a);
          }
        });

        await setLocalValue("vinyl-library", JSON.stringify(newAudios));
        setAudios(newAudios);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          data={audios}
          renderItem={renderItem}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Empty />}
          ItemSeparatorComponent={() => <View style={styles.divider}></View>}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Button text="Add more" onPress={pickAudios} />
            </View>
          )}
        />
      )}
    </View>
  );
};

export default AudioList;
