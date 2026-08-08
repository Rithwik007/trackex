import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db.js';
import { User } from '../../lib/models/User.js';
import { authMiddleware } from '../../lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authMiddleware(req, res);
  if (!auth) return;

  const id = (req.query.id || (req as any).params?.id) as string;

  // Only allow editing own balance
  if (id !== auth.user_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { starting_balance } = req.body as { starting_balance?: number };
  if (typeof starting_balance !== 'number' || isNaN(starting_balance)) {
    return res.status(400).json({ error: 'starting_balance must be a number' });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    id,
    { starting_balance },
    { new: true }
  );

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json({
    user_id:          user._id.toString(),
    starting_balance: user.starting_balance,
  });
}
