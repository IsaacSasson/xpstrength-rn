// Path: /app/(tabs)/profile/index.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useUser } from "@/context/UserProvider";
import { useAuth } from "@/context/AuthProvider";
import TopBar from "@/components/TopBar";
import defaultPfp from "@/assets/images/favicon.png";
import { router } from "expo-router";
import { calculateXpProgress } from "@/utils/xpUtils";

/* ------------------------------------------------------------------
   Helpers
-------------------------------------------------------------------*/
const formatMinutes = (min: number) => {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const ProgressBar: React.FC<{
  progress: number;
  total: number;
  color: string;
}> = ({ progress, total, color }) => {
  const ratio = Math.min(progress / total, 1);
  return (
    <View className="h-3 w-full bg-black-200 rounded-full overflow-hidden">
      <View
        className="h-full"
        style={{ width: `${ratio * 100}%`, backgroundColor: color }}
      />
    </View>
  );
};

const LoadingCard: React.FC<{ color: string }> = ({ color }) => (
  <View
    className="rounded-2xl p-5 mb-6 items-center justify-center"
    style={{ backgroundColor: color, minHeight: 200 }}
  >
    <ActivityIndicator size="large" color="#FFF" />
    <Text className="text-white mt-2">Loading profile...</Text>
  </View>
);

const ErrorCard: React.FC<{ 
  error: string; 
  onRetry: () => void; 
  color: string 
}> = ({ error, onRetry, color }) => (
  <View
    className="rounded-2xl p-5 mb-6"
    style={{ backgroundColor: color }}
  >
    <View className="items-center">
      <FontAwesome5 name="exclamation-triangle" size={24} color="#FF4C4C" />
      <Text className="text-white font-psemibold text-lg mt-2 text-center">
        Error Loading Profile
      </Text>
      <Text className="text-gray-200 text-center mt-1 mb-4">
        {error}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className="px-6 py-2 rounded-lg"
        style={{ backgroundColor: "#FF4C4C" }}
      >
        <Text className="text-white font-pmedium">Retry</Text>
      </TouchableOpacity>
    </View>
  </View>
);

/* ------------------------------------------------------------------
   Component
-------------------------------------------------------------------*/
const Profile = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const { user } = useAuth();
  const {
    profile,
    profilePictureUri,
    exerciseHistory,
    isLoading,
    isRefreshing,
    error,
    refreshProfile,
    clearError,
  } = useUser();

  // Calculate XP progress to next level using the real XP system
  const xpProgress = useMemo(() => {
    if (!profile) return { current: 0, needed: 1000, percentage: 0 };
    
    return calculateXpProgress(profile.level, profile.xp);
  }, [profile]);

  // Handle pull to refresh
  const handleRefresh = async () => {
    clearError();
    await refreshProfile();
  };

  // Show loading state
  if (isLoading && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <TopBar subtext="Loading..." title="Your Profile" titleTop />
        <View className="px-4">
          <LoadingCard color={tertiaryColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <TopBar 
        subtext={profile ? `It's You, ${profile.username}!` : "It's you!"} 
        title="Your Profile" 
        titleTop 
      />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="px-4"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primaryColor}
          />
        }
      >
        {/* Error State */}
        {error && !isLoading && (
          <ErrorCard 
            error={error} 
            onRetry={handleRefresh} 
            color={tertiaryColor} 
          />
        )}

        {/* Profile unavailable */}
        {!profile && !isLoading && !error && (
          <View
            className="rounded-2xl p-5 mb-6 items-center"
            style={{ backgroundColor: tertiaryColor }}
          >
            <FontAwesome5 name="user-slash" size={24} color="#888" />
            <Text className="text-white font-psemibold text-lg mt-2">
              Profile Unavailable
            </Text>
            <Text className="text-gray-200 text-center mt-1">
              Please check your connection and try again.
            </Text>
          </View>
        )}

        {/* ---------- USER CARD ---------- */}
        {profile && (
          <View
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: tertiaryColor }}
          >
            {/* top row — avatar & text on left, menu on right */}
            <View className="flex-row justify-between">
              {/* avatar + info */}
              <View className="flex-row">
                <Image
                  source={profilePictureUri ? { uri: profilePictureUri } : defaultPfp}
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                />
                <View className="ml-3">
                  <Text
                    className="text-white font-psemibold text-xl"
                    style={{ color: primaryColor }}
                  >
                    {profile.username}
                  </Text>

                  <Text className="text-gray-100 text-xs">
                    {profile.authority === 'premium' && (
                      <Text style={{ color: '#FFD700' }}>⭐ Premium • </Text>
                    )}
                    {profile.authority === 'admin' && (
                      <Text style={{ color: '#FF4C4C' }}>👑 Admin • </Text>
                    )}
                    <Text style={{ color: secondaryColor }}>
                      {profile.totalCoins} coins
                    </Text>
                  </Text>

                  <Text className="text-gray-100 text-xs">
                    Member since {formatDate(new Date().toISOString())}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="p-2"
                onPress={() => {
                  router.push("/profile/settings");
                }}
              >
                <FontAwesome5 name="cog" size={18} color={primaryColor} />
              </TouchableOpacity>
            </View>

            {/* XP bar */}
            <View className="mt-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white">Level {profile.level}</Text>
                <Text className="text-gray-100">
                  {xpProgress.current}/{xpProgress.needed} XP
                </Text>
              </View>
              <ProgressBar
                progress={xpProgress.current}
                total={xpProgress.needed}
                color={primaryColor}
              />
            </View>

            {/* Quick Stats — Friends / Workouts / Time */}
            <View className="flex-row justify-between mt-4">
              <View className="items-center flex-1">
                <FontAwesome5 name="user-friends" size={20} color={primaryColor} />
                <Text className="text-white mt-1 font-pmedium">{profile.total_friends}</Text>
                <Text className="text-gray-100 text-xs">Friends</Text>
              </View>

              <View className="items-center flex-1">
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={22}
                  color={primaryColor}
                />
                <Text className="text-white mt-1 font-pmedium">
                  {profile.total_workouts}
                </Text>
                <Text className="text-gray-100 text-xs">Workouts</Text>
              </View>

              <View className="items-center flex-1">
                <FontAwesome5 name="clock" size={20} color={primaryColor} />
                <Text className="text-white mt-1 font-pmedium">
                  {formatMinutes(profile.totalTimeWorkedOut)}
                </Text>
                <Text className="text-gray-100 text-xs">Time</Text>
              </View>
            </View>
          </View>
        )}

        {/* ---------- ACHIEVEMENTS ---------- */}
        <Text className="text-white text-xl font-psemibold mb-6">
          Featured Achievements
        </Text>
        <View className="flex-row mb-6">
          {[
            { id: 1, icon: "dumbbell", title: "Workout Warrior" },
            { id: 2, icon: "trophy", title: "Personal Best" },
            { id: 3, icon: "fire", title: "Streak Master" }
          ].map((ach) => (
            <View key={ach.id} className="flex-1 items-center">
              <View
                className="h-16 w-16 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: primaryColor }}
              >
                <FontAwesome5 name={ach.icon as any} size={24} color="#FFF" />
              </View>
              <Text className="text-center text-white text-xs font-pmedium px-1">
                {ach.title}
              </Text>
            </View>
          ))}
        </View>

        {/* ---------- SPOTLIGHT LIFT ---------- */}
        <Text className="text-white text-xl font-psemibold mb-3">
          Spotlight Exercise
        </Text>
        <View
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="arm-flex" size={22} color={primaryColor} />
              <Text className="text-white font-pmedium text-lg ml-2">
                Bench Press
              </Text>
            </View>
            <Text
              className="text-white font-psemibold text-lg"
              style={{ color: primaryColor }}
            >
              225 lbs
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

export default Profile;