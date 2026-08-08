import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { QueryLog } from './models/QueryLog.js';

const maxRequests = 20; // max 20 queries per 60s per user

export async function checkRateLimitDurable(userId: string): Promise<{ allowed: boolean; count: number }> {
  await connectDB();
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const count = await QueryLog.countDocuments({
    user_id: new mongoose.Types.ObjectId(userId),
    timestamp: { $gte: sixtySecondsAgo },
  });

  return {
    allowed: count < maxRequests,
    count,
  };
}
