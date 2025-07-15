import { View, ScrollView, Image, Text, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/logo.png";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";

import { API_BASE } from "../config";
import { handleApiError } from '../utils/handleApiError';

const ForgotPassword = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');

  const submit = async () => {
    if (!username) {
      Alert.alert("Error", "Please enter your username");
      return;
    }

    try {
        setSubmitting(true);
        const res = await fetch(`${API_BASE}/api/v1/auth/forgotPassword`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            data: { username: username.trim() },
            }),
        });

        if (!res.ok) {
            const { error } = await handleApiError(res);
            console.log("Error:", error ?? "Failed to send password reset link. Please try again.");
            return;
        }

        router.push("/sign-in");
    } catch (e) {
        console.error("Network error:", e);
        console.log("Error: Network error. Please check your connection and try again.");
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
            Forgot Password
          </Text>

          <Text className="text-gray-100 text-base mt-4 font-pregular">
            Enter your username and we'll send you a password reset link.
          </Text>

          <FormField
            title="Username"
            value={username}
            handleChangeText={setUsername}
            otherStyles="mt-7"
            placeHolder="Enter your username"
          />

          <CustomButton
            title="Send Reset Link"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row">
            <Link
              href="/sign-in"
              className="text-lg font-psemibold text-secondary"
            >
              Back to Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPassword;