// Path: /utils/activeWorkoutCache.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { log } from "@/utils/devLog";

const CACHE_PREFIX = "aw_cache_v2:";
const MAX_ENTRIES = 8;

export type CachedSession = {
  title: string;
  exercises: any[];
  ts?: number;
};

// Single, reliable cache key strategy
export function makeCacheKey(workoutId: number, unitSystem: string, exerciseIds: number[]): string {
  const sortedIds = exerciseIds.slice().sort((a, b) => a - b).join(',');
  return `${CACHE_PREFIX}${workoutId}_${unitSystem}_${sortedIds}`;
}

export async function readCachedSession(key: string): Promise<CachedSession | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function writeCachedSession(key: string, data: CachedSession): Promise<void> {
  try {
    const payload = { ...data, ts: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
    
    // Simple cleanup - keep only recent entries
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length > MAX_ENTRIES) {
      const toRemove = cacheKeys.slice(0, cacheKeys.length - MAX_ENTRIES);
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch (e) {
    // Silent fail - cache is optimization only
  }
}