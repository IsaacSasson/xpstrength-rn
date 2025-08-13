import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  Image,
  StyleSheet,
  LayoutChangeEvent,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { useUser } from "@/context/UserProvider";
import { userApi } from "@/services/userApi";
import { loadExercises } from "@/utils/loadExercises";
import Header from "@/components/Header";

// Notes sizing constants
const NOTES_MIN_HEIGHT = 120;   // starting box height
const NOTES_MAX_HEIGHT = 240;   // cap before making it scrollable

interface Exercise {
  id: string;
  name: string;
  force_measure: string;
  level: string;
  mechanic: string;
  equipment: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  instructions: string;
  category: string;
  images: number[];
}

const ExerciseDetail = () => {
  const { primaryColor, tertiaryColor } = useThemeContext();
  const { exerciseHistory, setExerciseNotes } = useUser();
  const params = useLocalSearchParams<{ id: string; scrollTo?: string }>();
  const exerciseId = params.id as string;
  const scrollTo = (params.scrollTo as string) || undefined;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Notes state
  const [currentNotes, setCurrentNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesHeight, setNotesHeight] = useState(NOTES_MIN_HEIGHT);

  const scrollRef = useRef<ScrollView>(null);
  const notesInputRef = useRef<any>(null);
  const [contentReady, setContentReady] = useState(false);
  const [didAutoScroll, setDidAutoScroll] = useState(false);

  useEffect(() => {
    try {
      const exercises = loadExercises();
      const foundExercise = exercises.find(
        (ex: Exercise) => ex.id === exerciseId
      );

      if (foundExercise) {
        setExercise(foundExercise);
      } else {
        const exerciseByName = exercises.find(
          (ex: Exercise) =>
            ex.name.toLowerCase().replace(/\s+/g, "-") ===
              exerciseId.toLowerCase() ||
            ex.name.toLowerCase() === exerciseId.toLowerCase()
        );
        setExercise(exerciseByName || null);
      }
    } catch (error) {
      console.error("Error loading exercise:", error);
      setExercise(null);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  // Load existing notes from history when exercise is loaded
  useEffect(() => {
    if (exercise && exerciseHistory) {
      const historyEntry = exerciseHistory[String(exercise.id)];
      setCurrentNotes(historyEntry?.notes || "");
    }
  }, [exercise, exerciseHistory]);

  useEffect(() => {
    if (exercise && exercise.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) =>
          prev === exercise.images.length - 1 ? 0 : prev + 1
        );
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [exercise]);

  // ✅ When requested, scroll to the bottom once content is ready (only once)
  useEffect(() => {
    if (!didAutoScroll && scrollTo === "bottom" && contentReady) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
        setDidAutoScroll(true);
      }, 700); // slight delay to ensure content is fully rendered
      return () => clearTimeout(t);
    }
  }, [scrollTo, contentReady, didAutoScroll]);

  // helper: normalize id to number or null
  const toServerExerciseId = (id: unknown): number | null => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  };

  const handleNotesSave = async (notes: string) => {
    if (!exercise) return;

    try {
      setNotesSaving(true);
      const serverId = toServerExerciseId(exercise.id);
      
      if (serverId == null) {
        // Cannot persist for exercises without canonical id
        console.warn("[Notes] Skipped save: non-canonical exercise id:", exercise.id);
        setCurrentNotes(notes);
        Alert.alert(
          "Note saved locally",
          "This exercise isn't linked to a library id yet, so the note can't be saved to history.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await userApi.saveExerciseNotes(serverId, notes);

      if (!result?.success) {
        Alert.alert(
          "Save Failed",
          result?.error || "Failed to save notes. Please try again.",
          [{ text: "OK" }]
        );
        return;
      }

      // success: reflect in current view + global cache so *new workouts* see it
      setCurrentNotes(notes);
      setExerciseNotes(serverId, notes);
    } catch (error) {
      console.error("❌ Error saving notes:", error);
      Alert.alert(
        "Save Failed",
        "Failed to save notes. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setNotesSaving(false);
    }
  };

  const capitalizeWords = (str: string) =>
    str.replace(/\b\w/g, (l) => l.toUpperCase());

  const formatInstructions = (instructions: string) =>
    instructions
      .split("., ")
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6 pb-4">
            <View className="flex-row items-center mb-4">
              <Text className="text-white font-psemibold text-xl">
                Loading...
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />
        <SafeAreaView edges={["top"]} className="bg-primary">
          <View className="px-4 pt-6 pb-4">
            <View className="flex-row items-center mb-4">
              <Header
                MText="Exercise Not Found"
                SText={`Could not find exercise with ID: ${exerciseId}`}
              />
            </View>
          </View>
        </SafeAreaView>
        <View className="flex-1 px-4 pt-6 items-center justify-center">
          <MaterialCommunityIcons
            name="dumbbell"
            size={80}
            color={primaryColor}
          />
          <Text className="text-white font-psemibold text-xl mt-4 text-center">
            Exercise Not Found
          </Text>
          <Text className="text-gray-100 text-center mt-2">
            The exercise you're looking for could not be found in the database.
          </Text>
          <Text className="text-gray-100 text-center mt-1 text-sm">
            Exercise ID: {exerciseId}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0E1A" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0E1A" />

      <SafeAreaView edges={["top"]} className="bg-primary">
        <View className="px-4 pt-6 pb-4">
          <View className="flex-row items-center mb-4">
            <Header
              MText={exercise.name}
              SText={`${capitalizeWords(exercise.category)} • ${capitalizeWords(
                exercise.level
              )}`}
            />
          </View>
        </View>
      </SafeAreaView>

      <TouchableWithoutFeedback
        onPress={() => {
          if (isEditingNotes) Keyboard.dismiss();
        }}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          onContentSizeChange={() => setContentReady(true)}
          keyboardShouldPersistTaps="handled"
        >
          {/* Exercise Images */}
          <View style={styles.imageContainer}>
            {exercise.images.length > 0 ? (
              <>
                {exercise.images.map((image, index) => (
                  <Image
                    key={index}
                    source={image}
                    style={[
                      styles.exerciseImage,
                      { opacity: currentImageIndex === index ? 1 : 0 },
                    ]}
                    resizeMode="cover"
                  />
                ))}
                {exercise.images.length > 1 && (
                  <View style={styles.imageIndicator}>
                    {exercise.images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          {
                            backgroundColor:
                              currentImageIndex === index
                                ? primaryColor
                                : "rgba(255,255,255,0.3)",
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View className="w-full h-full rounded-lg bg-black-200 items-center justify-center">
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={60}
                  color="#7b7b8b"
                />
              </View>
            )}
          </View>

          {/* Exercise Details */}
          <View className="mt-6">
            {/* Primary Muscles */}
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: tertiaryColor }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color={primaryColor}
                />
                <Text className="text-white font-psemibold text-lg ml-2">
                  Primary Muscles
                </Text>
              </View>
              <Text className="text-gray-100 text-base">
                {capitalizeWords(exercise.primaryMuscles)}
              </Text>
            </View>

            {/* Secondary Muscles */}
            {exercise.secondaryMuscles && (
              <View
                className="rounded-xl p-4 mb-4"
                style={{ backgroundColor: tertiaryColor }}
              >
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="target-variant"
                    size={20}
                    color={primaryColor}
                  />
                  <Text className="text-white font-psemibold text-lg ml-2">
                    Secondary Muscles
                  </Text>
                </View>
                <Text className="text-gray-100 text-base">
                  {capitalizeWords(exercise.secondaryMuscles)}
                </Text>
              </View>
            )}

            {/* Equipment & Details */}
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: tertiaryColor }}
            >
              <View className="flex-row items-center mb-3">
                <MaterialCommunityIcons
                  name="information"
                  size={20}
                  color={primaryColor}
                />
                <Text className="text-white font-psemibold text-lg ml-2">
                  Exercise Details
                </Text>
              </View>

              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-100 font-pmedium">Equipment:</Text>
                  <Text className="text-white">
                    {capitalizeWords(exercise.equipment)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-gray-100 font-pmedium">Difficulty:</Text>
                  <Text className="text-white">
                    {capitalizeWords(exercise.level)}
                  </Text>
                </View>

                {exercise.mechanic && exercise.mechanic !== "unknown" && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-100 font-pmedium">Mechanic:</Text>
                    <Text className="text-white">
                      {capitalizeWords(exercise.mechanic)}
                    </Text>
                  </View>
                )}

                {exercise.force_measure &&
                  exercise.force_measure !== "unknown" && (
                    <View className="flex-row justify-between">
                      <Text className="text-gray-100 font-pmedium">Force:</Text>
                      <Text className="text-white">
                        {capitalizeWords(exercise.force_measure)}
                      </Text>
                    </View>
                  )}
              </View>
            </View>

            {/* Notes Section */}
            <View
              className="rounded-xl p-4 mb-4"
              style={{ backgroundColor: tertiaryColor }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={20}
                    color={primaryColor}
                  />
                  <Text className="text-white font-psemibold text-lg ml-2">
                    Notes
                  </Text>
                </View>
                {notesSaving && (
                  <ActivityIndicator size="small" color={primaryColor} />
                )}
              </View>

              {isEditingNotes ? (
                <View
                  style={{
                    backgroundColor: "#1A1A1A",
                    padding: 16,
                    borderRadius: 8,
                  }}
                >
                  <TextInput
                    ref={notesInputRef}
                    value={currentNotes}
                    onChangeText={setCurrentNotes}
                    placeholder="Add your notes here..."
                    placeholderTextColor="#666"
                    multiline
                    textAlignVertical="top"
                    style={{
                      height: notesHeight,
                      maxHeight: NOTES_MAX_HEIGHT,
                      color: "white",
                      fontSize: 16,
                      fontFamily: "Poppins-Regular",
                    }}
                    autoFocus
                    onContentSizeChange={(e) => {
                      const h = e.nativeEvent.contentSize.height;
                      const clamped = Math.min(Math.max(h, NOTES_MIN_HEIGHT), NOTES_MAX_HEIGHT);
                      if (clamped !== notesHeight) setNotesHeight(clamped);
                    }}
                    scrollEnabled={notesHeight >= NOTES_MAX_HEIGHT}
                    onBlur={async () => {
                      await handleNotesSave(currentNotes);
                      setIsEditingNotes(false);
                    }}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setIsEditingNotes(true);
                    setTimeout(() => notesInputRef.current?.focus?.(), 0);
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#1A1A1A",
                      padding: 16,
                      borderRadius: 8,
                      minHeight: NOTES_MIN_HEIGHT,
                      maxHeight: NOTES_MAX_HEIGHT,
                    }}
                  >
                    {currentNotes.trim() ? (
                      <ScrollView
                        style={{ maxHeight: NOTES_MAX_HEIGHT - 2 }}
                        keyboardShouldPersistTaps="handled"
                      >
                        <Text className="text-white font-pregular text-base leading-6">
                          {currentNotes}
                        </Text>
                      </ScrollView>
                    ) : (
                      <Text className="text-gray-500 font-pregular text-base italic">
                        Tap here to add notes about this exercise...
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}

              {!isEditingNotes && currentNotes.trim() && (
                <TouchableOpacity
                  onPress={() => {
                    setIsEditingNotes(true);
                    setTimeout(() => notesInputRef.current?.focus?.(), 0);
                  }}
                  className="mt-3 px-4 py-2 rounded-lg"
                  style={{ borderWidth: 1, borderColor: primaryColor, alignSelf: 'flex-start' }}
                >
                  <Text className="text-white font-pmedium" style={{ color: primaryColor }}>
                    Edit Notes
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Instructions */}
            {exercise.instructions && (
              <View
                className="rounded-xl p-4 mb-4"
                style={{ backgroundColor: tertiaryColor }}
              >
                <View className="flex-row items-center mb-3">
                  <MaterialCommunityIcons
                    name="format-list-numbered"
                    size={20}
                    color={primaryColor}
                  />
                  <Text className="text-white font-psemibold text-lg ml-2">
                    Instructions
                  </Text>
                </View>

                {formatInstructions(exercise.instructions).map(
                  (instruction, index, array) => (
                    <View key={index} className="flex-row mb-2">
                      <Text
                        style={{ color: primaryColor }}
                        className="font-pmedium mr-2"
                      >
                        {index + 1}.
                      </Text>
                      <Text className="text-gray-100 flex-1 leading-5">
                        {instruction}
                        {index === array.length - 1 ? "" : "."}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: 250,
    position: "relative",
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: "#232533",
  },
  exerciseImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  imageIndicator: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default ExerciseDetail;