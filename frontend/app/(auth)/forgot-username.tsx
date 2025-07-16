import { View, ScrollView, Image, Text, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/logo.png";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";

import { api } from "@/utils/api";
import { handleApiError } from "@/utils/handleApiError";

const ForgotUsername = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');

  const submit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
        setSubmitting(true);
        
        // Use the new api utility
        const response = await api.post('/api/v1/auth/forgotUsername', {
          data: { email: email.trim().toLowerCase() },
        });

        if (!response.ok) {
            const { error } = await handleApiError(response);
            Alert.alert("Error", error ?? "Failed to send username. Please try again.");
            return;
        }

        // Show success message and then navigate
        Alert.alert(
          "Username Sent", 
          "Your username has been sent to your email address.",
          [
            { 
              text: "OK", 
              onPress: () => router.push("/sign-in") 
            }
          ]
        );
    } catch (networkErr) {
        console.error("Network error:", networkErr);
        Alert.alert("Network Error", "Please check your connection and try again.");
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
            Forgot Username
          </Text>

          <Text className="text-gray-100 text-base mt-4 font-pregular">
            Enter your email address and we'll send you your username.
          </Text>

          <FormField
            title="Email Address"
            value={email}
            handleChangeText={setEmail}
            otherStyles="mt-7"
            placeHolder="Enter your email"
            keyboardType="email-address"
          />

          <CustomButton
            title="Send Username"
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

export default ForgotUsername;