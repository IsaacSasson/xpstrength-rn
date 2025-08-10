// Path: /app/settings.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthProvider";
import logo from "@/assets/images/logo.png";
import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_VERSION = "v0.8.3";
const UNIT_KEY = "unit_preference";

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
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const { logout } = useAuth();
  const [loadingOut, setLoadingOut] = useState(false);

  /* -------- UNITS -------- */
  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");
  const [unitModalVisible, setUnitModalVisible] = useState(false);

  /** Load saved preference on mount */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(UNIT_KEY);
      if (saved === "imperial" || saved === "metric") setUnit(saved);
    })();
  }, []);

  /** Persist preference and close modal */
  const chooseUnit = async (u: "imperial" | "metric") => {
    setUnit(u);
    await AsyncStorage.setItem(UNIT_KEY, u);
    setUnitModalVisible(false);
  };

  /* -------- LOG‑OUT -------- */
  const logOut = async () => {
    if (loadingOut) return;
    setLoadingOut(true);
    try {
      console.log("🚪 Logging out...");
      await logout();
      console.log("✅ Logged out successfully");
      // Navigation will be handled by auth state changes
    } catch (err) {
      console.error("❌ Log‑out request failed:", err);
    } finally {
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
          label="Edit Profile"
          icon="user"
          onPress={() => router.push("/profile/user-profile")}
        />
        <Row
          label="Account"
          icon="lock"
          onPress={() => router.push("/profile/account")}
        />
        <Row
          label={`Units (${unit === "imperial" ? "lbs" : "kgs"})`}
          icon="weight-hanging"
          onPress={() => setUnitModalVisible(true)}
        />
        <Row
          label="Blocked Users"
          icon="user-slash"
          onPress={() => router.push("/profile/blocked-users")}
        />
        <Row
          label="Support"
          icon="life-ring"
          onPress={() => router.push("/profile/support")}
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
          <Text className="text-red-500 font-pbold text-lg">Log Out</Text>
        )}
      </TouchableOpacity>

      {/* ----- App version ----- */}
      <Text
        style={{ position: "absolute", bottom: 8, left: 12 }}
        className="text-gray-100 text-xs"
      >
        {APP_VERSION}
      </Text>

      {/* ----- Unit selection modal ----- */}
      <Modal
        visible={unitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUnitModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={() => setUnitModalVisible(false)}
        >
          <View
            className="w-11/12 rounded-3xl p-6"
            style={{ backgroundColor: tertiaryColor }}
          >
            <Text className="text-white font-pbold text-lg mb-4">
              Choose Units
            </Text>

            {/* Imperial */}
            <TouchableOpacity
              onPress={() => chooseUnit("imperial")}
              activeOpacity={0.8}
              className="flex-row items-center py-3"
            >
              <FontAwesome5
                name={
                  unit === "imperial" ? "dot-circle" : "circle"
                }
                size={20}
                color={primaryColor}
              />
              <Text className="text-white font-pmedium text-base ml-3">
                Imperial (lbs)
              </Text>
            </TouchableOpacity>

            {/* Metric */}
            <TouchableOpacity
              onPress={() => chooseUnit("metric")}
              activeOpacity={0.8}
              className="flex-row items-center py-3"
            >
              <FontAwesome5
                name={
                  unit === "metric" ? "dot-circle" : "circle"
                }
                size={20}
                color={primaryColor}
              />
              <Text className="text-white font-pmedium text-base ml-3">
                Metric (kgs)
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Settings;