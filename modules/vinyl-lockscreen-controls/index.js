import { EventEmitter, requireOptionalNativeModule } from "expo-modules-core";

const NativeModule = requireOptionalNativeModule("VinylLockScreen");
const emitter = NativeModule ? new EventEmitter(NativeModule) : null;

export function syncLockScreenControls({
  title,
  artist,
  albumTitle,
  playing,
}) {
  if (!NativeModule) return Promise.resolve();
  return NativeModule.sync(
    String(title ?? ""),
    artist ? String(artist) : null,
    albumTitle ? String(albumTitle) : null,
    Boolean(playing),
  );
}

export function clearLockScreenControls() {
  if (!NativeModule) return Promise.resolve();
  return NativeModule.deactivate();
}

export function addRemoteActionListener(listener) {
  if (!emitter) {
    return { remove() {} };
  }
  return emitter.addListener("onRemoteAction", listener);
}
