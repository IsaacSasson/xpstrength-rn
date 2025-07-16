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

  const { setAccessToken, setUser } = useAuth();

  const submit = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Error", "Please fill in all the fields");
      return;
    }

    try {
      setSubmitting(true);
      
      // Use the new api utility - AuthProvider handles auth headers automatically
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

      // Pull token and user data out and update auth context
      const { data } = await response.json();
      
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
      }
      
      if (data?.user) {
        setUser(data.user);
      }

      // logged in – drop them on the first tab & wipe auth stack
      router.replace("/(tabs)/home");
    } catch (networkErr) {
      console.error("Network error:", networkErr);
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
            placeHolder={""}
          />

          {/* Forgot Username/Password Links */}
          <View className="mt-4">
            <View className="flex-row items-center justify-center space-x-4">
              <Link href="/forgot-username">
                <Text className="text-sm font-pregular text-secondary">
                  Forgot Username?
                </Text>
              </Link>
              <View className="w-px h-4 bg-gray-600" />
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