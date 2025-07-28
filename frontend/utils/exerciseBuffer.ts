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