import React, { useState } from "react";
import { View, StatusBar, Text, ScrollView } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import TopBar from "@/components/TopBar";
import SearchInput from "@/components/SearchInput";
import Tabs from "@/components/TabList";
import FriendCard from "@/components/friends/FriendCard";
import pfptest from "@/assets/images/favicon.png";

import { useThemeContext } from "@/context/ThemeContext";
import { useFriends, FriendType } from "@/hooks/useFriends";

/* -------------------------------------------------------------------------- */
/*                                   Screen                                   */
/* -------------------------------------------------------------------------- */
const Friends = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();

  const {
    getFriendsCount,
    getRequestsCount,
    getPendingCount,
    loading,
    error,
    searchUsers,
    acceptFriendRequest,
    declineFriendRequest,
    cancelPendingRequest,
    removeFriend,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<"Friends" | "Requests" | "Pending">(
    "Friends"
  );
  const [searchQuery, setSearchQuery] = useState("");

  /* ------------------------ Tab helpers ------------------------ */
  const handleTabChange = (tab: string) =>
    setActiveTab(tab as "Friends" | "Requests" | "Pending");

  const getSubtext = () =>
    activeTab === "Requests"
      ? `${getRequestsCount()} Requests`
      : activeTab === "Pending"
      ? `${getPendingCount()} Pending`
      : `${getFriendsCount()} Friends`;

  /* ----------------------- Friend actions ---------------------- */
  const handleAcceptRequest = (id: string) => {
    acceptFriendRequest(id);
  };

  const handleDeclineRequest = (id: string) => declineFriendRequest(id);
  const handleCancelRequest = (id: string) => cancelPendingRequest(id);
  const handleRemoveFriend = (id: string) => removeFriend(id);

  /* ----------------------- Tab content UI ---------------------- */
  const renderTabContent = () => {
    const type: FriendType =
      activeTab === "Requests"
        ? "requests"
        : activeTab === "Pending"
        ? "pending"
        : "friends";

    const users = searchUsers(searchQuery, type);

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
      const emptyState = {
        friends: {
          icon: "user-friends",
          msg: "No friends found",
          sub: "Try searching with different letters.",
        },
        requests: {
          icon: "user-check",
          msg: "No friend requests found",
          sub: "When someone sends you a friend request, it will appear here.",
        },
        pending: {
          icon: "user-clock",
          msg: "No pending requests found",
          sub: "Requests you've sent will appear here until they're accepted.",
        },
      }[type];

      return (
        <View className="items-center justify-center py-10">
          <FontAwesome5 name={emptyState.icon as any} size={50} color={primaryColor} />
          <Text className="text-white font-pmedium text-center mt-4 text-lg">
            {emptyState.msg}
          </Text>
          <Text className="text-gray-100 text-center mt-2">{emptyState.sub}</Text>
        </View>
      );
    }

    return (
      <View className="space-y-4">
        <View
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: tertiaryColor }}
        >
          {users.map((user) => (
            <FriendCard
              key={user.id}
              /* ----------- visual ----------- */
              pfp={pfptest}
              border={primaryColor}
              levelTextColor={primaryColor}
              color={primaryColor}
              /* ------------ data ------------ */
              id={user.id}
              name={user.name}
              level={user.level}
              xp={user.xp}
              joinDate={user.joinDate}
              goal={user.goal}
              spotlight={user.spotlight}
              status={user.status}
              lastActive={user.lastActive}
              workouts={user.workouts}
              friends={user.friends}
              /* ----------- actions ---------- */
              showActions={type !== "friends"}
              actionType={type === "requests" ? "request" : "pending"}
              onAccept={
                type === "requests" ? () => handleAcceptRequest(user.id) : undefined
              }
              onDecline={
                type === "requests" ? () => handleDeclineRequest(user.id) : undefined
              }
              onCancel={
                type === "pending" ? () => handleCancelRequest(user.id) : undefined
              }
              onRemove={
                type === "friends" ? () => handleRemoveFriend(user.id) : undefined
              }
            />
          ))}
        </View>
      </View>
    );
  };

  /* -------------------------- Render --------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar title="Your Friends" subtext={getSubtext()} titleTop />

      {/* -------- Search -------- */}
      <View className="px-4 mb-4">
        <SearchInput
          title="Search for friends"
          placeHolder="Search for friends"
          value={searchQuery}
          handleChangeText={setSearchQuery}
          color={primaryColor}
        />
      </View>

      {/* -------- Tabs -------- */}
      <View className="px-4">
        <Tabs
          tabs={["Friends", "Requests", "Pending"]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          backgroundColor={primaryColor}
          tertiaryColor={tertiaryColor}
        />
      </View>

      {/* -------- Content -------- */}
      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

export default Friends;