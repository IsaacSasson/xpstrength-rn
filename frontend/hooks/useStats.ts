import { useState, useEffect } from 'react';

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core';

export type MuscleData = {
  [key in MuscleGroup]: number;
};

export type MetricType = 'volume' | 'reps' | 'sets' | 'weight';

export type MetricData = {
  [key in MetricType]: MuscleData;
};

export type DataPoint = {
  date: string;
  value: number;
};

export type TimeSeriesData = {
  [key in MetricType]: DataPoint[];
};

// Mock data for the useStats hook - kept private within the hook
const MOCK_RADAR_DATA: MetricData = {
  volume: {
    chest: 85,
    back: 70,
    shoulders: 60,
    biceps: 75,
    triceps: 65,
    legs: 90,
    core: 55,
  },
  reps: {
    chest: 65,
    back: 80,
    shoulders: 75,
    biceps: 90,
    triceps: 60,
    legs: 55,
    core: 80,
  },
  sets: {
    chest: 75,
    back: 65,
    shoulders: 80,
    biceps: 60,
    triceps: 85,
    legs: 75,
    core: 70,
  },
  weight: {
    chest: 90,
    back: 75,
    shoulders: 60,
    biceps: 55,
    triceps: 70,
    legs: 95,
    core: 40,
  },
};

// Mock data for time series (pre-generated)
const MOCK_TIME_SERIES_DATA: TimeSeriesData = {
  volume: [
    { date: '2025-02-03', value: 3200 },
    { date: '2025-02-06', value: 3250 },
    { date: '2025-02-09', value: 3180 },
    { date: '2025-02-12', value: 3300 },
    { date: '2025-02-15', value: 3400 },
    { date: '2025-02-18', value: 3380 },
    { date: '2025-02-21', value: 3450 },
    { date: '2025-02-24', value: 3500 },
    { date: '2025-02-27', value: 3650 },
    { date: '2025-03-02', value: 3700 }
  ],
  reps: [
    { date: '2025-02-03', value: 82 },
    { date: '2025-02-06', value: 84 },
    { date: '2025-02-09', value: 83 },
    { date: '2025-02-12', value: 86 },
    { date: '2025-02-15', value: 87 },
    { date: '2025-02-18', value: 86 },
    { date: '2025-02-21', value: 89 },
    { date: '2025-02-24', value: 90 },
    { date: '2025-02-27', value: 92 },
    { date: '2025-03-02', value: 94 }
  ],
  sets: [
    { date: '2025-02-03', value: 15 },
    { date: '2025-02-06', value: 15 },
    { date: '2025-02-09', value: 16 },
    { date: '2025-02-12', value: 16 },
    { date: '2025-02-15', value: 17 },
    { date: '2025-02-18', value: 17 },
    { date: '2025-02-21', value: 18 },
    { date: '2025-02-24', value: 18 },
    { date: '2025-02-27', value: 19 },
    { date: '2025-03-02', value: 20 }
  ],
  weight: [
    { date: '2025-02-03', value: 185 },
    { date: '2025-02-06', value: 185 },
    { date: '2025-02-09', value: 190 },
    { date: '2025-02-12', value: 195 },
    { date: '2025-02-15', value: 195 },
    { date: '2025-02-18', value: 200 },
    { date: '2025-02-21', value: 205 },
    { date: '2025-02-24', value: 210 },
    { date: '2025-02-27', value: 215 },
    { date: '2025-03-02', value: 220 }
  ]
};

export const useStats = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch mock data with simulated loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch stats data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get radar data for a specific metric
  const getRadarData = (metric: MetricType): MuscleData => {
    return MOCK_RADAR_DATA[metric];
  };

  // Get time series data for a specific metric with specified number of points
  const getTimeSeriesData = (metric: MetricType, count: number = 10): DataPoint[] => {
    // Get the most recent data points up to the count
    const data = MOCK_TIME_SERIES_DATA[metric];
    return data.slice(-count);
  };

  // Function to get the most recent time series data points for the progress chart
  const getProgressData = (metric: MetricType, dataPoints: number = 10): DataPoint[] => {
    return MOCK_TIME_SERIES_DATA[metric].slice(-dataPoints);
  };

  return {
    // Status
    loading,
    error,
    
    // Getter functions
    getRadarData,
    getTimeSeriesData,
    getProgressData
  };
};