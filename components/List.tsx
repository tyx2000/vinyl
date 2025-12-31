import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";
import ListItem from "./ListItem";
import Loading from "./Loading";

const List = ({
  loading,
  data,
}: {
  loading: boolean;
  data: Record<string, string>[];
}) => {
  return (
    <View>
      {loading ? (
        <Loading />
      ) : (
        <FlashList
          data={data}
          renderItem={({ item, index }) => <ListItem item={item} />}
        />
      )}
    </View>
  );
};

export default List;
