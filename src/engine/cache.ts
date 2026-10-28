import { createHash } from 'crypto';
import { EventPlan, CleanContextPayload } from '../types/event.types';

/**
 * Cache entry with deterministic TTL expiration and payload.
 */
export interface CacheEntry<T> {
  readonly key: string;
  readonly value: T;
  readonly createdAt: number;
  lastAccessed: number;
}

/**
 * Performance metrics for the LRU plan cache.
 */
export interface CacheStats {
  readonly size: number;
  readonly capacity: number;
  readonly hits: number;
  readonly misses: number;
  readonly hitRate: number;
  readonly evictions: number;
}

/**
 * High-performance, memory-bounded LRU Cache for deterministic plan synthesis.
 * Eliminates redundant LLM compute cycles and guarantees sub-millisecond lookups.
 */
export class PlanCache<T = EventPlan> {
  private readonly capacity: number;
  private readonly ttlMs: number;
  private readonly store: Map<string, CacheEntry<T>> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  /**
   * @param capacity Maximum number of entries before LRU eviction (default: 200).
   * @param ttlMs Time-to-live in milliseconds (default: 3,600,000 ms = 1 hour).
   */
  constructor(capacity: number = 200, ttlMs: number = 3_600_000) {
    if (capacity <= 0) {
      throw new Error('Cache capacity must be a positive integer');
    }
    this.capacity = capacity;
    this.ttlMs = ttlMs;
  }

  /**
   * Generates a deterministic SHA-256 cache key from clean event context.
   */
  public generateKey(context: CleanContextPayload): string {
    const rawSignature = [
      context.eventType.toLowerCase(),
      Math.round(context.budget * 100) / 100,
      context.currency.toUpperCase(),
      context.guests,
      context.targetDate,
      context.sanitizedNotes.trim().toLowerCase(),
      context.tone.trim().toLowerCase(),
      context.lightingContext,
      context.venueType.trim().toLowerCase(),
    ].join('::');

    return createHash('sha256').update(rawSignature).digest('hex');
  }

  /**
   * Retrieves an item from the cache. Updates LRU access ordering.
   * Returns undefined if key is missing or expired.
   */
  public get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    const now = Date.now();
    // Expiration check
    if (now - entry.createdAt > this.ttlMs) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    // Refresh LRU order by deleting and re-inserting
    this.store.delete(key);
    entry.lastAccessed = now;
    this.store.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Stores an item in the cache. Evicts the least recently used entry if at capacity.
   */
  public set(key: string, value: T): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.capacity) {
      // The first item in Map iterator is the oldest / least recently accessed
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
        this.evictions++;
      }
    }

    const now = Date.now();
    this.store.set(key, {
      key,
      value,
      createdAt: now,
      lastAccessed: now,
    });
  }

  /**
   * Checks if key exists in cache and is not expired without updating LRU order.
   */
  public has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Removes a specific key from the cache.
   */
  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clears all cache entries and resets statistics.
   */
  public clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Returns current cache performance metrics.
   */
  public getStats(): CacheStats {
    const totalLookups = this.hits + this.misses;
    const hitRate = totalLookups > 0 ? Number((this.hits / totalLookups).toFixed(4)) : 0.0;

    return {
      size: this.store.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      evictions: this.evictions,
    };
  }
}
