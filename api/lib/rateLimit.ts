// Simple in-memory sliding window rate limiter for serverless environment
const windowMs = 60 * 1000; // 1 minute
const maxRequests = 20;     // max 20 queries per minute per user

const rateMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userRecord = rateMap.get(userId);

  if (!userRecord || now > userRecord.resetTime) {
    rateMap.set(userId, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (userRecord.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  userRecord.count += 1;
  return { allowed: true, remaining: maxRequests - userRecord.count };
}
