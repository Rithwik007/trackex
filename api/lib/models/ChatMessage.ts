import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  user_id: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const ChatMessage =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
