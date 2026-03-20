import { AudioLike } from "@/context/types";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

type UiContextValue = {
  modalName: string;
  setModalName: Dispatch<SetStateAction<string>>;
  optionAudio: AudioLike;
  setOptionAudio: Dispatch<SetStateAction<AudioLike>>;
  optionOrigin: "library" | "playlist";
  setOptionOrigin: Dispatch<SetStateAction<"library" | "playlist">>;
  optionPlaylistId: string;
  setOptionPlaylistId: Dispatch<SetStateAction<string>>;
  closeModal: () => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [modalName, setModalName] = useState("");
  const [optionAudio, setOptionAudio] = useState<AudioLike>({});
  const [optionOrigin, setOptionOrigin] = useState<"library" | "playlist">(
    "library",
  );
  const [optionPlaylistId, setOptionPlaylistId] = useState("");

  const closeModal = () => {
    setModalName("");
    setOptionAudio({});
    setOptionOrigin("library");
    setOptionPlaylistId("");
  };

  return (
    <UiContext.Provider
      value={{
        modalName,
        setModalName,
        optionAudio,
        setOptionAudio,
        optionOrigin,
        setOptionOrigin,
        optionPlaylistId,
        setOptionPlaylistId,
        closeModal,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUiContext() {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error("useUiContext must be used within UiProvider");
  }
  return context;
}
