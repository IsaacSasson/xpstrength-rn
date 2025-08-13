import React, { useState } from "react";
import {
  View,
  StatusBar,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import TopBar from "@/components/TopBar";
import SearchInput from "@/components/SearchInput";
import Tabs from "@/components/TabList";
import FriendCard from "@/components/friends/FriendCard";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
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
    sendFriendRequest,
  } = useFriends();

  const [activeTab, setActiveTab] = useState<"Friends" | "Requests" | "Pending">(
    "Friends",
  );
  const [searchQuery, setSearchQuery] = useState("");

  /* ------ Add‑friend sheet state ------ */
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [username, setUsername] = useState("");
  const [addErr, setAddErr] = useState<string | null>(null);

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
  const handleAcceptRequest = (id: string) => acceptFriendRequest(id);
  const handleDeclineRequest = (id: string) => declineFriendRequest(id);
  const handleCancelRequest = (id: string) => cancelPendingRequest(id);
  const handleRemoveFriend = (id: string) => removeFriend(id);

  /* ------------------ Add friend submit logic ------------------ */
  const submitAddFriend = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setAddErr("Please enter a username.");
      return;
    }
    try {
      await (sendFriendRequest
        ? sendFriendRequest(trimmed)
        : Promise.reject(new Error("sendFriendRequest not implemented")));
      Alert.alert("Request Sent", `Friend request sent to ${trimmed}.`);
      setUsername("");
      setAddErr(null);
      setShowAddSheet(false);
    } catch (e: any) {
      setAddErr(e.message || "Something went wrong. Try again.");
    }
  };

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

      {/* -------- Search Row -------- */}
      <View className="px-4 mb-4 flex-row items-center">
        <View className="flex-1 mr-3">
          <SearchInput
            title="Search for friends"
            placeHolder="Search for friends"
            value={searchQuery}
            handleChangeText={setSearchQuery}
            color={primaryColor}
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowAddSheet(true)}
          className="rounded-xl h-12 w-12 items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <FontAwesome5 name="user-plus" size={20} color="white" />
        </TouchableOpacity>
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

      {/* -------- Add Friend Bottom‑Sheet -------- */}
      <DraggableBottomSheet
        visible={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setAddErr(null);
          setUsername("");
        }}
        primaryColor={primaryColor}
        heightRatio={0.45}
        keyboardOffsetRatio={0.8}
      >
        <Text className="text-white text-xl font-psemibold text-center mb-4">
          Add Friend
        </Text>

        <SearchInput
          title="Username"
          placeHolder="Enter username"
          value={username}
          handleChangeText={(t) => {
            setUsername(t);
            setAddErr(null);
          }}
          color={primaryColor}
        />

        {addErr && (
          <Text className="text-red-500 text-sm mt-2 text-center">{addErr}</Text>
        )}

        <TouchableOpacity
          onPress={submitAddFriend}
          className="mt-6 p-4 rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          <Text className="text-white font-pmedium text-center">Send Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowAddSheet(false);
            setAddErr(null);
            setUsername("");
          }}
          className="bg-black-200 mt-4 p-4 rounded-xl"
        >
          <Text className="text-white text-center font-pmedium">Cancel</Text>
        </TouchableOpacity>
      </DraggableBottomSheet>
    </View>
  );
};

export default Friends;
