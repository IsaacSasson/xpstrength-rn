// Friends.tsx
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

// Import the dynamic theme hook
import { useThemeColors } from "@/context/ThemeContext"; // Adjust path as needed

interface User {
  id: string;
  name: string;
  level: number;
  status: string;
  lastActive: string;
  workouts?: number;
}

// Mock data for friends
const mockFriends: User[] = [
  {
    id: "1",
    name: "Wiiwho",
    level: 25,
    status: "Online",
    lastActive: "Now",
    workouts: 42,
  },
  {
    id: "2",
    name: "Alex",
    level: 31,
    status: "Online",
    lastActive: "Now",
    workouts: 67,
  },
  {
    id: "3",
    name: "Jordan",
    level: 19,
    status: "Offline",
    lastActive: "2h ago",
    workouts: 23,
  },
  {
    id: "4",
    name: "Taylor",
    level: 45,
    status: "In Workout",
    lastActive: "Now",
    workouts: 128,
  },
  {
    id: "5",
    name: "Casey",
    level: 37,
    status: "Offline",
    lastActive: "1d ago",
    workouts: 85,
  },
  {
    id: "6",
    name: "Morgan",
    level: 22,
    status: "Online",
    lastActive: "Now",
    workouts: 31,
  },
];

// Mock data for friend requests
const mockRequests: User[] = [
  {
    id: "7",
    name: "Riley",
    level: 15,
    status: "Pending",
    lastActive: "3h ago",
  },
  {
    id: "8",
    name: "Jamie",
    level: 28,
    status: "Pending",
    lastActive: "1d ago",
  },
];

// Mock data for pending requests
const mockPending: User[] = [
  {
    id: "9",
    name: "Quinn",
    level: 33,
    status: "Pending",
    lastActive: "4h ago",
  },
];

// Helper function to compute the Levenshtein distance between two strings.
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

// Helper function for fuzzy matching using the Levenshtein distance.
const fuzzyMatch = (text: string, query: string): boolean => {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerText.includes(lowerQuery)) return true;
  const distance = levenshteinDistance(lowerText, lowerQuery);
  const similarity =
    1 - distance / Math.max(lowerText.length, lowerQuery.length);
  return similarity >= 0.5;
};

const Friends = () => {
  // Theme hook for dynamic colors.
  const { primaryColor, cycleTheme } = useThemeColors();

  // State to track the active tab and search query.
  const [activeTab, setActiveTab] = useState<string>("Friends");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter users based on search query.
  const filterUsers = (users: User[]): User[] => {
    if (searchQuery.trim() === "") return users;
    const query = searchQuery.toLowerCase();
    if (query.length === 1) {
      return users.filter((user: User) =>
        user.name.toLowerCase().includes(query)
      );
    } else {
      return users.filter((user: User) => fuzzyMatch(user.name, query));
    }
  };

  // Handler to change the active tab.
  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
  };

  // Render different content based on the active tab.
  const renderTabContent = (): JSX.Element | null => {
    switch (activeTab) {
      case "Friends": {
        const filteredFriends = filterUsers(mockFriends);
        return (
          <View className="space-y-4">
            {filteredFriends.length > 0 ? (
              <View className="bg-black-100 rounded-xl p-4 mb-4">
                {filteredFriends.map((friend: User) => (
                  <FriendCard
                    key={friend.id}
                    pfp={pfptest}
                    name={friend.name}
                    level={friend.level.toString()}
                    status={friend.status}
                    lastActive={friend.lastActive}
                    workouts={friend.workouts}
                    border={primaryColor}
                    levelTextColor={primaryColor}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-10">
                <FontAwesome5
                  name="user-friends"
                  size={50}
                  color={primaryColor}
                />
                <Text className="text-white font-pmedium text-center mt-4 text-lg">
                  No friends found
                </Text>
                <Text className="text-gray-100 text-center mt-2">
                  Try searching with different letters.
                </Text>
              </View>
            )}
          </View>
        );
      }
      case "Requests": {
        const filteredRequests = filterUsers(mockRequests);
        return (
          <View className="space-y-4">
            {filteredRequests.length > 0 ? (
              <View className="bg-black-100 rounded-xl p-4">
                {filteredRequests.map((request: User) => (
                  <FriendCard
                    key={request.id}
                    pfp={pfptest}
                    name={request.name}
                    level={request.level.toString()}
                    status={request.status}
                    lastActive={request.lastActive}
                    showActions={true}
                    actionType="request"
                    color={primaryColor}
                    levelTextColor={primaryColor}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-10">
                <FontAwesome5
                  name="user-check"
                  size={50}
                  color={primaryColor}
                />
                <Text className="text-white font-pmedium text-center mt-4 text-lg">
                  No friend requests found
                </Text>
                <Text className="text-gray-100 text-center mt-2">
                  When someone sends you a friend request, it will appear here.
                </Text>
              </View>
            )}
          </View>
        );
      }
      case "Pending": {
        const filteredPending = filterUsers(mockPending);
        return (
          <View className="space-y-4">
            {filteredPending.length > 0 ? (
              <View className="bg-black-100 rounded-xl p-4">
                {filteredPending.map((pending: User) => (
                  <FriendCard
                    key={pending.id}
                    pfp={pfptest}
                    name={pending.name}
                    level={pending.level.toString()}
                    status={pending.status}
                    lastActive={pending.lastActive}
                    showActions={true}
                    actionType="pending"
                    levelTextColor={primaryColor}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center justify-center py-10">
                <FontAwesome5
                  name="user-clock"
                  size={50}
                  color={primaryColor}
                />
                <Text className="text-white font-pmedium text-center mt-4 text-lg">
                  No pending requests found
                </Text>
                <Text className="text-gray-100 text-center mt-2">
                  Requests you've sent will appear here until they're accepted.
                </Text>
              </View>
            )}
          </View>
        );
      }
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header: Override bg-primary with dynamic color */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "bg-primary" }}>
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
