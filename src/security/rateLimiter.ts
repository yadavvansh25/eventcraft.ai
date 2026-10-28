import { Request, Response, NextFunction } from 'express';

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly resetTimeMs: number;
}

interface ClientBucket {
  timestamps: number[];
}

/**
 * High-precision, sliding-window in-memory rate limiter to prevent Denial of Wallet
 * and Token Exhaustion attacks.
 */
export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly buckets: Map<string, ClientBucket> = new Map();

  /**
   * @param maxRequests Maximum allowed requests per window (default: 60).
   * @param windowMs Sliding window duration in milliseconds (default: 60,000 ms = 1 minute).
   */
  constructor(maxRequests: number = 60, windowMs: number = 60_000) {
    if (maxRequests <= 0 || windowMs <= 0) {
      throw new Error('RateLimiter maxRequests and windowMs must be strictly positive');
    }
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Evaluates if a request from a client identifier is within acceptable limits.
   */
  public check(clientIdentifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let bucket = this.buckets.get(clientIdentifier);
    if (!bucket) {
      bucket = { timestamps: [] };
      this.buckets.set(clientIdentifier, bucket);
    }

    // Prune timestamps older than sliding window
    bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

    const count = bucket.timestamps.length;
    const allowed = count < this.maxRequests;

    if (allowed) {
      bucket.timestamps.push(now);
    }

    const oldestTimestamp = bucket.timestamps[0] ?? now;
    const resetTimeMs = Math.max(0, oldestTimestamp + this.windowMs - now);
    const remaining = Math.max(0, this.maxRequests - bucket.timestamps.length);

    return {
      allowed,
      limit: this.maxRequests,
      remaining,
      resetTimeMs,
    };
  }

  /**
   * Resets rate limit records for a specific client or all clients.
   */
  public reset(clientIdentifier?: string): void {
    if (clientIdentifier) {
      this.buckets.delete(clientIdentifier);
    } else {
      this.buckets.clear();
    }
  }

  /**
   * Garbage-collects stale client records to conserve memory.
   */
  public prune(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let pruned = 0;

    for (const [key, bucket] of this.buckets.entries()) {
      bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
      if (bucket.timestamps.length === 0) {
        this.buckets.delete(key);
        pruned++;
      }
    }

    return pruned;
  }
}

/**
 * Express middleware factory enforcing sliding-window rate limits.
 */
export function createRateLimitMiddleware(
  limiter: RateLimiter = new RateLimiter()
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'anonymous';

    const result = limiter.check(clientIp);

    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTimeMs / 1000).toString());

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please throttle your invocations.',
          retryAfterSeconds: Math.ceil(result.resetTimeMs / 1000),
        },
      });
      return;
    }

    next();
  };
}
