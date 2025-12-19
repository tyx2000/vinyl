import { createContext, useContext } from "react";

interface AudioItem {
  name: string;
  customName: string;
  uri: string;
}

interface GlobalContextProps {
  audios: AudioItem[];
  setAudios: Function;
  playingUri?: string;
  setPlayingUri?: Function;
  loading: boolean;
}

let values: GlobalContextProps = {
  audios: [],
  loading: true,
  setAudios: (params: AudioItem[]) => {},
};

export const GlobalContext = createContext(values);

export const useGlobalContext = () => useContext(GlobalContext);
