import { View, ScrollView, Image, Text, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/logo.png";
import FormField from "@/components/FormField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";

import { API_BASE } from "../config";
import { handleApiError } from '../utils/handleApiError';
import { saveToken } from "../utils/tokenStore";

const SignUp = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const submit = async () => {
    // simple validation
    if(!form.username || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all the fields')
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
          },
        }),
      });

      if (!response.ok) {
        const { error } = await handleApiError(response);
        console.log('Sign-up failed:', error ?? 'Request failed');
        return;
      }

      // backend now logs the user in right away
      const { data } = await response.json();
      if (data?.accessToken) {
        await saveToken(data.accessToken);   // secure-store, etc.
      }

      // drop them straight into the main tab stack
      router.replace('/(tabs)/home');
    } catch (networkErr) {
      console.error('Network error:', networkErr);
      console.log('Network error', 'Check your connection');
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
            Sign Up to XPStrength
          </Text>
          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-10"
            
            placeHolder={""}
          />

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
            placeHolder={""}
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
            placeHolder={""}
          />

          <CustomButton
            title="Sign Up"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Already Have An Account?
            </Text>
            <Link
              href="/sign-in"
              className="text-lg font-psemibold text-secondary"
            >
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;

