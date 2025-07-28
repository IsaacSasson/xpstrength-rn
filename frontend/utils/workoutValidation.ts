// Path: /utils/workoutValidation.ts

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validExerciseCount: number;
  invalidExerciseCount: number;
  invalidExerciseNames: string[];
}

export const validateWorkoutForSave = (workout: {
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    originalExerciseId?: string;
    sets: Array<{ reps: string; weight: string }>;
  }>;
}): ValidationResult => {
  const errors: string[] = [];
  const invalidExerciseNames: string[] = [];

  // Check workout name
  if (!workout.name.trim()) {
    errors.push("Workout name is required");
  }

  // Check if any exercises exist
  if (workout.exercises.length === 0) {
    errors.push("At least one exercise is required");
  }

  // Check each exercise
  let validCount = 0;
  let invalidCount = 0;

  workout.exercises.forEach(exercise => {
    if (!exercise.originalExerciseId) {
      invalidCount++;
      invalidExerciseNames.push(exercise.name);
    } else {
      // Check if exercise has valid sets
      const validSets = exercise.sets.filter(set => {
        const reps = parseInt(set.reps);
        const weight = parseFloat(set.weight.replace(/[^0-9\.]/g, ''));
        return !isNaN(reps) && reps > 0 && !isNaN(weight) && weight >= 0;
      });

      if (validSets.length === 0) {
        invalidCount++;
        invalidExerciseNames.push(`${exercise.name} (invalid sets data)`);
      } else {
        validCount++;
      }
    }
  });

  if (invalidCount > 0) {
    if (invalidExerciseNames.some(name => !name.includes('(invalid sets data)'))) {
      errors.push("Some exercises are missing required data and need to be re-added from the exercise library");
    }
    if (invalidExerciseNames.some(name => name.includes('(invalid sets data)'))) {
      errors.push("Some exercises have invalid sets data (reps/weight must be numbers)");
    }
  }

  if (validCount === 0 && workout.exercises.length > 0) {
    errors.push("No valid exercises found");
  }

  return {
    isValid: errors.length === 0,
    errors,
    validExerciseCount: validCount,
    invalidExerciseCount: invalidCount,
    invalidExerciseNames
  };
};

export const getDetailedValidationMessage = (result: ValidationResult): string => {
  if (result.isValid) {
    return "Workout is ready to save!";
  }

  let message = "Cannot save workout:\n\n";
  
  result.errors.forEach((error, index) => {
    message += `${index + 1}. ${error}\n`;
  });

  if (result.invalidExerciseNames.length > 0) {
    message += `\nProblematic exercises:\n`;
    result.invalidExerciseNames.forEach(name => {
      message += `• ${name}\n`;
    });
  }

  if (result.invalidExerciseCount > 0 && result.validExerciseCount > 0) {
    message += `\n${result.validExerciseCount} exercises are valid, ${result.invalidExerciseCount} need attention.`;
  }

  return message.trim();
};