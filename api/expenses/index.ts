import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import { Expense } from '../lib/models/Expense.js';
import { User } from '../lib/models/User.js';
import { authMiddleware } from '../lib/auth.js';
import { ALL_CATEGORIES } from '../../src/lib/categories.js';

const VALID_CATEGORIES = ALL_CATEGORIES.map(c => c.id);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface MonthlyAnalytics {
  year: number;
  month: number;
  label: string;
  start_balance: number;
  income: number;
  expense: number;
  net: number;
  end_balance: number;
}

import { setCorsHeaders } from '../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  const auth = await authMiddleware(req, res);
  if (!auth) return;

  await connectDB();

  // ─── GET — paginated list + computed balance + monthly analytics ───
  if (req.method === 'GET') {
    const page  = parseInt(req.query.page as string ?? '1', 10);
    const limit = parseInt(req.query.limit as string ?? '20', 10);
    const skip  = (page - 1) * limit;

    const [expenses, total, user, sumResult, monthlyRaw] = await Promise.all([
      Expense.find({ user_id: auth.user_id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments({ user_id: auth.user_id }),
      User.findById(auth.user_id).lean(),
      Expense.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(auth.user_id) } },
        {
          $group: {
            _id: { $ifNull: ['$type', 'expense'] },
            total: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(auth.user_id) } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: { $ifNull: ['$type', 'expense'] },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    let total_spent  = 0;
    let total_income = 0;

    for (const item of sumResult) {
      if (item._id === 'income') total_income += item.total;
      else total_spent += item.total;
    }

    const starting_balance = user?.starting_balance ?? 0;
    const balance = starting_balance + total_income - total_spent;

    // Build monthly analytics with balance rollover
    const monthlyMap = new Map<string, { year: number; month: number; income: number; expense: number }>();

    for (const item of monthlyRaw) {
      const { year, month, type } = item._id;
      const key = `${year}-${month}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { year, month, income: 0, expense: 0 });
      }
      const mData = monthlyMap.get(key)!;
      if (type === 'income') mData.income = item.total;
      else mData.expense = item.total;
    }

    let runningBalance = starting_balance;
    const monthly_analytics: MonthlyAnalytics[] = [];

    // Sort chronologically
    const sortedMonths = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    for (const m of sortedMonths) {
      const start = runningBalance;
      const net = m.income - m.expense;
      const end = start + net;
      monthly_analytics.push({
        year: m.year,
        month: m.month,
        label: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
        start_balance: start,
        income: m.income,
        expense: m.expense,
        net,
        end_balance: end,
      });
      runningBalance = end;
    }

    return res.status(200).json({
      expenses,
      balance,
      total_spent,
      total_income,
      starting_balance,
      monthly_analytics: monthly_analytics.reverse(), // most recent month first for UI
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }

  // ─── POST — create transaction (expense | income) ───
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    const { type = 'expense', amount, category, note, date } = body as {
      type?: 'expense' | 'income';
      amount?: number;
      category?: string;
      note?: string;
      date?: string;
    };

    if (type !== 'expense' && type !== 'income') {
      return res.status(400).json({ error: 'type must be expense or income' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'amount must be > 0' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `invalid category` });
    }

    const expense = await Expense.create({
      user_id:  auth.user_id,
      type,
      amount,
      category,
      note:     note?.trim() ?? '',
      date:     date ? new Date(date) : new Date(),
    });

    return res.status(201).json(expense);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
