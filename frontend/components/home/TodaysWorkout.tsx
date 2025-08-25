// Path: /components/home/TodaysWorkout.tsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemeContext } from "@/context/ThemeContext";
import { router, useNavigation } from "expo-router";
import type { Href } from "expo-router";
import DraggableBottomSheet from "@/components/DraggableBottomSheet";
import { useWorkouts } from "@/context/WorkoutContext";
import { setLaunchPreset } from "@/utils/workoutLaunch";
import { prewarmActiveSession } from "@/utils/prewarmActiveSession";
import WorkoutEventListener from "@/components/home/WorkoutEventListener";

/* ----------------------------- Types ----------------------------------- */
export interface WorkoutType {
  exists: boolean;
  isRest?: boolean;
  name?: string;
  calories?: number;
  exercises?: { name: string; sets: number; reps: string }[];
}

interface Props {
  workout: WorkoutType | null;
  allowCreate?: boolean;
  selectedDate?: Date;
}

/* -------------------------- Constants ---------------------------------- */
const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/* --------------------------- Component --------------------------------- */
const TodaysWorkout: React.FC<Props> = ({ workout, allowCreate = true, selectedDate }) => {
  const { primaryColor, secondaryColor, tertiaryColor } = useThemeContext();

  const {
    customWorkouts,
    getWorkoutForDay,
    setPlanDay,
    refreshData,
    unitSystem,
    getExerciseMeta,
    parseWeight,
    convertWeight,
  } = useWorkouts();

  const navigation = useNavigation();

  const dayIndex = useMemo(
    () => (selectedDate ? selectedDate.getDay() : new Date().getDay()),
    [selectedDate]
  );
  const dayName = useMemo(
    () =>
      selectedDate
        ? selectedDate.toLocaleDateString("en-US", { weekday: "long" })
        : daysOfWeek[dayIndex],
    [selectedDate, dayIndex]
  );

  /* -------------------- Typed href helpers (Href-safe) ------------------- */
  const createWorkoutHref = useMemo<Href>(() => {
    return dayName
      ? ({ pathname: "/home/create-workout", params: { day: dayName } } as const)
      : ("/home/create-workout" as const);
  }, [dayName]);

  const editWorkoutHref = useMemo<Href>(() => {
    return dayName
      ? ({ pathname: "/home/edit-workout", params: { day: dayName } } as const)
      : ("/home/edit-workout" as const);
  }, [dayName]);

  const goToEditWorkout = () => {
    router.push(editWorkoutHref);
  };

  /* ----------------------------------------------------------------------
     Build the lightweight launch preset from a workout object.
  ----------------------------------------------------------------------- */
  const buildLaunchPresetFromWorkout = useCallback((workoutData: any) => {
    const weightUnit = unitSystem === "metric" ? "kg" : "lbs";
    
    console.log("🔍 DEBUG - Building launch preset with unit system:", unitSystem);
    console.log("🔍 DEBUG - Raw workout data:", JSON.stringify(workoutData, null, 2));
    
    return {
      name: workoutData.name || "Workout",
      dayIndex,
      workoutId: workoutData.id,
      exercises: (workoutData.exercises || []).map((ex: any) => {
        const exerciseId = Number(ex.exercise ?? ex.id);
        
        console.log(`🔍 DEBUG - Processing exercise ${exerciseId}:`, {
          originalSets: ex.sets,
          originalReps: ex.reps,
          setsIsArray: Array.isArray(ex.sets)
        });

        // Handle array of sets (new format with individual set data)
        if (Array.isArray(ex.sets) && ex.sets.length > 0) {
          const processedSets = ex.sets.map((s: any, index: number) => {
            const reps = Number(s?.reps) || 10;
            
            // Handle weight with multiple possible formats
            let weight = `0 ${weightUnit}`;
            if (s?.weight != null) {
              const weightValue = s.weight;
              console.log(`🔍 DEBUG - Set ${index} weight value:`, weightValue, typeof weightValue);
              
              if (typeof weightValue === 'string') {
                // If already formatted with units, use as-is
                if (weightValue.includes('lbs') || weightValue.includes('kg')) {
                  weight = weightValue;
                } else {
                  // Parse number from string and add units
                  const numValue = parseFloat(weightValue) || 0;
                  weight = `${numValue} ${weightUnit}`;
                }
              } else if (typeof weightValue === 'number') {
                weight = `${weightValue} ${weightUnit}`;
              }
            }
            
            console.log(`🔍 DEBUG - Set ${index} processed:`, { reps, weight });
            
            return { reps, weight };
          });

          return {
            id: exerciseId,
            sets: processedSets,
            setsCount: ex.sets.length,
            reps: 0, // Not used when sets array exists
          };
        }
        
        // Handle legacy format (sets as count, reps as default)
        const setsCount = Math.max(Number(ex.sets ?? 0), 3);
        const defaultReps = Number(ex.reps ?? 10);
        
        console.log(`🔍 DEBUG - Using legacy format for exercise ${exerciseId}:`, {
          setsCount,
          defaultReps
        });
        
        return {
          id: exerciseId,
          sets: [],
          setsCount,
          reps: defaultReps,
        };
      }),
    };
  }, [dayIndex, unitSystem]);

  /* ----------------------------------------------------------------------
     Background prewarming: data + SVGs (non-blocking)
  ----------------------------------------------------------------------- */
  useEffect(() => {
    const workoutData = getWorkoutForDay(dayIndex);
    if (!workoutData || !workoutData.exercises || workoutData.exercises.length === 0) return;

    const launchPreset = buildLaunchPresetFromWorkout(workoutData);
    prewarmActiveSession({
      launchPreset,
      unitSystem,
      getExerciseMeta,
      parseWeight,
      convertWeight,
      primaryColor,
      secondaryColor,
    });
  }, [
    dayIndex,
    getWorkoutForDay,
    unitSystem,
    buildLaunchPresetFromWorkout,
    getExerciseMeta,
    parseWeight,
    convertWeight,
    primaryColor,
    secondaryColor
  ]);

  /* ----------------------------------------------------------------------
     Preload the ActiveWorkout route bundle so navigation is instant
  ----------------------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          import("@/app/(tabs)/home/active-workout"),
          import("@/components/home/ActiveWorkout/CarouselCard"),
          import("@/components/home/ActiveWorkout/AddExerciseCard"),
          import("@/components/home/ActiveWorkout/Header"),
          import("@/components/home/ActiveWorkout/Footer"),
        ]);
      } catch {
        // ignore – warm up only
      }
    })();
  }, []);

  /* ----------------------------------------------------------------------
     Start Workout: navigate immediately; ActiveWorkout shows loader first
  ----------------------------------------------------------------------- */
  const goToActiveWorkout = () => {
    const workoutData = getWorkoutForDay(dayIndex);
    
    // DEBUG: Log the actual workout data structure
    console.log("🔍 DEBUG - Raw workout data from getWorkoutForDay:", JSON.stringify(workoutData, null, 2));
    
    if (!workoutData || !workoutData.exercises || workoutData.exercises.length === 0) {
      Alert.alert("No workout", "This day doesn't have an assigned workout.");
      return;
    }

    // DEBUG: Log individual exercises
    workoutData.exercises.forEach((ex: any, index: number) => {
      console.log(`🔍 DEBUG - Exercise ${index}:`, {
        id: ex.exercise || ex.id,
        sets: ex.sets,
        reps: ex.reps,
      });
    });

    const launchPreset = buildLaunchPresetFromWorkout(workoutData);
    
    // DEBUG: Log the processed launch preset
    console.log("🔍 DEBUG - Processed launch preset:", JSON.stringify(launchPreset, null, 2));
    
    setLaunchPreset(launchPreset);

    router.replace({ pathname: "/home/active-workout" });
  };

  const data: WorkoutType = workout ?? { exists: false };

  const [isRestDay, setIsRestDay] = useState<boolean>(!!data.isRest);
  useEffect(() => {
    setIsRestDay(!!(workout && workout.isRest));
  }, [workout]);

  const [assignSheetVisible, setAssignSheetVisible] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const openAssignSheet = () => setAssignSheetVisible(true);
  const closeAssignSheet = () => setAssignSheetVisible(false);

  // Defensive: if the screen loses focus, close the sheet so it can't linger
  useEffect(() => {
    const unsub = (navigation as any)?.addListener?.("blur", () => {
      setAssignSheetVisible(false);
    });
    return unsub ?? (() => {});
  }, [navigation]);

  // Utility: close sheet, then navigate after the close animation finishes
  const navigateAfterClose = useCallback(
    (href: Href) => {
      setAssignSheetVisible(false);
      setTimeout(() => {
        router.push(href);
      }, 220);
    },
    []
  );

  const handleChooseRest = async () => {
    try {
      setIsAssigning(true);
      const ok = await setPlanDay(dayIndex, -1);
      if (!ok) throw new Error("Failed to set rest day");
      setIsRestDay(true);
      await refreshData();
      closeAssignSheet();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update day");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleChooseWorkout = async (workoutId: number) => {
    try {
      setIsAssigning(true);
      const ok = await setPlanDay(dayIndex, workoutId);
      if (!ok) throw new Error("Failed to assign day to workout");
      setIsRestDay(false);
      await refreshData();
      closeAssignSheet();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update day");
    } finally {
      setIsAssigning(false);
    }
  };

  // Custom event handler for workout achievements
  const handleWorkoutEvents = useCallback((events: any[]) => {
    // Only show success message for level ups since other achievements 
    // are better shown on the finished workout screen
    const levelUpEvents = events.filter(e => e.type === 'userLevelUp');
    if (levelUpEvents.length > 0) {
      const event = levelUpEvents[0];
      Alert.alert(
        "🎉 Level Up!",
        `You reached level ${event.payload.newLevel}!`,
        [{ text: "Awesome!", style: "default" }]
      );
    }
  }, []);

  return (
    <>
      {/* Event listener for real-time notifications */}
      <WorkoutEventListener
        showNotifications={false} // Handle custom notifications below
        autoMarkAsSeen={true}
        hapticFeedback={true}
        onEvent={handleWorkoutEvents}
      />
      
      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: tertiaryColor }}>
        {isRestDay ? (
          <View className="items-center py-8">
            <MaterialCommunityIcons name="weather-night" size={50} color={primaryColor} />
            <Text className="text-white font-psemibold text-center mt-4 text-lg">Rest Day</Text>
            <Text className="text-gray-100 text-center mt-2 mb-4">
              {dayName ? `${dayName} is set as a rest day.` : "This date is set as a rest day."}
            </Text>

            {allowCreate && (
              <TouchableOpacity
                onPress={openAssignSheet}
                style={{ backgroundColor: primaryColor }}
                className="flex-row items-center px-6 py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <FontAwesome5 name="exchange-alt" size={14} color="#FFF" />
                <Text className="text-white font-pmedium ml-2">Change your mind</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : data.exists ? (
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="font-pbold"
                style={{ color: primaryColor, fontSize: 20, lineHeight: 26 }}
                numberOfLines={1}
              >
                {data.name ?? "Workout"}
              </Text>

              <View className="flex-row items-center">
                {allowCreate && (
                  <TouchableOpacity onPress={openAssignSheet} className="p-2 mr-5" activeOpacity={0.8}>
                    <FontAwesome5 name="exchange-alt" size={18} color="#FFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={goToEditWorkout} className="py-2" activeOpacity={0.8}>
                  <FontAwesome5 name="pencil-alt" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {data.exercises && data.exercises.length > 0 ? (
              <View className="mb-4">
                {data.exercises.map((ex, idx) => (
                  <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                    <MaterialCommunityIcons name="dumbbell" size={18} color={primaryColor} />
                    <Text className="text-white font-pmedium ml-3 flex-1" numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text className="text-gray-100 ml-2">
                      {ex.sets} sets × {ex.reps}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="mb-4 py-2">
                <Text className="text-gray-100 text-center">
                  No exercises configured for this workout
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center">
                <FontAwesome5 name="fire" size={14} color="#f97316" />
                <Text className="text-orange-500 ml-2">≈ {data.calories ?? 0} kcal</Text>
              </View>

              <TouchableOpacity
                onPress={goToActiveWorkout}
                style={{ backgroundColor: primaryColor }}
                className="flex-row items-center px-4 py-2 rounded-lg"
                activeOpacity={0.7}
              >
                <FontAwesome5 name="play" size={14} color="#FFF" />
                <Text className="text-white font-pmedium ml-2">Start Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* No workout set for this day: show Rest Day look */
          <View className="items-center py-8">
            <MaterialCommunityIcons name="weather-night" size={50} color={primaryColor} />
            <Text className="text-white font-pmedium text-center mt-4 text-lg">
              Rest Day
            </Text>
            <Text className="text-gray-100 text-center mt-2 mb-4">
              {allowCreate
                ? `You don't have a workout planned for ${dayName ? dayName : "this date"}.`
                : "Past date—workouts can't be added here."}
            </Text>

            {allowCreate && (
              <TouchableOpacity
                onPress={openAssignSheet}
                style={{ backgroundColor: primaryColor }}
                className="flex-row items-center px-6 py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <FontAwesome5 name="exchange-alt" size={14} color="#FFF" />
                <Text className="text-white font-pmedium ml-2">Assign Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <DraggableBottomSheet
          visible={assignSheetVisible}
          onClose={closeAssignSheet}
          primaryColor={primaryColor}
          heightRatio={0.6}
          scrollable
          keyboardOffsetRatio={0}
        >
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Text className="text-white text-xl font-psemibold text-center">
              {dayName ? `Edit ${dayName}` : "Edit Day"}
            </Text>
            <Text className="text-gray-100 text-center mt-1">
              Choose a routine for this day, or set it as a rest day.
            </Text>
            {isAssigning && (
              <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator size="small" color={primaryColor} />
                <Text className="text-white ml-2">Assigning…</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={isAssigning ? undefined : handleChooseRest}
            activeOpacity={0.85}
            style={{
              opacity: isAssigning ? 0.6 : 1,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons name="weather-night" size={20} color={primaryColor} />
            <Text className="text-white ml-10 text-base font-pmedium">Rest Day</Text>
          </TouchableOpacity>

          {allowCreate && (
            <TouchableOpacity
              onPress={
                isAssigning ? undefined : () => navigateAfterClose(createWorkoutHref)
              }
              activeOpacity={0.9}
              style={{
                opacity: isAssigning ? 0.6 : 1,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <FontAwesome5 name="plus" size={16} color={primaryColor} />
              <Text className="text-white ml-10 text-base font-pmedium">Create Workout</Text>
            </TouchableOpacity>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: "rgba(255,255,255,0.08)",
              marginVertical: 12,
            }}
          />

          <Text className="text-white/80 mb-12">Your Workouts</Text>

          {customWorkouts.length === 0 ? (
            <View
              style={{
                paddingVertical: 18,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text className="text-white/80">You don't have any workouts yet.</Text>
              {allowCreate && (
                <TouchableOpacity
                  onPress={() => navigateAfterClose(createWorkoutHref)}
                  style={{
                    marginTop: 12,
                    alignSelf: "flex-start",
                    backgroundColor: primaryColor,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={0.9}
                >
                  <FontAwesome5 name="plus" size={12} color="#FFF" />
                  <Text className="text-white ml-2 font-pmedium">Create Workout</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            customWorkouts.map((w: any) => (
              <TouchableOpacity
                key={w.id}
                onPress={isAssigning ? undefined : () => handleChooseWorkout(w.id)}
                activeOpacity={0.9}
                style={{
                  opacity: isAssigning ? 0.6 : 1,
                  backgroundColor: tertiaryColor,
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <FontAwesome5 name="clipboard-list" size={16} color={primaryColor} />
                  <Text className="text-white ml-10 text-base font-pmedium">{w.name}</Text>
                </View>

                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderRadius: 999,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.08)",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <MaterialCommunityIcons name="timer-outline" size={16} color={primaryColor} />
                  <Text className="text-white ml-2 text-xs">
                    {Math.max(
                      15,
                      Math.round(
                        (w.exercises ?? []).reduce((s: number, ex: any) => {
                          if (Array.isArray(ex.sets)) return s + ex.sets.length;
                          return s + (ex.sets || 0);
                        }, 0) * 2
                      )
                    )}{" "}
                    min
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </DraggableBottomSheet>
      </View>
    </>
  );
};

export default TodaysWorkout;