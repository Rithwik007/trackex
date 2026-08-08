import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { Expense } from './lib/models/Expense.js';
import { User } from './lib/models/User.js';
import { authMiddleware } from './lib/auth.js';
import { parseNLQuery, answerQuestionWithTransactions, AllKeysExhaustedError } from './lib/groq.js';
import { checkRateLimit } from './lib/rateLimit.js';
import { ALL_CATEGORIES } from '../src/lib/categories.js';

const VALID_CATEGORIES = ALL_CATEGORIES.map(c => c.id);

function parseSafeDate(dateStr: string | null | undefined, isEndOfDay = false): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.split('T')[0];
  const iso = isEndOfDay ? `${clean}T23:59:59.999Z` : `${clean}T00:00:00.000Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await authMiddleware(req, res);
  if (!auth) return;

  // Rate Limiting: Max 20 queries/min per user
  const rate = checkRateLimit(auth.user._id.toString());
  if (!rate.allowed) {
    return res.status(429).json({
      answer: "⏳ Rate limit exceeded. You can send up to 20 questions per minute. Please wait a moment before trying again.",
      understood: false,
    });
  }

  const { question, chat_history } = req.body as {
    question?: string;
    chat_history?: Array<{role: 'user' | 'assistant'; content: string}>;
  };
  if (!question || typeof question !== 'string' || question.trim().length < 2) {
    return res.status(400).json({ error: 'question required' });
  }

  let parsed;
  try {
    parsed = await parseNLQuery(question.trim(), chat_history ?? []);
  } catch (err) {
    if (err instanceof AllKeysExhaustedError) {
      return res.status(200).json({
        answer: "⚠️ API limit reached — all API keys have been exhausted for today. Please try again tomorrow or add a new API key.",
        understood: false,
      });
    }
    throw err;
  }

  if (!parsed) {
    return res.status(200).json({
      answer: "I couldn't understand that question. Try asking like: 'how much did I spend on food this week?' or 'what is my total income this month?'",
      understood: false,
    });
  }

  // 1. Security Refusal (Prompt Injection / Write Actions)
  if (parsed.security_refusal) {
    return res.status(200).json({
      answer: `I am a read-only financial query assistant scoped strictly to your account (@${auth.username}). I cannot modify transactions or reveal other system data.`,
      value: 0,
      count: 0,
      understood: true,
    });
  }

  // 2. Off-Topic / General Knowledge Query -> Return direct answer from Groq
  // Only short-circuit if it's not a request for financial advice/suggestions
  const isAdviceQuery = /suggest|advice|saving|save|budget|optimize|analytical|insight|what should i|help me|history|summary/i.test(question);
  if (parsed.off_topic && parsed.direct_answer && !isAdviceQuery) {
    return res.status(200).json({
      answer: parsed.direct_answer,
      value: 0,
      count: 0,
      understood: true,
    });
  }

  // 3. Invalid / Non-Existent Category
  if (parsed.invalid_category) {
    return res.status(200).json({
      answer: `Category '${parsed.invalid_category}' is not tracked in your account. Available categories are: ${VALID_CATEGORIES.join(', ')}.`,
      value: 0,
      count: 0,
      understood: true,
    });
  }

  await connectDB();
  const userIdObj = new mongoose.Types.ObjectId(auth.user_id);

  // Helper to query transactions based on filters
  const fetchTx = async (
    typeFilter: 'expense' | 'income' | 'all',
    catFilter?: string | string[],
    excludeCats?: string[],
    dFrom?: Date | null,
    dTo?: Date | null,
    noteSearch?: string | null
  ) => {
    const match: Record<string, unknown> = { user_id: userIdObj };

    if (typeFilter === 'expense') {
      match.$or = [{ type: 'expense' }, { type: { $exists: false } }, { type: null }];
    } else if (typeFilter === 'income') {
      match.type = 'income';
    }

    if (catFilter && catFilter !== 'all') {
      if (Array.isArray(catFilter)) {
        match.category = { $in: catFilter };
      } else {
        match.category = catFilter;
      }
    }

    if (excludeCats && excludeCats.length > 0) {
      match.category = { $nin: excludeCats };
    }

    if (dFrom || dTo) {
      const dateFilter: Record<string, Date> = {};
      if (dFrom) dateFilter.$gte = dFrom;
      if (dTo)   dateFilter.$lte = dTo;
      match.date = dateFilter;
    }

    // Note/description text search (case-insensitive regex)
    if (noteSearch && noteSearch.trim().length > 0) {
      const words = noteSearch.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && w !== 'and' && w !== 'the' && w !== 'for');

      if (words.length > 0) {
        match.note = { $regex: words.join('|'), $options: 'i' };
      } else {
        const escaped = noteSearch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        match.note = { $regex: escaped, $options: 'i' };
      }
    }

    return Expense.find(match).sort({ date: -1 }).limit(200).lean();
  };

  const mainFrom = parseSafeDate(parsed.date_from, false);
  const mainTo   = parseSafeDate(parsed.date_to, true);

  const txs = await fetchTx(
    parsed.type,
    parsed.categories || parsed.category,
    parsed.category_exclude,
    mainFrom,
    mainTo,
    parsed.note_search
  );

  // Fetch comparison transactions if needed, to give LLM full context
  let allMatchingTxs = [...txs];

  if (parsed.category_compare && parsed.category !== 'all') {
    const compTxs = await fetchTx(parsed.type, parsed.category_compare, undefined, mainFrom, mainTo);
    allMatchingTxs.push(...compTxs);
  }

  if (parsed.date_from_compare || parsed.date_to_compare) {
    const compFrom = parseSafeDate(parsed.date_from_compare, false);
    const compTo   = parseSafeDate(parsed.date_to_compare, true);
    const compTxs = await fetchTx(
      parsed.type,
      parsed.categories || parsed.category,
      parsed.category_exclude,
      compFrom,
      compTo,
      parsed.note_search
    );
    allMatchingTxs.push(...compTxs);
  }

  // Use the LLM's brain to formulate the final answer using the exact matching transactions
  let answer: string;
  try {
    answer = await answerQuestionWithTransactions(
      question.trim(),
      allMatchingTxs,
      chat_history ?? [],
      parsed
    );
  } catch (err) {
    if (err instanceof AllKeysExhaustedError) {
      return res.status(200).json({
        answer: "⚠️ API limit reached — all API keys have been exhausted for today. Please try again tomorrow or add a new API key.",
        understood: false,
      });
    }
    throw err;
  }

  return res.status(200).json({
    answer,
    value: allMatchingTxs.reduce((sum, t) => sum + t.amount, 0),
    count: allMatchingTxs.length,
    understood: true,
  });
}
