import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const DIRECT_URI = process.env.MONGODB_URI;
const ExpenseSchema = new mongoose.Schema({ user_id: mongoose.Types.ObjectId, type: String, amount: Number, category: String, note: String, date: Date });
const Expense = mongoose.model('Expense', ExpenseSchema);

async function inspect() {
  await mongoose.connect(DIRECT_URI);
  const docs = await Expense.find({}).lean();
  console.log(`TOTAL DOCUMENTS: ${docs.length}\n`);
  
  let totalAll = 0;
  let totalTypedExpense = 0;
  let totalUntyped = 0;
  let totalTypedIncome = 0;

  for (const d of docs) {
    totalAll += d.amount;
    if (d.type === 'expense') totalTypedExpense += d.amount;
    else if (d.type === 'income') totalTypedIncome += d.amount;
    else totalUntyped += d.amount;

    console.log(`id: ${d._id} | type: ${d.type || 'UNDEFINED'} | amount: ₹${d.amount} | cat: ${d.category} | note: ${d.note}`);
  }

  console.log('\n--- BREAKDOWN ---');
  console.log(`Ground Truth Total (All Expenses): ₹${totalAll}`);
  console.log(`Typed 'expense': ₹${totalTypedExpense}`);
  console.log(`Untyped (missing type field): ₹${totalUntyped}`);
  console.log(`Typed 'income': ₹${totalTypedIncome}`);
  console.log(`Typed 'expense' + Untyped: ₹${totalTypedExpense + totalUntyped}`);

  await mongoose.disconnect();
}

inspect().catch(console.error);
