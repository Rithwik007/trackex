import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IExpense extends Document {
  user_id: Types.ObjectId;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  date: Date;
  created_at: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  user_id:    { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  type:       { type: String, enum: ['expense', 'income'], default: 'expense', required: true },
  amount:     { type: Number, required: true },
  category:   { type: String, required: true },
  note:       { type: String, default: '' },
  date:       { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
});

// Compound index: scoped queries by user + sorted date
ExpenseSchema.index({ user_id: 1, type: 1, date: -1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense ?? mongoose.model<IExpense>('Expense', ExpenseSchema);
