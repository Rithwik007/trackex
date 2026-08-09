import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { connectDB } from './lib/db.js';
import { ChatMessage } from './lib/models/ChatMessage.js';
import { authMiddleware } from './lib/auth.js';
import { setCorsHeaders } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  const auth = await authMiddleware(req, res);
  if (!auth) return;

  await connectDB();
  const userIdObj = new mongoose.Types.ObjectId(auth.user_id);

  // ─── GET — fetch user chat history from MongoDB ───
  if (req.method === 'GET') {
    const messages = await ChatMessage.find({ user_id: userIdObj as any })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({
      messages: messages.map(m => ({
        id: m._id.toString(),
        role: m.role,
        text: m.text,
        timestamp: m.timestamp,
      })),
    });
  }

  // ─── DELETE — clear user chat history in MongoDB ───
  if (req.method === 'DELETE') {
    await ChatMessage.deleteMany({ user_id: userIdObj as any });
    return res.status(200).json({ success: true, message: 'Chat history cleared' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
