import exercisesData from "@/assets/exercises.json";
import { exerciseImageMap } from "@/app/utils/exerciseImageMap";

/* ───────── Types ───────── */
export interface ExerciseData {
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

/* ───────── Loader ───────── */
type Row =
  | { type: "header"; version: string; comment: string }
  | { type: "database"; name: string }
  | { type: "table"; name: string; database: string; data: any[] };

/** Returns the parsed exercise array exactly like the one used in ExerciseList */
export const loadExercises = (): ExerciseData[] => {
  const rows = exercisesData as unknown as Row[];
  const tableRow = rows.find(
    (row): row is Extract<Row, { type: "table" }> =>
      row.type === "table" && Array.isArray((row as any).data)
  );
  const exerciseArray: any[] = tableRow?.data ?? [];

  return exerciseArray.map((exercise) => {
    /* Parse the image list and map to the require() numbers React-Native expects */
    let images: string[] = [];
    if (typeof exercise.images === "string") {
      try {
        images = JSON.parse(exercise.images);
      } catch {
        images = [];
      }
    } else if (Array.isArray(exercise.images)) {
      images = exercise.images;
    }
    const numericImages = images
      .map((p) => exerciseImageMap[p])
      .filter(Boolean) as number[];

    return { ...exercise, images: numericImages } as ExerciseData;
  });
};
