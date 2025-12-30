import AudioList from "@/components/AudioList";
import Button from "@/components/Button";
import Empty from "@/components/Empty";
import Loading from "@/components/Loading";
import { mainColor } from "@/constants/Colors";
import useMounted from "@/hooks/useMounted";
import { getLocalValue, minResolve } from "@/utils/helper";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import ReAnimated, {
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    // transform: [{ scale: 0.9 }],
  },
  footer: {
    height: 110,
    marginTop: 20,
    alignItems: "center",
  },
  footButton: {
    color: "#fff",
    borderRadius: 20,
    backgroundColor: mainColor,
    fontWeight: "bold",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  modalView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    height: 600,
    backgroundColor: "#fff",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 10,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const PlaylistDetails = () => {
  const { name, playlistId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAudios, setSelectedAudios] = useState([]);

  const translateY = useSharedValue(700);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: name,
    });
  }, [navigation]);

  const getPlaylistAudios = async () => {
    setLoading(true);
    try {
      const result = await minResolve(getLocalValue(playlistId as string));
      if (result) {
        console.log(result);
      }
    } catch (error) {
      console.log("getPlaylistDetails error", error);
    } finally {
      setLoading(false);
    }
  };

  useMounted(getPlaylistAudios);

  const addSelectedAudioToPlaylist = async () => {};

  return (
    <View style={styles.wrapper}>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          data={audios}
          ListEmptyComponent={() => <Empty />}
          renderItem={({ item, index }) => <View></View>}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Button
                text="Add audios"
                onPress={() => {
                  setModalVisible(true);
                  translateY.value = withSpring(0);
                }}
              />
            </View>
          )}
        />
      )}
      <Modal
        transparent
        animationType="none"
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalView}>
          <ReAnimated.View
            style={[styles.modalContent, { transform: [{ translateY }] }]}
          >
            <View style={styles.actions}>
              <Button
                type="link"
                text="Cancel"
                onPress={() => {
                  translateY.value = withSpring(600);
                  setTimeout(() => {
                    setModalVisible(false);
                  }, 300);
                }}
              />
              <Button
                type="link"
                text="Okay"
                onPress={addSelectedAudioToPlaylist}
              />
            </View>
            <AudioList />
          </ReAnimated.View>
        </View>
      </Modal>
    </View>
  );
};

export default PlaylistDetails;
