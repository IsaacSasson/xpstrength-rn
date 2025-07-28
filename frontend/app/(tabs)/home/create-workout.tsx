// Path: /app/home/create-workout.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import WorkoutEditor from "@/components/home/WorkoutEditor";

const CreateWorkout = () => {
  const params = useLocalSearchParams();
  const dayParam = params.day as string | undefined;

  return <WorkoutEditor mode="create" dayParam={dayParam} />;
};

export default CreateWorkout;