export type AudioItem = {
  name: string;
  uri: string;
};

export type AudioLike = {
  name?: string | number;
  uri?: string | number;
  [key: string]: string | number | undefined;
};

export type PlaylistItem = {
  id: string;
  name: string;
};

export type PlayMode = "loop" | "single";
