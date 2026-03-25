export type LockScreenRemoteAction =
  | "toggle"
  | "next"
  | "previous"
  | "play"
  | "pause";

export type LockScreenRemoteEvent = {
  action: LockScreenRemoteAction;
};

export type LockScreenSyncPayload = {
  title: string;
  artist?: string | null;
  albumTitle?: string | null;
  playing: boolean;
};

export type EventSubscriptionLike = {
  remove: () => void;
};

export declare function syncLockScreenControls(
  payload: LockScreenSyncPayload,
): Promise<void>;

export declare function clearLockScreenControls(): Promise<void>;

export declare function addRemoteActionListener(
  listener: (event: LockScreenRemoteEvent) => void,
): EventSubscriptionLike;
