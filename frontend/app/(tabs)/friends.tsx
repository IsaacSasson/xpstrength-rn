// Path: /app/(tabs)/friends.tsx
import React, { useState } from "react";
import {
  View,
  StatusBar,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import TopBar from "@/components/TopBar";
import SearchInput from "@/components/SearchInput";
import Tabs from "@/components/TabList";
import FriendCard from "@/components/friends/FriendCard";
import pfptest from "@/assets/images/favicon.png";

// Import the hooks
import { useThemeContext } from "@/context/ThemeContext";
import { useUserProgress } from "@/context/UserProgressContext";
import { useFriends, FriendType } from '@/hooks/useFriends'; // Import our custom hook

const Friends = () => {
  // Use our theme context
  const { primaryColor } = useThemeContext();
  const { level } = useUserProgress();
  
  // Use our custom hook for friends data
  const { 
    getFriends,
    getRequests,
    getPending,
    getFriendsCount,
    getRequestsCount,
    getPendingCount,
    loading, 
    error, 
    searchUsers,
    acceptFriendRequest,
    declineFriendRequest,
    cancelPendingRequest,
    removeFriend
  } = useFriends();

  // State to track the active tab and search query.
  const [activeTab, setActiveTab] = useState<string>("Friends");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Handler to change the active tab.
  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
  };

  // Handle friend actions
  const handleAcceptRequest = (userId: string) => {
    acceptFriendRequest(userId);
  };

  const handleDeclineRequest = (userId: string) => {
    declineFriendRequest(userId);
  };

  const handleCancelRequest = (userId: string) => {
    cancelPendingRequest(userId);
  };

  const handleRemoveFriend = (userId: string) => {
    removeFriend(userId);
  };

  // Render different content based on the active tab.
  const renderTabContent = (): JSX.Element | null => {
    let users: any[] = [];
    let type: FriendType = 'friends';
    
    switch (activeTab) {
      case "Friends":
        type = 'friends';
        break;
      case "Requests":
        type = 'requests';
        break;
      case "Pending":
        type = 'pending';
        break;
      default:
        return null;
    }
    
    // Use the searchUsers function from our hook
    users = searchUsers(searchQuery, type);
    
    if (loading) {
      return (
        <View className="items-center justify-center py-10">
          <Text className="text-white font-pmedium">Loading...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View className="items-center justify-center py-10">
          <Text className="text-white font-pmedium">{error}</Text>
        </View>
      );
    }

    if (users.length === 0) {
      let icon = "user-friends";
      let message = "No friends found";
      let subMessage = "Try searching with different letters.";

      if (type === 'requests') {
        icon = "user-check";
        message = "No friend requests found";
        subMessage = "When someone sends you a friend request, it will appear here.";
      } else if (type === 'pending') {
        icon = "user-clock";
        message = "No pending requests found";
        subMessage = "Requests you've sent will appear here until they're accepted.";
      }

      return (
        <View className="items-center justify-center py-10">
          <FontAwesome5
            name={icon}
            size={50}
            color={primaryColor}
          />
          <Text className="text-white font-pmedium text-center mt-4 text-lg">
            {message}
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            {subMessage}
          </Text>
        </View>
      );
    }

    return (
      <View className="space-y-4">
        <View className="bg-black-100 rounded-xl p-4 mb-4">
          {users.map((user) => (
            <FriendCard
              key={user.id}
              pfp={pfptest}
              name={user.name}
              level={user.level.toString()}
              status={user.status}
              lastActive={user.lastActive}
              workouts={user.workouts}
              border={primaryColor}
              levelTextColor={primaryColor}
              showActions={type !== 'friends'}
              actionType={type === 'requests' ? 'request' : 'pending'}
              color={primaryColor}
              onAccept={type === 'requests' ? () => handleAcceptRequest(user.id) : undefined}
              onDecline={type === 'requests' ? () => handleDeclineRequest(user.id) : undefined}
              onCancel={type === 'pending' ? () => handleCancelRequest(user.id) : undefined}
              onRemove={type === 'friends' ? () => handleRemoveFriend(user.id) : undefined}
            />
          ))}
        </View>
      </View>
    );
  };

  // Calculate counts for the tab header
  const getSubtext = () => {
    switch (activeTab) {
      case "Friends":
        return `${getFriendsCount()} Friends`;
      case "Requests":
        return `${getRequestsCount()} Requests`;
      case "Pending":
        return `${getPendingCount()} Pending`;
      default:
        return "";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header: Override bg-primary with dynamic color */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "bg-primary" }}>
        <View className="px-4 pt-6">
          <TopBar
            subtext={getSubtext()}
            title="Your Friends"
            titleTop={true}
          />
        </View>
      </SafeAreaView>

      <View className="px-4 mb-4">
        <SearchInput
          title="Search for friends"
          placeHolder="Search for friends"
          handleChangeText={(text: string) => setSearchQuery(text)}
          value={searchQuery}
          color={primaryColor}
        />
      </View>
      <View className="px-4">
        <Tabs
          tabs={["Friends", "Requests", "Pending"]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          backgroundColor={primaryColor}
        />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

export default Friends;