// Path: /sign-in.tsx
import { View, ScrollView, Image, Text, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/logo.png";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";

import { api } from "@/utils/api";
import { useAuth } from "@/context/AuthProvider";
import { handleApiError } from "@/utils/handleApiError";

const SignIn = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const { signIn } = useAuth();

  const submit = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Error", "Please fill in all the fields");
      return;
    }

    try {
      setSubmitting(true);
      
      // Use the new api utility
      const response = await api.post('/api/v1/auth/login', {
        data: { 
          username: form.username.trim(), 
          password: form.password 
        },
      });

      if (!response.ok) {
        const { error } = await handleApiError(response);
        Alert.alert("Login failed", error ?? "Request failed");
        return;
      }

      // Extract token and basic user data from response
      const { data } = await response.json();
      console.log('📥 Login response data:', { 
        hasAccessToken: !!data?.accessToken,
        hasRefreshToken: !!data?.refreshToken,
        user: data?.user?.username
      });
      
      if (!data?.accessToken) {
        Alert.alert("Login Error", "No access token received");
        return;
      }

      // Create user object with just the username
      const userData = {
        id: data.user?.id ? String(data.user.id) : Date.now().toString(),
        username: data.user?.username || form.username.trim(),
        email: data.user?.email || '',
      };

      // FIXED: Await the atomic signIn function from AuthContext
      console.log('🔐 Calling signIn with refresh token:', !!data.refreshToken);
      await signIn(userData, data.accessToken, data.refreshToken);
      console.log('✅ SignIn completed, navigating to home');

      // Navigate to home - the WorkoutContext will handle fetching workout data
      router.replace("/(tabs)/home");
    } catch (networkErr) {
      console.error("Network error during login:", networkErr);
      Alert.alert("Network error", "Check your connection");
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
            placeHolder=""
          />

          {/* Forgot Username/Password Links */}
          <View className="mt-4">
            <View className="flex-row items-center justify-center space-x-4">
              <Link href="/forgot-username">
                <Text className="text-sm font-pregular text-secondary">
                  Forgot Username?
                </Text>
              </Link>
              <View className="w-px mx-auto" />
              <Link href="/forgot-password">
                <Text className="text-sm font-pregular text-secondary">
                  Forgot Password?
                </Text>
              </Link>
            </View>
          </View>

          <CustomButton
            title="Sign In"
            handlePress={submit}
            containerStyles="mt-4"
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