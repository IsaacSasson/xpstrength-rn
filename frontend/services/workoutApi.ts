// Path: /services/workoutApi.ts
import { api } from '@/utils/api';
import { handleApiError } from '@/utils/handleApiError';

// Transform component Exercise to API exerciseObj2
export const transformExerciseToAPI = (exercise: any) => {
  // Extract max weight and reps from sets
  const weights = exercise.sets.map((set: any) => {
    const match = set.weight.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  });
  
  const reps = exercise.sets.map((set: any) => parseInt(set.reps) || 0);
  
  const transformed = {
    exercise: parseInt(exercise.originalExerciseId), // Convert to number
    weight: Math.max(...weights, 0), // Max weight from all sets
    reps: Math.max(...reps, 0), // Max reps from all sets
    sets: exercise.sets.length,
    cooldown: 60, // Default cooldown in seconds
  };

  console.log(`Transforming exercise "${exercise.name}":`, {
    original: exercise,
    transformed
  });

  return transformed;
};

// Transform API exerciseObj2 to component Exercise format
export const transformExerciseFromAPI = (apiExercise: any, exerciseDatabase: any[]) => {
  // Find exercise details from database
  const exerciseDetails = exerciseDatabase.find(ex => ex.id === apiExercise.exercise.toString());
  
  // Create sets array based on API data
  const sets = Array.from({ length: apiExercise.sets }, () => ({
    reps: apiExercise.reps.toString(),
    weight: `${apiExercise.weight} lbs`
  }));

  return {
    id: `ex_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: exerciseDetails?.name || `Exercise ${apiExercise.exercise}`,
    sets,
    notes: '', // Notes aren't stored in exerciseObj2, handled separately
    originalExerciseId: apiExercise.exercise.toString(),
  };
};

export interface CustomWorkout {
  id: number;
  name: string;
  exercises: any[];
}

export interface WorkoutPlan {
  plan: number[]; // Array of 7 workout IDs, -1 for rest days
}

// API Functions using your existing api utility
export const workoutApi = {
  // Create new custom workout
  async createCustomWorkout(name: string, exercises: any[]): Promise<{ success: boolean; workout?: CustomWorkout; error?: string }> {
    try {
      const validExercises = exercises.filter(ex => ex.originalExerciseId);
      
      if (validExercises.length === 0) {
        return { success: false, error: 'No valid exercises found. Please add exercises from the exercise library.' };
      }
      
      const transformedExercises = validExercises.map(transformExerciseToAPI);

      console.log('Creating workout with data:', { name, exercises: transformedExercises });

      const response = await api.post('/api/v1/user/custom-workout', {
        data: {
          exercises: transformedExercises,
          name
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Create workout API response:', result);
        
        // Handle the actual response structure from your API
        let workout;
        if (result.data && result.data.newCustomWorkout) {
          workout = result.data.newCustomWorkout;
        } else if (result.workout) {
          workout = result.workout;
        } else if (result.data) {
          workout = result.data;
        } else {
          workout = result;
        }
        
        if (!workout || !workout.id) {
          console.error('No workout ID found in response structure:', result);
          return { success: false, error: 'Server did not return a workout ID' };
        }
        
        console.log('Successfully extracted workout ID:', workout.id);
        return { success: true, workout };
      } else {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || 'Failed to create workout' };
      }
    } catch (error) {
      console.error('Create workout error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Update existing custom workout
  async updateCustomWorkout(id: number, name: string, exercises: any[]): Promise<{ success: boolean; workout?: CustomWorkout; error?: string }> {
    try {
      const validExercises = exercises.filter(ex => ex.originalExerciseId);
      
      if (validExercises.length === 0) {
        return { success: false, error: 'No valid exercises found. Please add exercises from the exercise library.' };
      }
      
      const transformedExercises = validExercises.map(transformExerciseToAPI);

      console.log('Updating workout with data:', { id, name, exercises: transformedExercises });

      const response = await api.put('/api/v1/user/custom-workout', {
        data: {
          exercises: transformedExercises,
          name,
          id
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Update workout API response:', result);
        
        // Handle the actual response structure from your API
        let workout;
        if (result.data && result.data.updatedCustomWorkout) {
          workout = result.data.updatedCustomWorkout;
        } else if (result.data && result.data.newCustomWorkout) {
          workout = result.data.newCustomWorkout;
        } else if (result.workout) {
          workout = result.workout;
        } else if (result.data) {
          workout = result.data;
        } else {
          // For updates, we at least know the ID we passed in
          workout = { id, name, exercises: [] };
        }
        
        console.log('Successfully processed update response for workout ID:', workout.id);
        return { success: true, workout };
      } else {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || 'Failed to update workout' };
      }
    } catch (error) {
      console.error('Update workout error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Get all custom workouts
  async getCustomWorkouts(): Promise<{ success: boolean; workouts?: CustomWorkout[]; error?: string }> {
    try {
      const response = await api.get('/api/v1/user/custom-workouts');

      if (response.ok) {
        const result = await response.json();
        console.log('Get custom workouts response:', result);
        
        // Backend returns data.customWorkouts
        const workouts = result.data?.customWorkouts || result.customWorkouts || [];
        return { success: true, workouts };
      } else {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || 'Failed to fetch workouts' };
      }
    } catch (error) {
      console.error('Get workouts error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Get current workout plan
  async getWorkoutPlan(): Promise<{ success: boolean; plan?: number[]; error?: string }> {
    try {
      const response = await api.get('/api/v1/user/workout-plan');

      if (response.ok) {
        const result = await response.json();
        console.log('Get workout plan response:', result);
        
        // Backend returns data.weeklyPlan
        const plan = result.data?.weeklyPlan || result.weeklyPlan || [-1, -1, -1, -1, -1, -1, -1];
        return { success: true, plan };
      } else {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || 'Failed to fetch workout plan' };
      }
    } catch (error) {
      console.error('Get workout plan error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Update workout plan
  async updateWorkoutPlan(plan: number[]): Promise<{ success: boolean; plan?: number[]; error?: string }> {
    try {
      console.log('Updating workout plan with:', plan);
      
      // First, let's see what the current plan looks like from the server
      console.log('Fetching current plan from server to check format...');
      const currentPlanResponse = await api.get('/api/v1/user/workout-plan');
      if (currentPlanResponse.ok) {
        const currentPlan = await currentPlanResponse.json();
        console.log('Current plan from server:', JSON.stringify(currentPlan, null, 2));
      }
      
      // Use "newPlan" instead of "plan" to match backend expectation
      const requestBody = {
        data: { newPlan: plan }  // <-- Changed from "plan" to "newPlan"
      };
      
      console.log('Request body being sent:', JSON.stringify(requestBody, null, 2));
      
      const response = await api.put('/api/v1/user/workout-plan', requestBody);

      if (response.ok) {
        const result = await response.json();
        console.log('Workout plan update response:', result);
        
        // Response uses "weeklyPlan" based on backend code
        return { success: true, plan: result.data?.weeklyPlan || result.weeklyPlan || plan };
      } else {
        const errorDetails = await handleApiError(response);
        console.error('Workout plan update failed:', errorDetails);
        return { success: false, error: errorDetails.error || 'Failed to update workout plan' };
      }
    } catch (error) {
      console.error('Update workout plan error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },

  // Delete custom workout
  async deleteCustomWorkout(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.delete('/api/v1/user/custom-workout', {
        body: JSON.stringify({
          data: { id }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Delete workout response:', result);
        return { success: true };
      } else {
        const errorDetails = await handleApiError(response);
        return { success: false, error: errorDetails.error || 'Failed to delete workout' };
      }
    } catch (error) {
      console.error('Delete workout error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  },
};