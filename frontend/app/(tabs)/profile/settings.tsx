// Path: /app/settings.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";
import logo from "@/assets/images/logo.png";
import { deleteToken, getToken } from "../../utils/tokenStore";
// import { handleApiError } from "@/utils/handleApiError";
import { handleApiError } from "../../utils/handleApiError";

const APP_VERSION = "v0.8.3";

/* ------------------------------------------------------------------ */
/*                               Row                                  */
/* ------------------------------------------------------------------ */
interface RowProps {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome5>["name"];
  onPress: () => void;
}
const Row: React.FC<RowProps> = ({ label, icon, onPress }) => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center px-5 py-4 mb-3 rounded-2xl"
      style={{ backgroundColor: tertiaryColor }}
    >
      <FontAwesome5 name={icon} size={18} color={primaryColor} />
      <Text className="text-white font-pmedium text-lg ml-4 flex-1">
        {label}
      </Text>
      <FontAwesome5 name="chevron-right" size={14} color="#858597" />
    </TouchableOpacity>
  );
};

/* ------------------------------------------------------------------ */
/*                              Screen                                */
/* ------------------------------------------------------------------ */
const Settings = () => {
  const { primaryColor } = useThemeContext();
  const [loadingOut, setLoadingOut] = useState(false);

  /* -------- LOG‑OUT -------- */
  const logOut = async () => {
    if (loadingOut) return;
    setLoadingOut(true);
    try {
      const token = await getToken();
      if (token) {
        const res = await fetch("/api/v1/network/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const { error, code } = await handleApiError(res);
          console.error(`Log‑out error (${code}):`, error);
          return;
        }
      }
    } catch (err) {
      console.error("Log‑out request failed:", err);
    } finally {
      // Clear local token no matter what
      await deleteToken();
      setLoadingOut(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* ----- Header ----- */}
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pt-6 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <FontAwesome5 name="arrow-left" size={18} color={primaryColor} />
          </TouchableOpacity>
          <Text className="text-white font-pbold text-xl">Settings</Text>
        </View>
      </SafeAreaView>

      {/* ----- Body ----- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {/* logo */}
        <View className="items-center my-6">
          <Image
            source={logo}
            style={{ width: 120, height: 120, resizeMode: "contain" }}
          />
        </View>

        {/* rows */}
        <Row
          label="Profile"
          icon="user"
          onPress={() => router.push("/profile")}
        />
        <Row
          label="Account"
          icon="lock"
          onPress={() => router.push("/profile")}
        />
        <Row
          label="Units"
          icon="weight-hanging"
          onPress={() => router.push("/profile")}
        />
        <Row
          label="Support"
          icon="life-ring"
          onPress={() => router.push("/profile")}
        />
      </ScrollView>

      {/* ----- Log‑out (pinned bottom‑center) ----- */}
      <TouchableOpacity
        onPress={logOut}
        disabled={loadingOut}
        activeOpacity={0.9}
        className="px-4 py-4 rounded-2xl items-center"
        style={{
       
          position: "absolute",
          bottom: 8,
          left: 0,
          right: 0,
          alignSelf: "center",
          marginHorizontal: 130,
          opacity: loadingOut ? 0.8 : 1,
        }}
      >
        {loadingOut ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text className="text-red-500 font-pbold text-lg">Log Out</Text>
        )}
      </TouchableOpacity>

      {/* ----- App version ----- */}
      <Text
        style={{ position: "absolute", bottom: 8, left: 12 }}
        className="text-gray-100 text-xs"
      >
        {APP_VERSION}
      </Text>
    </View>
  );
};

export default Settings;
