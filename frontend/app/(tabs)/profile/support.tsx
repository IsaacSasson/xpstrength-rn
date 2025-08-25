// Path: /app/support.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";

const SUPPORT_EMAIL = "xpstrength.feedback@gmail.com";
const DISCORD_URL   = "https://discord.gg/your‑invite‑code";

const Support = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();

  /* ---------------- Form state ---------------- */
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);

  /* ---------------- Handlers ---------------- */
  const handleSend = async () => {
    if (sending) return;
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Please fill in both subject and message.");
      return;
    }

    setSending(true);
    try {
      const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to open mail client",
          `Please send an email manually to ${SUPPORT_EMAIL}.`,
        );
      }
    } catch (err) {
      console.error("Sending mail failed:", err);
      Alert.alert("Something went wrong. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* ---------- Header ---------- */}
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pt-6 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <FontAwesome5 name="arrow-left" size={18} color={primaryColor} />
          </TouchableOpacity>
          <Text className="text-white font-pbold text-xl">Support</Text>
        </View>
      </SafeAreaView>

      {/* ---------- Body ---------- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
      >
        {/* -------- Contact card (centered) -------- */}
        <View
          className="self-center flex-row items-center px-5 py-4 rounded-3xl mb-6"
          style={{ backgroundColor: tertiaryColor }}
        >
          <FontAwesome5 name="envelope" size={20} color={primaryColor} />
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.8}
          >
            <Text
              className="text-white font-pmedium text-base ml-3"
              selectable
            >
              {SUPPORT_EMAIL}
            </Text>
          </TouchableOpacity>
        </View>

        {/* -------- Form -------- */}
        <Text className="text-white font-pbold text-lg mb-2">
          Send us a message
        </Text>

        {/* Subject */}
        <TextInput
          placeholder="Subject"
          placeholderTextColor="#999"
          className="w-full mb-4 px-4 py-3 rounded-2xl text-white font-pregular text-base"
          style={{ backgroundColor: tertiaryColor }}
          value={subject}
          onChangeText={setSubject}
          editable={!sending}
        />

        {/* Message */}
        <TextInput
          placeholder="Message"
          placeholderTextColor="#999"
          className="w-full mb-6 px-4 py-3 rounded-2xl text-white font-pregular text-base"
          style={{
            backgroundColor: tertiaryColor,
            height: 150,
            textAlignVertical: "top",
          }}
          value={message}
          onChangeText={setMessage}
          editable={!sending}
          multiline
        />

        {/* Send button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.9}
          className="py-4 rounded-2xl items-center"
          style={{
            backgroundColor: primaryColor,
            opacity: sending ? 0.8 : 1,
          }}
        >
          <Text className="text-black font-pbold text-lg">
            {sending ? "Sending..." : "Send"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ---------- Discord logo (bottom‑right) ---------- */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          padding: 6,
        }}
        onPress={() => Linking.openURL(DISCORD_URL)}
      >
        <FontAwesome5 name="discord" size={40} color={primaryColor} />
      </TouchableOpacity>
    </View>
  );
};

export default Support;
