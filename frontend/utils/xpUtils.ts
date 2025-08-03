// Path: /utils/xpUtils.ts

/**
 * Calculate XP delta for a specific level (matches backend logic)
 */
export function userXpDelta(level: number): number {
  const B = 100;
  const G = 1.1;
  const A = 0.6;
  const C = 0.1;
  const CAP = 7200;
  const K = 7200;

  const boost = 1 + A * Math.exp(-C * (level - 1));
  const raw = B * Math.pow(G, level - 1) * boost;

  return Math.floor((raw * CAP) / (raw + K));
}

/**
 * Calculate total XP needed to reach a specific level
 */
export function totalXpForUserLevel(level: number): number {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    total += userXpDelta(L);
  }
  return total;
}

/**
 * Calculate XP progress information for the current level
 */
export function calculateXpProgress(currentLevel: number, currentXp: number) {
  // XP needed to reach current level
  const xpForCurrentLevel = totalXpForUserLevel(currentLevel);
  
  // XP needed to reach next level
  const xpForNextLevel = totalXpForUserLevel(currentLevel + 1);
  
  // XP gained in current level
  const currentXpInLevel = currentXp - xpForCurrentLevel;
  
  // XP needed to level up
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  
  // Progress percentage
  const percentage = Math.max(0, Math.min(100, (currentXpInLevel / xpNeededForNext) * 100));
  
  return {
    current: Math.max(0, currentXpInLevel),
    needed: xpNeededForNext,
    percentage,
    totalForCurrentLevel: xpForCurrentLevel,
    totalForNextLevel: xpForNextLevel,
  };
}