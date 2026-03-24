import { usePlayerContext } from "./PlayerContext";
import { usePlaylistContext } from "./PlaylistContext";
import { useUiContext } from "./UiContext";

export const useGlobalContext = () => {
  const playerContext = usePlayerContext();
  const playlistContext = usePlaylistContext();
  const uiContext = useUiContext();

  return {
    ...playerContext,
    ...playlistContext,
    ...uiContext,
  };
};
