import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const DIRECT_URI = process.env.MONGODB_URI;
const ExpenseSchema = new mongoose.Schema({ user_id: mongoose.Types.ObjectId, type: String, amount: Number, category: String, note: String, date: Date });
const Expense = mongoose.model('Expense', ExpenseSchema);

async function migrate() {
  await mongoose.connect(DIRECT_URI);
  const res = await Expense.updateMany({ type: { $exists: false } }, { $set: { type: 'expense' } });
  console.log(`Updated legacy expenses without type: ${res.modifiedCount}`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
