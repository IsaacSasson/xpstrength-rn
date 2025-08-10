// Path: /app/(tabs)/profile/blocked-users.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";
import defaultPfp from "@/assets/images/favicon.png";

// Mock data for blocked users
const MOCK_BLOCKED_USERS = [
  {
    id: "1",
    username: "troublemaker_99",
    profilePicture: null,
    blockedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2", 
    username: "spammer_user",
    profilePicture: null,
    blockedAt: "2024-01-10T14:22:00Z",
  },
  {
    id: "3",
    username: "toxic_lifter",
    profilePicture: null,
    blockedAt: "2024-01-08T09:15:00Z",
  },
  {
    id: "4",
    username: "harassment_account",
    profilePicture: null,
    blockedAt: "2024-01-05T16:45:00Z",
  },
];

interface BlockedUser {
  id: string;
  username: string;
  profilePicture: string | null;
  blockedAt: string;
}

interface UserActionsModalProps {
  visible: boolean;
  user: BlockedUser | null;
  onClose: () => void;
  onUnblock: (userId: string) => void;
  onReport: (userId: string) => void;
}

const UserActionsModal: React.FC<UserActionsModalProps> = ({
  visible,
  user,
  onClose,
  onUnblock,
  onReport,
}) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [processing, setProcessing] = useState<"unblock" | "report" | null>(null);

  const handleUnblock = async () => {
    if (!user || processing) return;
    
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${user.username}? They will be able to interact with you again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "default",
          onPress: async () => {
            setProcessing("unblock");
            try {
              await onUnblock(user.id);
              onClose();
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleReport = async () => {
    if (!user || processing) return;
    
    Alert.alert(
      "Report User",
      `Report ${user.username} for violations? Our team will review this report.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            setProcessing("report");
            try {
              await onReport(user.id);
              Alert.alert("Report Submitted", "Thank you for helping keep our community safe.");
              onClose();
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onPress={onClose}
      >
        <View
          className="w-11/12 rounded-3xl p-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          {/* User Info */}
          <View className="flex-row items-center mb-6">
            <Image
              source={user.profilePicture ? { uri: user.profilePicture } : defaultPfp}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
            <View className="ml-3 flex-1">
              <Text className="text-white font-psemibold text-lg">
                {user.username}
              </Text>
              <Text className="text-gray-300 text-sm">
                Blocked on {new Date(user.blockedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            onPress={handleUnblock}
            disabled={processing !== null}
            activeOpacity={0.8}
            className="flex-row items-center py-4 px-4 mb-3 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            {processing === "unblock" ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <FontAwesome5 name="user-check" size={18} color={primaryColor} />
            )}
            <Text className="text-white font-pmedium text-base ml-3">
              Unblock User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReport}
            disabled={processing !== null}
            activeOpacity={0.8}
            className="flex-row items-center py-4 px-4 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            {processing === "report" ? (
              <ActivityIndicator size="small" color="#FF4C4C" />
            ) : (
              <FontAwesome5 name="flag" size={18} color="#FF4C4C" />
            )}
            <Text className="text-white font-pmedium text-base ml-3">
              Report User
            </Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="items-center py-3 mt-4"
          >
            <Text className="text-gray-300 font-pmedium">Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const formatBlockedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const BlockedUsers = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(MOCK_BLOCKED_USERS);
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleUserOptionsPress = (user: BlockedUser) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleUnblockUser = async (userId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setBlockedUsers(prev => prev.filter(user => user.id !== userId));
    console.log(`Unblocked user with ID: ${userId}`);
  };

  const handleReportUser = async (userId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log(`Reported user with ID: ${userId}`);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pt-6 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <FontAwesome5 name="arrow-left" size={18} color={primaryColor} />
          </TouchableOpacity>
          <Text className="text-white font-pbold text-xl">Blocked Users</Text>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
      >
        {blockedUsers.length === 0 ? (
          // Empty state
          <View className="items-center mt-20">
            <FontAwesome5 name="user-slash" size={48} color="#666" />
            <Text className="text-white font-psemibold text-lg mt-4">
              No Blocked Users
            </Text>
            <Text className="text-gray-300 text-center mt-2 px-8">
              Users you block will appear here. You can manage them anytime.
            </Text>
          </View>
        ) : (
          // Users list
          blockedUsers.map((user) => (
            <View
              key={user.id}
              className="flex-row items-center p-4 mb-3 rounded-2xl"
              style={{ backgroundColor: tertiaryColor }}
            >
              {/* Profile Picture */}
              <Image
                source={user.profilePicture ? { uri: user.profilePicture } : defaultPfp}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
              
              {/* User Info */}
              <View className="flex-1 ml-3">
                <Text className="text-white font-psemibold text-base">
                  {user.username}
                </Text>
                <Text className="text-gray-300 text-sm">
                  Blocked {formatBlockedDate(user.blockedAt)}
                </Text>
              </View>

              {/* Options Button */}
              <TouchableOpacity
                onPress={() => handleUserOptionsPress(user)}
                activeOpacity={0.7}
                className="p-2"
              >
                <FontAwesome5 name="cog" size={18} color={primaryColor} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Info text */}
        {blockedUsers.length > 0 && (
          <Text className="text-gray-400 text-center text-sm mt-6 px-4">
            Blocked users cannot see your profile, send you messages, or interact with your content.
          </Text>
        )}
      </ScrollView>

      {/* User Actions Modal */}
      <UserActionsModal
        visible={modalVisible}
        user={selectedUser}
        onClose={closeModal}
        onUnblock={handleUnblockUser}
        onReport={handleReportUser}
      />
    </View>
  );
};

export default BlockedUsers;