// Path: /utils/devLog.ts
// Minimal logging - only 2-3 key events

export const DEBUG_LOGS = true; // set false to silence completely

export function log(...args: any[]) {
  if (DEBUG_LOGS) console.log(...args);
}

// Remove time/timeEnd functions to reduce log noise
// Only use log() for the 2-3 most important events