import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import { adminMiddleware } from '../lib/auth.js';
import { User } from '../lib/models/User.js';
import { Expense } from '../lib/models/Expense.js';
import { QueryLog } from '../lib/models/QueryLog.js';
import { calculateUserBalance } from '../lib/balanceHelper.js';

import { setCorsHeaders } from '../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Admin Verification Middleware
  const admin = await adminMiddleware(req, res);
  if (!admin) return; // Returns 403 automatically if not admin

  await connectDB();

  const users = await User.find({}).lean();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await Promise.all(
    users.map(async u => {
      const uId = u._id.toString();
      const uIdObj = u._id as mongoose.Types.ObjectId;

      const [balanceData, totalTx, groqToday, groqAllTime, latestQuery, latestExpense] =
        await Promise.all([
          calculateUserBalance(uId, u.starting_balance ?? 0),
          Expense.countDocuments({ user_id: uIdObj }),
          QueryLog.countDocuments({ user_id: uIdObj, timestamp: { $gte: startOfDay } }),
          QueryLog.countDocuments({ user_id: uIdObj }),
          QueryLog.findOne({ user_id: uIdObj }).sort({ timestamp: -1 }).lean(),
          Expense.findOne({ user_id: uIdObj }).sort({ date: -1 }).lean(),
        ]);

      const createdDate = u.created_at ?? uIdObj.getTimestamp();
      const dates: Array<Date> = [createdDate];

      if (latestQuery?.timestamp) dates.push(new Date(latestQuery.timestamp));
      if (latestExpense?.date) dates.push(new Date(latestExpense.date));

      const lastActive = new Date(Math.max(...dates.map(d => d.getTime())));

      return {
        user_id: uId,
        username: u.username,
        name: u.name,
        starting_balance: u.starting_balance ?? 0,
        current_balance: balanceData.currentBalance,
        total_income: balanceData.totalIncome,
        total_spent: balanceData.totalSpent,
        total_transactions: totalTx,
        groq_requests_today: groqToday,
        groq_requests_all_time: groqAllTime,
        last_active: lastActive.toISOString(),
        created_at: createdDate.toISOString(),
      };
    })
  );

  // Sort by last_active descending
  result.sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime());

  return res.status(200).json({ users: result });
}
