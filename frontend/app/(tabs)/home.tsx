import { View, Text, FlatList, Image, RefreshControl, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/logo.png";
import SearchInput from "@/components/SearchInput";
import HorizontalList from "@/components/HorizontalList";
import EmptyState from "@/components/EmptyState";
import { getAllPosts } from "@/lib/appwrite";
import useAppwrite from "@/lib/useAppwrite";
import ImageCard from "@/components/ImageCard";


const Home = () => {
const { data: posts, refetch } = useAppwrite(getAllPosts);

const [refreshing, setRefreshing] = useState(false)
const onRefresh = async () => {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
}

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts as Array<{ $id: string; objectName: string }>}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <ImageCard image={item}/>
        )}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-6">
            <View className="justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">
                  Welcome Back
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  Wiiwho
                </Text>
              </View>
              <View className="">
                <Image
                source={logo}
                style={{
                  height: 57,
                  width: 200
                }}
                resizeMode="contain"
                />
              </View>
            </View>
            <SearchInput />

            <View className="w-ful flex-1 pt-5 pb-8">
                <Text className="text-gray-100 text-lg font-pregular mb-3">
                  Latest sigmas
                </Text>

              <HorizontalList posts={[{ id: 1}, { id: 2 }, {id: 3}]} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState 
          title="No Images Found"
          subtitle="Appraise Some Items To Fill Your Inventory"
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}
      />
    </SafeAreaView>
  );
};

export default Home;
