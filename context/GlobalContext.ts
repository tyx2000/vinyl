import { useLibraryContext } from "./LibraryContext";
import { usePlayerContext } from "./PlayerContext";
import { usePlaylistContext } from "./PlaylistContext";
import { useUiContext } from "./UiContext";

export const useGlobalContext = () => {
  const libraryContext = useLibraryContext();
  const playerContext = usePlayerContext();
  const playlistContext = usePlaylistContext();
  const uiContext = useUiContext();

  return {
    ...libraryContext,
    ...playerContext,
    ...playlistContext,
    ...uiContext,
  };
};
