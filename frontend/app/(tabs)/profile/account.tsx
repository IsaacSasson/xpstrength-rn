// Path: /app/account.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useThemeContext } from "@/context/ThemeContext";

/* ------------------------------------------------------------ */
/*           Mini helpers to keep the JSX tidy                  */
/* ------------------------------------------------------------ */
const Ribbon: React.FC = () => (
  <View
    style={{
      height: 28,
     
      marginHorizontal: 32,
      borderRadius: 999,
      marginTop: 28,
      marginBottom: 36,
    }}
  />
);

const GlassCard: React.FC<
  React.PropsWithChildren<{ accent: string; title: string }>
> = ({ accent, title, children }) => (
  <View
    style={{
      flexDirection: "row",
      paddingHorizontal: 6,
    }}
  >
    {/* Accent bar */}
    <View
      style={{
        width: 4,
        borderRadius: 4,
        backgroundColor: accent,
        marginTop: 12,
        marginBottom: 12,
      }}
    />

    {/* Content */}
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: 18,
        shadowColor: accent,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <Text
        style={{
          color: accent,
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 18,
          marginBottom: 16,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  </View>
);

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
}> = ({ label, value, onChangeText, placeholder, keyboardType = "default" }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={{ color: "#A0A0B2", marginBottom: 6, fontSize: 12 }}>
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#666"
      keyboardType={keyboardType}
      autoCapitalize="none"
      style={{
        color: "#FFF",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "rgba(0,0,0,0.25)",
      }}
    />
  </View>
);

/* ------------------------------------------------------------ */
/*                        Main Screen                           */
/* ------------------------------------------------------------ */
const Account = () => {
  const { primaryColor } = useThemeContext();

  /* -------- Email change state -------- */
  const [currentEmail] = useState("wiiwho123@gmail.com");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const saveEmail = async () => {
    if (savingEmail) return;
    if (!newEmail || newEmail !== confirmEmail)
      return Alert.alert("Error", "E‑mails do not match.");
    setSavingEmail(true);
    try {
      // TODO: PATCH /account/email
      await new Promise((r) => setTimeout(r, 1200));
      Alert.alert("Success", "E‑mail updated!");
    } catch {
      Alert.alert("Error", "Could not update e‑mail.");
    } finally {
      setSavingEmail(false);
    }
  };

  /* -------- Reset / Delete state -------- */
  const [processing, setProcessing] = useState<null | "reset" | "delete">(null);

  const confirmDestructive = (
    type: "reset" | "delete",
    headline: string,
    body: string
  ) =>
    Alert.alert(headline, body, [
      { text: "Cancel", style: "cancel" },
      {
        text: headline.split(" ")[0],
        style: "destructive",
        onPress: async () => {
          setProcessing(type);
          try {
            // TODO: API call
            await new Promise((r) => setTimeout(r, 1300));
            if (type === "delete") router.replace("/");
            else Alert.alert("Account reset", "All statistics were cleared.");
          } catch {
            Alert.alert("Error", `Could not ${type} account.`);
          } finally {
            setProcessing(null);
          }
        },
      },
    ]);

  /* -------------------------------------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      {/* Header */}
      <SafeAreaView edges={["top"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 24,
            paddingHorizontal: 16,
            paddingBottom: 10,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
            <FontAwesome5 name="arrow-left" size={18} color={primaryColor} />
          </TouchableOpacity>
          <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 20 }}>
            Account Settings
          </Text>
        </View>
      </SafeAreaView>

      {/* Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding" })}
      >
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* CHANGE EMAIL ------------------------------------------------ */}
       
          <GlassCard title="Change Email" accent={primaryColor}>
            <Field
              label="Current Email"
              value={currentEmail}
              onChangeText={() => {}}
              keyboardType="email-address"
            />
            <Field
              label="New Email"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
            />
            
            <TouchableOpacity
              onPress={saveEmail}
              disabled={savingEmail}
              activeOpacity={0.9}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 10,
                paddingHorizontal: 36,
                borderRadius: 999,
                backgroundColor: primaryColor,
                marginTop: 4,
                opacity: savingEmail ? 0.8 : 1,
              }}
            >
              {savingEmail ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Send</Text>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* RESET ACCOUNT ---------------------------------------------- */}
          <Ribbon />
          <GlassCard title="Reset Account" accent="#FF4C4C">
            <Text style={{ color: "#FF4C4C", fontWeight: "700", marginBottom: 8 }}>
              THIS ACTION IS IRREVERSIBLE!
            </Text>
            <Text style={{ color: "#DDD", lineHeight: 20, marginBottom: 18 }}>
              Resetting will delete every recorded workout and stat linked to your account. 
              You will lose all trophies and badges you have unlocked.
            </Text>
            <TouchableOpacity
              onPress={() =>
                confirmDestructive(
                  "reset",
                  "Reset Account",
                  "All progress will be wiped forever. Are you sure?"
                )
              }
              disabled={processing !== null}
              activeOpacity={0.9}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 10,
                paddingHorizontal: 40,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: "#FF4C4C",
                opacity: processing ? 0.8 : 1,
              }}
            >
              {processing === "reset" ? (
                <ActivityIndicator color="#FF4C4C" />
              ) : (
                <Text style={{ color: "#FF4C4C", fontWeight: "700" }}>
                  Reset
                </Text>
              )}
            </TouchableOpacity>
          </GlassCard>

          {/* DELETE ACCOUNT --------------------------------------------- */}
          <Ribbon />
          <GlassCard title="Delete Account" accent="#FF0000">
            <Text style={{ color: "#FF0000", fontWeight: "700", marginBottom: 8 }}>
              THIS ACTION IS IRREVERSIBLE!
            </Text>
            <Text style={{ color: "#DDD", lineHeight: 20, marginBottom: 18 }}>
              Deleting your account will permanently erase all data linked to it.
            </Text>
            <TouchableOpacity
              onPress={() =>
                confirmDestructive(
                  "delete",
                  "Delete Account",
                  "There is no recovery after deletion. Continue?"
                )
              }
              disabled={processing !== null}
              activeOpacity={0.9}
              style={{
                alignSelf: "flex-start",
                paddingVertical: 10,
                paddingHorizontal: 40,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: "#FF0000",
                opacity: processing ? 0.8 : 1,
              }}
            >
              {processing === "delete" ? (
                <ActivityIndicator color="#FF0000" />
              ) : (
                <Text style={{ color: "#FF0000", fontWeight: "700" }}>
                  Delete
                </Text>
              )}
            </TouchableOpacity>
          </GlassCard>

          <Ribbon />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Account;
