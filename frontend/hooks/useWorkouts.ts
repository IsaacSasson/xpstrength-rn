import { useState, useEffect } from 'react';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  time: string;
  day?: string;
  scheduledTime?: string;
}

export interface DayWorkout {
  day: string;
  workout: Workout | { name: string; exercises: Exercise[] };
}

export const useWorkouts = () => {
  const [todaysWorkout, setTodaysWorkout] = useState<Workout | null>(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<DayWorkout[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data (simulated with mock data for now)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real app, these would be API calls
        // For now, we're just simulating API response times
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Mock data for today's workout
        const mockTodaysWorkout: Workout = {
          id: "today-1",
          name: "Push Day",
          exercises: [
            { name: "Bench Press", sets: 4, reps: "8-10" },
            { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
            { name: "Shoulder Press", sets: 3, reps: "10-12" },
            { name: "Tricep Pushdown", sets: 3, reps: "12-15" },
          ],
          time: "1h 15m",
          scheduledTime: "6:30 PM",
        };

        // Mock data for weekly workouts
        const mockWeeklyWorkouts: DayWorkout[] = [
          {
            day: "Monday",
            workout: {
              id: "mon-1",
              name: "Pull Day",
              exercises: [
                { name: "Pull-Ups", sets: 4, reps: "8-10" },
                { name: "Barbell Rows", sets: 3, reps: "10-12" },
                { name: "Face Pulls", sets: 3, reps: "12-15" },
                { name: "Bicep Curls", sets: 3, reps: "10-12" },
              ],
              time: "1h 10m",
            },
          },
          {
            day: "Tuesday",
            workout: {
              id: "tue-1",
              name: "Push Day",
              exercises: [
                { name: "Bench Press", sets: 4, reps: "8-10" },
                { name: "Incline Dumbbell Press", sets: 3, reps: "10-12" },
                { name: "Shoulder Press", sets: 3, reps: "10-12" },
                { name: "Tricep Pushdown", sets: 3, reps: "12-15" },
              ],
              time: "1h 15m",
            },
          },
          {
            day: "Wednesday",
            workout: { name: "Rest Day", exercises: [] },
          },
          {
            day: "Thursday",
            workout: {
              id: "thu-1",
              name: "Leg Day",
              exercises: [
                { name: "Squats", sets: 4, reps: "8-10" },
                { name: "Leg Press", sets: 3, reps: "10-12" },
                { name: "Romanian Deadlifts", sets: 3, reps: "10-12" },
                { name: "Calf Raises", sets: 4, reps: "15-20" },
              ],
              time: "1h 20m",
            },
          },
          {
            day: "Friday",
            workout: {
              id: "fri-1",
              name: "Upper Body",
              exercises: [
                { name: "Pull-Ups", sets: 3, reps: "8-10" },
                { name: "Bench Press", sets: 3, reps: "8-10" },
                { name: "Shoulder Press", sets: 3, reps: "10-12" },
                { name: "Bicep Curls", sets: 3, reps: "12-15" },
                { name: "Tricep Extensions", sets: 3, reps: "12-15" },
              ],
              time: "1h 30m",
            },
          },
          {
            day: "Saturday",
            workout: { name: "Rest Day", exercises: [] },
          },
          {
            day: "Sunday",
            workout: {
              id: "sun-1",
              name: "Lower Body",
              exercises: [
                { name: "Deadlifts", sets: 4, reps: "6-8" },
                { name: "Bulgarian Split Squats", sets: 3, reps: "10-12" },
                { name: "Leg Curls", sets: 3, reps: "12-15" },
                { name: "Calf Raises", sets: 4, reps: "15-20" },
              ],
              time: "1h 15m",
            },
          },
        ];

        // Mock data for recent workouts
        const mockRecentWorkouts: Workout[] = [
          {
            id: "recent-1",
            name: "Pull Day",
            exercises: [
              { name: "Pull-Ups", sets: 4, reps: "8-10" },
              { name: "Barbell Rows", sets: 3, reps: "10-12" },
              { name: "Face Pulls", sets: 3, reps: "12-15" },
              { name: "Bicep Curls", sets: 3, reps: "10-12" },
            ],
            time: "1h 10m",
          },
          {
            id: "recent-2",
            name: "Leg Day",
            exercises: [
              { name: "Squats", sets: 4, reps: "8-10" },
              { name: "Leg Press", sets: 3, reps: "10-12" },
              { name: "Romanian Deadlifts", sets: 3, reps: "10-12" },
              { name: "Calf Raises", sets: 4, reps: "15-20" },
            ],
            time: "1h 20m",
          },
          {
            id: "recent-3",
            name: "Upper Body",
            exercises: [
              { name: "Pull-Ups", sets: 3, reps: "8-10" },
              { name: "Bench Press", sets: 3, reps: "8-10" },
              { name: "Shoulder Press", sets: 3, reps: "10-12" },
            ],
            time: "1h 00m",
          },
        ];

        // Update state with mock data
        setTodaysWorkout(mockTodaysWorkout);
        setWeeklyWorkouts(mockWeeklyWorkouts);
        setRecentWorkouts(mockRecentWorkouts);
        setError(null);
      } catch (err) {
        setError('Failed to fetch workout data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to create a new workout
  const createWorkout = async (workout: Omit<Workout, 'id'>) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create a new workout with a dummy ID
      const newWorkout: Workout = {
        ...workout,
        id: `workout-${Date.now()}`,
      };
      
      // If it's a scheduled workout for today, update today's workout
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      if (workout.day === today) {
        setTodaysWorkout(newWorkout);
      }
      
      // Update weekly workouts
      if (workout.day) {
        setWeeklyWorkouts(prev => 
          prev.map(dayWorkout => 
            dayWorkout.day === workout.day
              ? { ...dayWorkout, workout: newWorkout }
              : dayWorkout
          )
        );
      }
      
      return newWorkout.id;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to create workout');
    }
  };

  // Function to update an existing workout
  const updateWorkout = async (id: string, updatedWorkout: Partial<Workout>) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update today's workout if it matches
      if (todaysWorkout && todaysWorkout.id === id) {
        setTodaysWorkout(prev => prev ? { ...prev, ...updatedWorkout } : null);
      }
      
      // Update in weekly workouts
      setWeeklyWorkouts(prev => 
        prev.map(dayWorkout => {
          if ('id' in dayWorkout.workout && dayWorkout.workout.id === id) {
            return { 
              ...dayWorkout, 
              workout: { ...dayWorkout.workout, ...updatedWorkout } 
            };
          }
          return dayWorkout;
        })
      );
      
      // Update in recent workouts
      setRecentWorkouts(prev => 
        prev.map(workout => 
          workout.id === id ? { ...workout, ...updatedWorkout } : workout
        )
      );
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Function to delete a workout
  const deleteWorkout = async (id: string) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Remove from today's workout if it matches
      if (todaysWorkout && todaysWorkout.id === id) {
        setTodaysWorkout(null);
      }
      
      // Update weekly workouts - replace with "Rest Day" if deleted
      setWeeklyWorkouts(prev => 
        prev.map(dayWorkout => {
          if ('id' in dayWorkout.workout && dayWorkout.workout.id === id) {
            return { 
              ...dayWorkout, 
              workout: { name: "Rest Day", exercises: [] } 
            };
          }
          return dayWorkout;
        })
      );
      
      // Remove from recent workouts
      setRecentWorkouts(prev => 
        prev.filter(workout => workout.id !== id)
      );
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Get the current day's workout from the weekly schedule
  const getCurrentDayWorkout = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return weeklyWorkouts.find(dayWorkout => dayWorkout.day === today)?.workout || null;
  };

  return {
    // Data
    todaysWorkout,
    weeklyWorkouts,
    recentWorkouts,
    loading,
    error,
    
    // Helper
    getCurrentDayWorkout,
    
    // CRUD operations
    createWorkout,
    updateWorkout,
    deleteWorkout
  };
};