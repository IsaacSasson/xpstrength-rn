// Path: /app/home/edit-workout.tsx
import React from "react";
import { useLocalSearchParams } from "expo-router";
import WorkoutEditor from "@/components/home/WorkoutEditor";

const EditWorkout = () => {
  const params = useLocalSearchParams();
  const dayParam = params.day as string | undefined;

  return <WorkoutEditor mode="edit" dayParam={dayParam} />;
};

export default EditWorkout;