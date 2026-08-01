// Simple in-memory rate limiter for WhatsApp API endpoints

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = store[identifier];

  if (!record || now > record.resetTime) {
    store[identifier] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { success: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetInMs: record.resetTime - now,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetInMs: record.resetTime - now,
  };
}
