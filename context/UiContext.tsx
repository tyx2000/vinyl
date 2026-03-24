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
  closeModal: () => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [modalName, setModalName] = useState("");

  const closeModal = () => {
    setModalName("");
  };

  return (
    <UiContext.Provider
      value={{
        modalName,
        setModalName,
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
