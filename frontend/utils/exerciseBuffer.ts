// Path: /utils/exerciseBuffer.ts
// Temporary storage for exercises during navigation
let tempExercises: any[] | null = null;

export const setTempExercises = (exercises: any[]) => {
  tempExercises = exercises;
};

export const getTempExercises = () => {
  const exercises = tempExercises;
  tempExercises = null; // Clear after getting to prevent reuse
  return exercises;
};

export const clearTempExercises = () => {
  tempExercises = null;
};

export const addTempExercise = (exercise: any) => {
  if (!tempExercises) {
    tempExercises = [];
  }
  tempExercises.push(exercise);
};

export const hasTempExercises = (): boolean => {
  return tempExercises !== null && tempExercises.length > 0;
};