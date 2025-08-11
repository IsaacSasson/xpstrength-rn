// Path: /app/(tabs)/profile/user-profile.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { useThemeContext } from "@/context/ThemeContext";
import { useWorkouts } from "@/context/WorkoutContext";
import defaultPfp from "@/assets/images/icon.png";

/* ------------------------------ field ------------------------------ */
const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}> = ({ label, value, onChangeText, placeholder }) => {
  const { tertiaryColor } = useThemeContext();
  return (
    <View className="mb-4">
      <Text className="text-gray-100 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        className="text-white px-4 py-3 rounded-xl"
        style={{ backgroundColor: tertiaryColor }}
      />
    </View>
  );
};

/* ---------------------------- helpers ---------------------------- */
const inchesFromFtIn = (ft: number, inch: number) => ft * 12 + inch;
const cmFromFtIn = (ft: number, inch: number) =>
  Math.round(inchesFromFtIn(ft, inch) * 2.54);
const ftInFromCm = (cm: number) => {
  const totalInches = Math.round(cm / 2.54);
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return { ft, inch };
};

/* ---------------------------- component ---------------------------- */
interface FormState {
  username: string;
  gender: "male" | "female";
  goal: string;
  avatarUri: string | null;
  heightFt: number;
  heightIn: number;
  weightLb: number; // store in lbs internally for backend compatibility
}

const UserProfile = () => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();
  const { unitSystem, convertWeight } = useWorkouts();

  const [form, setForm] = useState<FormState>({
    username: "",
    gender: "male",
    goal: "",
    avatarUri: null,
    heightFt: 5,
    heightIn: 8,
    weightLb: 170,
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* derived display values based on unit preference */
  const displayHeightCm = useMemo(
    () => cmFromFtIn(form.heightFt, form.heightIn),
    [form.heightFt, form.heightIn]
  );

  const displayWeightKg = useMemo(
    () => Math.round(convertWeight(form.weightLb, "imperial", "metric")),
    [form.weightLb, convertWeight]
  );

  /* image picker */
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const img = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      aspect: [1, 1],
    });
    if (!img.canceled && img.assets?.[0]?.uri)
      update("avatarUri", img.assets[0].uri);
  };

  /* save (stub) */
  const onSave = async () => {
    setSaving(true);
    try {
      // form.weightLb is already lbs, form.heightFt/In are inches-based
      console.log("Submitting profile:", form);
      await new Promise((r) => setTimeout(r, 1500));
      router.back();
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
      <SafeAreaView edges={["top"]}>
        <View className="px-4 pt-6 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <FontAwesome5 name="arrow-left" size={18} color={primaryColor} />
          </TouchableOpacity>
          <Text className="text-white font-pbold text-xl">Edit Profile</Text>
        </View>
      </SafeAreaView>

      {/* ------------------------ FORM ------------------------ */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding" })}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        >
          {/* avatar */}
          <View className="items-center mb-8">
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <Image
                source={form.avatarUri ? { uri: form.avatarUri } : defaultPfp}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 3,
                  borderColor: primaryColor,
                }}
              />
              <View
                className="absolute bottom-0 right-0 bg-black-200 rounded-full p-2"
                style={{ borderWidth: 2, borderColor: primaryColor }}
              >
                <FontAwesome5 name="camera" size={14} color={primaryColor} />
              </View>
            </TouchableOpacity>
          </View>

          {/* username */}
          <Field
            label="Username"
            value={form.username}
            onChangeText={(v) => update("username", v)}
          />

          {/* gender pills */}
          <Text className="text-gray-100 mb-1">Gender</Text>
          <View className="flex-row mb-4">
            {(["male", "female"] as const).map((g) => {
              const active = form.gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => update("gender", g)}
                  className="flex-1 mx-1 px-4 py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: active ? primaryColor : "transparent",
                    borderWidth: 2,
                    borderColor: active ? primaryColor : tertiaryColor,
                  }}
                >
                  <Text
                    style={{ color: active ? "#FFF" : secondaryColor }}
                    className="capitalize font-pmedium"
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* goal */}
          <Field
            label="Fitness Goal"
            value={form.goal}
            onChangeText={(v) => update("goal", v)}
            placeholder="e.g. Bench 315"
          />

          <View
            style={{
              height: 1,
              backgroundColor: "#2E2E42",
              marginVertical: 20,
            }}
          />

          {/* height + weight row */}
          <View className="flex-row">
            {/* ---- HEIGHT ---- */}
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text className="text-gray-100 text-base mb-1">Height</Text>

              {unitSystem === "metric" ? (
                <Picker
                  selectedValue={displayHeightCm}
                  onValueChange={(v: number) => {
                    const { ft, inch } = ftInFromCm(v);
                    update("heightFt", ft);
                    update("heightIn", inch);
                  }}
                  style={{ color: "#FFF" }}
                  itemStyle={{ color: "#FFF" }}
                >
                  {Array.from({ length: 230 - 120 + 1 }, (_, i) => 120 + i).map(
                    (cm) => (
                      <Picker.Item key={cm} label={`${cm} cm`} value={cm} />
                    )
                  )}
                </Picker>
              ) : (
                <View className="flex-row">
                  <Picker
                    selectedValue={form.heightFt}
                    onValueChange={(v: number) => update("heightFt", v)}
                    style={{ flex: 1, color: "#FFF" }}
                    itemStyle={{ color: "#FFF" }}
                  >
                    {Array.from({ length: 4 }, (_, i) => i + 4).map((ft) => (
                      <Picker.Item key={ft} label={`${ft} ft`} value={ft} />
                    ))}
                  </Picker>
                  <Picker
                    selectedValue={form.heightIn}
                    onValueChange={(v: number) => update("heightIn", v)}
                    style={{ flex: 1, color: "#FFF" }}
                    itemStyle={{ color: "#FFF" }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                      <Picker.Item key={inch} label={`${inch} in`} value={inch} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* ---- WEIGHT ---- */}
            <View style={{ width: 140, marginLeft: 6 }}>
              <Text className="text-gray-100 text-base mb-1">Weight</Text>

              {unitSystem === "metric" ? (
                <Picker
                  selectedValue={displayWeightKg}
                  onValueChange={(kg: number) => {
                    const lbs = Math.round(
                      convertWeight(kg, "metric", "imperial")
                    );
                    update("weightLb", lbs);
                  }}
                  style={{ width: "100%", color: "#FFF", borderRadius: 12 }}
                  itemStyle={{ color: "#FFF" }}
                >
                  {Array.from({ length: 230 - 30 + 1 }, (_, i) => 30 + i).map(
                    (kg) => (
                      <Picker.Item key={kg} label={`${kg} kg`} value={kg} />
                    )
                  )}
                </Picker>
              ) : (
                <Picker
                  selectedValue={form.weightLb}
                  onValueChange={(v: number) => update("weightLb", v)}
                  style={{ width: "100%", color: "#FFF", borderRadius: 12 }}
                  itemStyle={{ color: "#FFF" }}
                >
                  {Array.from({ length: 451 }, (_, i) => i + 50).map((lb) => (
                    <Picker.Item key={lb} label={`${lb} lb`} value={lb} />
                  ))}
                </Picker>
              )}
            </View>
          </View>

          {/* save button */}
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.9}
            className="px-8 py-4 rounded-2xl items-center"
            style={{
              backgroundColor: primaryColor,
              position: "absolute",
              bottom: 30,
              left: 0,
              right: 0,
              alignSelf: "center",
              marginHorizontal: 40,
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-pbold text-lg">Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default UserProfile;