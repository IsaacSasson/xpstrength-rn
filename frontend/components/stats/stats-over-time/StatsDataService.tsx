import { MetricType, DataPoint } from './ProgressLineChart';

export type WorkoutData = {
  [key in MetricType]: DataPoint[];
};

// Generate realistic mock data for the last 11 workouts
export const generateMockData = (): WorkoutData => {
  // Generate dates for the last 11 workouts (about 3 times per week for ~4 weeks)
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 11; i++) {
    const workoutDate = new Date(today);
    // Go back i*2 or i*3 days to simulate 2-3 workouts per week
    workoutDate.setDate(today.getDate() - (i * (i % 2 === 0 ? 2 : 3)));
    dates.push(workoutDate.toISOString().split('T')[0]);
  }
  
  // Sort dates from oldest to newest for proper data progression
  dates.sort();
  
  // Generate data for each metric
  const result: WorkoutData = {
    volume: [],
    reps: [],
    sets: [],
    weight: []
  };
  
  // Base values and growth rates for each metric
  const baseValues = {
    volume: 3000, // total weight lifted (lbs)
    reps: 80,     // total repetitions
    sets: 15,     // total sets
    weight: 180   // average weight (lbs)
  };
  
  const growthRates = {
    volume: 150,  // ~ +150 lbs per workout
    reps: 2,      // ~ +2 reps per workout
    sets: 0.5,    // ~ +0.5 sets per workout
    weight: 2.5   // ~ +2.5 lbs per workout
  };
  
  // Generate data for each metric
  Object.keys(baseValues).forEach(metric => {
    const key = metric as MetricType;
    const baseValue = baseValues[key];
    const growthRate = growthRates[key];
    
    dates.forEach((date, index) => {
      // Add some randomness to simulate real workout fluctuations
      const randomFactor = Math.random() * growthRate * 0.8 - (growthRate * 0.4);
      // Progress increases over time with some randomness
      const value = baseValue + (growthRate * index) + randomFactor;
      
      result[key].push({
        date,
        value: Math.round(value * 10) / 10 // Round to 1 decimal place
      });
    });
  });
  
  return result;
};