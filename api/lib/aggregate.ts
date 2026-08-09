import mongoose from 'mongoose';
import { Expense } from './models/Expense.js';

export interface AggregationFilter {
  user_id: string;
  type?: 'expense' | 'income' | 'all';
  category?: string;
  date_from?: Date | string | null;
  date_to?: Date | string | null;
}

export async function aggregateTransactions(filter: AggregationFilter) {
  const match: any = {
    user_id: new mongoose.Types.ObjectId(filter.user_id),
  };

  if (filter.type && filter.type !== 'all') {
    match.$or = [{ type: filter.type }];
    if (filter.type === 'expense') {
      // Safely catch any legacy documents missing type
      match.$or.push({ type: { $exists: false } }, { type: null });
    }
  }

  if (filter.category && filter.category !== 'all') {
    match.category = filter.category;
  }

  if (filter.date_from || filter.date_to) {
    const dateFilter: Record<string, Date> = {};
    if (filter.date_from) dateFilter.$gte = new Date(filter.date_from);
    if (filter.date_to) dateFilter.$lte = new Date(filter.date_to);
    match.date = dateFilter;
  }

  const results = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ['$type', 'expense'] },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let total_spent = 0;
  let total_income = 0;
  let count = 0;

  for (const r of results) {
    count += r.count;
    if (r._id === 'income') {
      total_income += r.total;
    } else {
      total_spent += r.total;
    }
  }

  return { total_spent, total_income, count, results };
}
