export async function updateUserXP(user, deltaXP) {}

export async function userXpDelta(level) {
  const B = 100; // base XP
  const G = 1.1; // exponential growth factor
  const A = 0.6; // early‐level boost amplitude
  const C = 0.1; // boost decay rate
  const CAP = 7200; // asymptotic max ΔXP
  const K = 7200; // “half‐saturation” constant

  // 1) compute old boosted‐raw value
  const boost = 1 + A * Math.exp(-C * (level - 1));
  const raw = B * Math.pow(G, level - 1) * boost;

  // 2) saturate via:  f(raw) = CAP * raw / (raw + K)
  return Math.floor((raw * CAP) / (raw + K));
}

export async function muscleXpDelta(M) {
  // Clamp M into [1, 1000]
  const level = Math.min(Math.max(Math.floor(M), 1), 1000);

  // Internal tuning constants:
  const a = 2000; // linear slope
  const E = 0.25; // blend-rate (linear → exponential)
  const B = 120; // exponential base at M=1
  const H = 1.17; // exponential growth factor
  const Km = 20000; // half‑saturation constant
  const CAP = 20000; // asymptotic ceiling

  // 1) raw blend: linear component + exponential component
  const linPart = a * level * Math.exp(-E * (level - 1));
  const expPart = B * Math.pow(H, level - 1) * (1 - Math.exp(-E * (level - 1)));
  const raw = linPart + expPart;

  // 2) Michaelis–Menten saturation into [0, CAP]
  const delta = (CAP * raw) / (raw + Km);

  return Math.floor(delta);
}

export async function totalXpForUserLevel(level) {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    let x = await userXpDelta(L);
    total += x;
  }
  return total;
}

export async function totalXpForMuscleLevel(level) {
  let total = 0;
  for (let L = 1; L <= level; L++) {
    let x = await muscleXpDelta(L);
    total += x;
  }
  return total;
}

for (let i = 0; i < 101; i++) {
  const xp = await totalXpForUserLevel(i);
  console.log(`Total XP for user level ${i}, is ${xp}`);
}

for (let i = 0; i < 1001; i++) {
  const xp = await totalXpForMuscleLevel(i);
  console.log(`Total XP for muscle level ${i}, is ${xp}`);
}
