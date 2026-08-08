import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from './lib/db.js';
import { User } from './lib/models/User.js';
import { randomUUID } from 'crypto';

import { setCorsHeaders } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { username, name, starting_balance } = body as {
    username?: string;
    name?: string;
    starting_balance?: number;
  };

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username required' });
  }

  const clean = username.toLowerCase().trim();
  if (!/^[a-z0-9_]{2,20}$/.test(clean)) {
    return res.status(400).json({ error: 'Username must be 2-20 chars, letters/numbers/underscore' });
  }

  await connectDB();

  // Existing user → login (return existing token)
  const existing = await User.findOne({ username: clean });
  if (existing) {
    return res.status(200).json({
      user_id:          existing._id.toString(),
      token:            existing.token,
      username:         existing.username,
      name:             existing.name,
      starting_balance: existing.starting_balance,
      is_new:           false,
    });
  }

  // New user check vs registration
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return res.status(200).json({ exists: false });
  }

  const token = randomUUID();
  const user = await User.create({
    username:         clean,
    name:             name.trim(),
    starting_balance: typeof starting_balance === 'number' ? starting_balance : 0,
    token,
  });

  return res.status(201).json({
    user_id:          user._id.toString(),
    token:            user.token,
    username:         user.username,
    name:             user.name,
    starting_balance: user.starting_balance,
    is_new:           true,
  });
}
