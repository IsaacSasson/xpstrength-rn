import React, { useState } from "react";
import { View, StatusBar, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import TopBar from "@/components/TopBar";
import SearchInput from "@/components/SearchInput";
import Tabs from "@/components/TabList";
import FriendCard from "@/components/friends/FriendCard";
import pfptest from "@/assets/images/favicon.png";

// Mock data for friends
const mockFriends = [
  { id: '1', name: 'Wiiwho', level: 25, status: 'Online', lastActive: 'Now', workouts: 42 },
  { id: '2', name: 'Alex', level: 31, status: 'Online', lastActive: 'Now', workouts: 67 },
  { id: '3', name: 'Jordan', level: 19, status: 'Offline', lastActive: '2h ago', workouts: 23 },
  { id: '4', name: 'Taylor', level: 45, status: 'In Workout', lastActive: 'Now', workouts: 128 },
  { id: '5', name: 'Casey', level: 37, status: 'Offline', lastActive: '1d ago', workouts: 85 },
  { id: '6', name: 'Morgan', level: 22, status: 'Online', lastActive: 'Now', workouts: 31 },
];

// Mock data for friend requests
const mockRequests = [
  { id: '7', name: 'Riley', level: 15, status: 'Pending', lastActive: '3h ago' },
  { id: '8', name: 'Jamie', level: 28, status: 'Pending', lastActive: '1d ago' },
];

// Mock data for pending requests
const mockPending = [
  { id: '9', name: 'Quinn', level: 33, status: 'Pending', lastActive: '4h ago' },
];

const Friends = () => {
  // State to track the active tab
  const [activeTab, setActiveTab] = useState("Friends");
  const [searchQuery, setSearchQuery] = useState("");

  // Handler to change the active tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Render different content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "Friends":
        return (
          <View className="space-y-4">
            {mockFriends.length > 0 ? (
              <>
                <Text className="text-white font-pmedium text-base mb-2">My Friends ({mockFriends.length})</Text>
                <View className="bg-black-100 rounded-xl p-4 mb-4">
                  {mockFriends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      pfp={pfptest}
                      name={friend.name}
                      level={friend.level.toString()}
                      status={friend.status}
                      lastActive={friend.lastActive}
                      workouts={friend.workouts}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View className="items-center justify-center py-10">
                <FontAwesome5 name="user-friends" size={50} color="#A742FF" />
                <Text className="text-white font-pmedium text-center mt-4 text-lg">
                  No friends yet
                </Text>
                <Text className="text-gray-100 text-center mt-2">
                  Start adding friends to see them here
                </Text>
                <TouchableOpacity 
                  className="bg-secondary rounded-xl px-6 py-3 mt-6"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-pmedium">Find Friends</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      case "Requests":
        return (
          <View className="space-y-4">
            {mockRequests.length > 0 ? (
              <>
                <Text className="text-white font-pmedium text-base mb-2">Friend Requests ({mockRequests.length})</Text>
                <View className="bg-black-100 rounded-xl p-4">
                  {mockRequests.map((request) => (
                    <FriendCard
                      key={request.id}
                      pfp={pfptest}
                      name={request.name}
                      level={request.level.toString()}
                      status={request.status}
                      lastActive={request.lastActive}
                      showActions={true}
                      actionType="request"
                    />
                  ))}
                </View>
              </>
            ) : (
              <View className="items-center justify-center py-10">
                <FontAwesome5 name="user-check" size={50} color="#A742FF" />
                <Text className="text-white font-pmedium text-center mt-4 text-lg">
                  No friend requests
                </Text>
                <Text className="text-gray-100 text-center mt-2">
                  When someone sends you a friend request, it will appear here
                </Text>
              </View>
            )}
          </View>
        );
      case "Pending":
        return (
          <View className="space-y-4">
            {mockPending.length > 0 ? (
              <>
                <Text className="text-white font-pmedium text-base mb-2">Pending Requests ({mockPending.length})</Text>
                <View className="bg-black-100 rounded-xl p-4">
                  {mockPending.map((pending) => (
                    <FriendCard
                      key={pending.id}
                      pfp={pfptest}
                      name={pending.name}
                      level={pending.level.toString()}
                      status={pending.status}
                      lastActive={pending.lastActive}
                      showActions={true}
                      actionType="pending"
                    />
                  ))}
                </View>
              </>
            ) : (
              <View className="items-center justify-center py-10">
                <FontAwesome5 name="user-clock" size={50} color="#A742FF" />
                <Text className="text-white font-pmedium text-center mt-4 text-lg">
                  No pending requests
                </Text>
                <Text className="text-gray-100 text-center mt-2">
                  Requests you've sent will appear here until they're accepted
                </Text>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6">
          <TopBar 
            subtext={
              activeTab === "Friends" 
                ? `${mockFriends.length} Friends` 
                : activeTab === "Requests" 
                  ? `${mockRequests.length} Requests` 
                  : `${mockPending.length} Pending`
            } 
            title="Your Friends" 
            titleTop={true} 
          />
        </View>
      </SafeAreaView>

      <View className="px-4 mb-4">
        <SearchInput
          title="Search for friends"
          placeHolder="Search for friends"
          handleChangeText={(text) => setSearchQuery(text)}
          value={searchQuery}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-4"
        contentContainerStyle={{
          paddingBottom: 50, // Add extra padding for the tab bar
        }}
      >
        <Tabs
          tabs={["Friends", "Requests", "Pending"]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        {/* Render tab-specific content */}
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

export default Friends;