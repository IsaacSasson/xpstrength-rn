import { View, ScrollView, Image, Text, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/logo.png";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { Link, useLocalSearchParams, router } from "expo-router";

import { API_BASE } from "../config";
import { handleApiError } from '../utils/handleApiError';
import { saveToken } from "../utils/tokenStore";

const SignIn = () => {
  const { username: prefillUsername } = useLocalSearchParams<{ username?: string }>();

  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: prefillUsername ?? '',
    password: "",
  });


  const submit = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Error", "Please fill in all the fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { username: form.username.trim(), password: form.password },
        }),
      });

      if (!res.ok) {
        const { error } = await handleApiError(res);
        console.log("Login failed:", error ?? "Request failed");
        return;
      }

      // pull token out and store it
      const { data } = await res.json();
      if (data?.accessToken) {
        await saveToken(data.accessToken);
      }

      // logged in – drop them on the first tab & wipe auth stack
      router.replace("/(tabs)/home");
    } catch (e) {
      console.error("Network error:", e);
    } finally {
      setSubmitting(false);
    }
  };
    
  return (
    <SafeAreaView className="bg-primary flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <View className="w-full px-4 my-6">
          <View className="items-center">
            <Image
              source={logo}
              resizeMode="contain"
              style={{ width: 300, height: 90 }}
            />
          </View>

          <Text className="text-2xl text-white text-semibold mt-10 font-psemibold">
            Log in to XPStrength
          </Text>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-7"
            placeHolder=""
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
            placeHolder={""}
          />

          <CustomButton
            title="Sign In"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Don't have an account?
            </Text>
            <Link
              href="/sign-up"
              className="text-lg font-psemibold text-secondary"
            >
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
