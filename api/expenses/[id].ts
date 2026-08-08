import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db';
import { Expense } from '../lib/models/Expense';
import { authMiddleware } from '../lib/auth';
import { ALL_CATEGORIES } from '../../src/lib/categories';

const VALID_CATEGORIES = ALL_CATEGORIES.map(c => c.id);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await authMiddleware(req, res);
  if (!auth) return;

  const { id } = req.query as { id: string };

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }

  await connectDB();
  const expense = await Expense.findById(id);

  if (!expense) return res.status(404).json({ error: 'Transaction not found' });

  // Ownership check
  if (expense.user_id.toString() !== auth.user_id) {
    return res.status(403).json({ error: 'Forbidden — not your transaction' });
  }

  // ─── PATCH — edit transaction ───
  if (req.method === 'PATCH') {
    const { type, amount, category, note, date } = req.body as {
      type?: 'expense' | 'income';
      amount?: number;
      category?: string;
      note?: string;
      date?: string;
    };

    if (type !== undefined && type !== 'expense' && type !== 'income') {
      return res.status(400).json({ error: 'type must be expense or income' });
    }
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({ error: 'amount must be > 0' });
    }
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'invalid category' });
    }

    if (type      !== undefined) expense.type     = type;
    if (amount    !== undefined) expense.amount   = amount;
    if (category  !== undefined) expense.category = category;
    if (note      !== undefined) expense.note     = note.trim();
    if (date      !== undefined) expense.date     = new Date(date);

    await expense.save();
    return res.status(200).json(expense);
  }

  // ─── DELETE ───
  if (req.method === 'DELETE') {
    await expense.deleteOne();
    return res.status(200).json({ deleted: true, id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
