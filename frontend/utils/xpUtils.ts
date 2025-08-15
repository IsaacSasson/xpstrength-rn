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

export function muscleXpDelta(M: number): number {
  const level = Math.min(Math.max(Math.floor(M), 1), 1000);
  const a = 2000;
  const E = 0.25;
  const B2 = 120;
  const H = 1.17;
  const Km = 20000;
  const CAP2 = 20000;

  const linPart = a * level * Math.exp(-E * (level - 1));
  const expPart = B2 * Math.pow(H, level - 1) * (1 - Math.exp(-E * (level - 1)));
  const raw = linPart + expPart;
  return Math.floor((CAP2 * raw) / (raw + Km));
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

export function totalXpForMuscleLevel(level: number): number {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    total += muscleXpDelta(L);
  }
  return total;
}