import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from './db.js';
import { User } from './models/User.js';

export interface AuthUser {
  user_id: string;
  username: string;
  name: string;
  starting_balance: number;
}

export async function authMiddleware(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthUser | null> {
  const user_id = req.headers['x-user-id'] as string;
  const token   = req.headers['x-token'] as string;

  if (!user_id || !token) {
    res.status(401).json({ error: 'Missing credentials' });
    return null;
  }

  await connectDB();
  const user = await User.findById(user_id);

  if (!user || user.token !== token) {
    res.status(401).json({ error: 'Invalid credentials' });
    return null;
  }

  return {
    user_id: user._id.toString(),
    username: user.username,
    name: user.name,
    starting_balance: user.starting_balance,
  };
}

export async function adminMiddleware(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthUser | null> {
  const auth = await authMiddleware(req, res);
  if (!auth) return null;

  if (auth.username.toLowerCase() !== 'rithwikex') {
    res.status(403).json({ error: 'Forbidden — Admin access required' });
    return null;
  }

  return auth;
}
