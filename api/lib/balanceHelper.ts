import mongoose from 'mongoose';
import { Expense } from './models/Expense.js';

export interface UserBalanceResult {
  totalIncome: number;
  totalSpent: number;
  currentBalance: number;
}

export async function calculateUserBalance(
  userId: string,
  startingBalance: number
): Promise<UserBalanceResult> {
  const userIdObj = new mongoose.Types.ObjectId(userId);

  const sumResult = await Expense.aggregate([
    { $match: { user_id: userIdObj } },
    {
      $group: {
        _id: { $ifNull: ['$type', 'expense'] },
        total: { $sum: '$amount' },
      },
    },
  ]);

  let totalIncome = 0;
  let totalSpent = 0;

  for (const s of sumResult) {
    if (s._id === 'income') totalIncome += s.total;
    else totalSpent += s.total;
  }

  const currentBalance = Math.round((startingBalance + totalIncome - totalSpent) * 100) / 100;

  return {
    totalIncome,
    totalSpent,
    currentBalance,
  };
}
