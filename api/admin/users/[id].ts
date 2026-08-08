import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectDB } from '../../lib/db.js';
import { adminMiddleware } from '../../lib/auth.js';
import { User } from '../../lib/models/User.js';
import { Expense } from '../../lib/models/Expense.js';
import { AdminAuditLog } from '../../lib/models/AdminAuditLog.js';

import { setCorsHeaders } from '../../lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Admin Verification Middleware
  const admin = await adminMiddleware(req, res);
  if (!admin) return;

  const id = (req.query.id || (req as any).params?.id) as string;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  await connectDB();
  const targetUser = await User.findById(id);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.username.toLowerCase() === 'rithwikex') {
    return res.status(400).json({ error: 'Cannot delete primary admin account' });
  }

  const userIdObj = new mongoose.Types.ObjectId(id);

  // 2. Cascade deletion: delete all expenses of target user
  const expDeleteResult = await Expense.deleteMany({ user_id: userIdObj });

  // 3. Delete user document
  await User.findByIdAndDelete(id);

  // 4. Audit Log Entry
  await AdminAuditLog.create({
    admin_username: admin.username,
    action: 'DELETE_USER',
    target_user_id: userIdObj,
    target_username: targetUser.username,
    details: {
      deleted_expenses_count: expDeleteResult.deletedCount ?? 0,
      user_display_name: targetUser.name,
    },
    timestamp: new Date(),
  });

  return res.status(200).json({
    success: true,
    message: `User @${targetUser.username} and all associated transactions successfully deleted`,
    deleted_expenses_count: expDeleteResult.deletedCount ?? 0,
  });
}
