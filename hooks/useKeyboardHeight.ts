import { useEffect, useState } from "react";
import { Keyboard, KeyboardEvent, Platform } from "react-native";

export default function useKeyboardHeight(enabled = true) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const changeFrameEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : null;

    const handleKeyboardShow = (event: KeyboardEvent) => {
      const nextHeight = event.endCoordinates?.height ?? 0;
      setKeyboardHeight(Math.max(0, nextHeight));
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, handleKeyboardHide);
    const changeFrameSub = changeFrameEvent
      ? Keyboard.addListener(changeFrameEvent, handleKeyboardShow)
      : null;

    return () => {
      showSub.remove();
      hideSub.remove();
      changeFrameSub?.remove();
    };
  }, [enabled]);

  return keyboardHeight;
}
