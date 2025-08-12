// Tiny generic LRU cache with safe eviction for TS strict mode.
// Keeps the N most recently used entries. On set/get, the key is moved to the back.

export default class LRUCache<K, V> {
  private map = new Map<K, V>();

  constructor(private capacity: number = 64) {}

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const val = this.map.get(key)!;
    // refresh recency
    this.map.delete(key);
    this.map.set(key, val);
    return val;
    }

  set(key: K, val: V): void {
    if (this.map.has(key)) {
      // refresh existing
      this.map.delete(key);
      this.map.set(key, val);
      return;
    }

    this.map.set(key, val);

    // Evict least recently used if over capacity
    if (this.map.size > this.capacity) {
      const iter = this.map.keys().next(); // { value: K, done: boolean }
      if (!iter.done) {
        // In strict mode, value is K | undefined, guard before delete
        const lruKey = iter.value as K;
        this.map.delete(lruKey);
      }
    }
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}