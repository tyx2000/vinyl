import Header from "@/components/Header";
import List from "@/components/List";
import { useGlobalContext } from "@/context/GlobalContext";
import useMounted from "@/hooks/useMounted";
import { getLocalValue, minResolve } from "@/utils/helper";
import { useRouter } from "expo-router";
import { Fragment, useState } from "react";

export default function Playlist() {
  const router = useRouter();
  const { playlist, setPlaylist, setModalName } = useGlobalContext();
  const [loading, setLoading] = useState(false);

  async function initPlaylist() {
    setLoading(true);
    try {
      const result = await minResolve(getLocalValue("vinyl-playlist"));
      if (result) {
        setPlaylist(JSON.parse(result));
      }
    } catch (error) {
      console.log("init playlist error", error);
    } finally {
      setLoading(false);
    }
  }

  useMounted(initPlaylist);

  return (
    <Fragment>
      <Header
        name="Playlist"
        handleRightButtonAction={() => {
          setModalName("playlist");
        }}
      />
      <List
        type="playlist"
        data={playlist}
        loading={loading}
        handleListItemPress={(item) => {
          router.push(`/playlist/${item.id}?name=${item.name}`);
        }}
        handleListRightAction={(item) => {}}
      />
    </Fragment>
  );
}
