import React, { useState } from "react";
import { View, StatusBar, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "@/components/TopBar";
import SearchInput from "@/components/SearchInput";
import Tabs from "@/components/TabList";
import UserFriend from "@/components/UserFriend";
import pfptest from "@/assets/images/favicon.png";

const Friends = () => {
  // State to track the active tab
  const [activeTab, setActiveTab] = useState("Friends");

  // Handler to change the active tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Render different content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "Friends":
        return <UserFriend name="Wiiwho" level="25" pfp={pfptest} />;
      case "Requests":
        return (
          <Text className="text-white text-lg"></Text>
        );
      case "Pending":
        return (
          <Text className="text-white text-lg"></Text>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="bg-primary flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      <View className="px-4 py-6">
        <TopBar subtext="250 Friends" title="Your Friends" titleTop={true} />
        <View className="mb-2">
          <SearchInput
            title="Search for friends"
            placeHolder="Search for friends"
            handleChangeText={(e) => console.log(e)}
            value=""
          />
        </View>
        <Tabs
          tabs={["Friends", "Requests", "Pending"]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        {/* Render tab-specific content */}
        <View className="mt-4">{renderTabContent()}</View>
      </View>
    </SafeAreaView>
  );
};

export default Friends;
