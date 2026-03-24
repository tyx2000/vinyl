import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ToastType = "success" | "info" | "warn";

type ToastState = {
  id: number;
  message: string;
  type: ToastType;
};

type UiContextValue = {
  modalName: string;
  toast: ToastState | null;
  setModalName: Dispatch<SetStateAction<string>>;
  closeModal: () => void;
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  clearToast: () => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [modalName, setModalName] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeModal = () => {
    setModalName("");
  };

  const clearToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  };

  const showToast = (
    message: string,
    type: ToastType = "info",
    durationMs: number = 1800,
  ) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({
      id: Date.now(),
      message,
      type,
    });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, Math.max(800, durationMs));
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  return (
    <UiContext.Provider
      value={{
        modalName,
        toast,
        setModalName,
        closeModal,
        showToast,
        clearToast,
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
