import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Expense } from './lib/models/Expense.js';
import { User } from './lib/models/User.js';
import { authMiddleware } from './lib/auth.js';
import { setCorsHeaders } from './lib/cors.js';
import { ALL_CATEGORIES } from '../src/lib/categories.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  const auth = await authMiddleware(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectDB();

  const now = new Date();
  const reqYear = parseInt(req.query.year as string, 10) || now.getFullYear();
  const reqMonth = parseInt(req.query.month as string, 10) || (now.getMonth() + 1);

  // Month date range in local time
  const startDate = new Date(reqYear, reqMonth - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(reqYear, reqMonth, 0, 23, 59, 59, 999);

  const userIdObj = new mongoose.Types.ObjectId(auth.user_id);
  const user = await User.findById(auth.user_id).lean();
  const startingBalance = user?.starting_balance ?? 0;

  // 1. Get transactions prior to this month to compute start_balance
  const priorAgg = await Expense.aggregate([
    { $match: { user_id: userIdObj, date: { $lt: startDate } } },
    {
      $group: {
        _id: { $ifNull: ['$type', 'expense'] },
        total: { $sum: '$amount' },
      },
    },
  ]);

  let priorIncome = 0;
  let priorSpent = 0;
  for (const p of priorAgg) {
    if (p._id === 'income') priorIncome += p.total;
    else priorSpent += p.total;
  }
  const start_balance = Math.round((startingBalance + priorIncome - priorSpent) * 100) / 100;

  // 2. Get transactions within selected month
  const monthTransactions = await Expense.find({
    user_id: userIdObj,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: -1 })
    .lean();

  let income = 0;
  let spent = 0;
  const categoryTotals: Record<string, { amount: number; count: number }> = {};

  for (const t of monthTransactions) {
    const tType = t.type || 'expense';
    if (tType === 'income') {
      income += t.amount;
    } else {
      spent += t.amount;
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { amount: 0, count: 0 };
      }
      categoryTotals[t.category].amount += t.amount;
      categoryTotals[t.category].count += 1;
    }
  }

  income = Math.round(income * 100) / 100;
  spent = Math.round(spent * 100) / 100;
  const end_balance = Math.round((start_balance + income - spent) * 100) / 100;

  // Build category breakdown array
  const category_breakdown = Object.entries(categoryTotals).map(([catId, data]) => {
    const meta = ALL_CATEGORIES.find(c => c.id === catId);
    return {
      category: catId,
      label: meta?.label ?? catId,
      icon: meta?.icon ?? '📌',
      color: meta?.color ?? '#94a3b8',
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
      percentage: spent > 0 ? Math.round((data.amount / spent) * 100) : 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Total all-time current wallet balance
  const allAgg = await Expense.aggregate([
    { $match: { user_id: userIdObj } },
    {
      $group: {
        _id: { $ifNull: ['$type', 'expense'] },
        total: { $sum: '$amount' },
      },
    },
  ]);
  let allIncome = 0;
  let allSpent = 0;
  for (const a of allAgg) {
    if (a._id === 'income') allIncome += a.total;
    else allSpent += a.total;
  }
  const current_balance = Math.round((startingBalance + allIncome - allSpent) * 100) / 100;

  return res.status(200).json({
    year: reqYear,
    month: reqMonth,
    label: `${MONTH_NAMES[reqMonth - 1]} ${reqYear}`,
    start_balance,
    income,
    spent,
    end_balance,
    current_balance,
    category_breakdown,
    transaction_count: monthTransactions.length,
    transactions: monthTransactions,
  });
}
