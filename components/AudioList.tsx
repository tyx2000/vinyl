import { mainColor, secondColor } from "@/constants/Colors";
import { FlashList } from "@shopify/flash-list";
import { ReactNode, useState } from "react";
import AudioItem from "./AudioItem";

const AudioList = ({
  sortable,
  onPress,
  renderRight,
}: {
  sortable: boolean;
  onPress: Function;
  renderRight: (item: Record<string, string>) => ReactNode;
}) => {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(false);

  const initAudioList = () => {};

  const renderItem = ({
    index,
    item,
  }: {
    index: number;
    item: Record<string, string>;
  }) => (
    <AudioItem item={item} color={index % 2 === 0 ? mainColor : secondColor} />
  );

  return <FlashList data={audios} renderItem={renderItem} />;
};

export default AudioList;
