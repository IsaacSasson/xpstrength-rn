import React from "react";
import { FlatList, Text } from "react-native";

// 1. Define an interface describing each post item
interface Post {
  id: number;
  // Add other properties if needed
}

// 2. Define the props for HorizontalList
interface HorizontalListProps {
  posts: Post[];
}

// 3. Create the typed component
const HorizontalList: React.FC<HorizontalListProps> = ({ posts }) => {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <Text className="text-3xl text-white">
          {item.id}
        </Text>
      )}
      horizontal
    />
  );
};

export default HorizontalList;
