import mongoose, { Schema, type Document } from 'mongoose';

export interface IQueryLog extends Document {
  user_id: mongoose.Types.ObjectId;
  username: string;
  question?: string;
  timestamp: Date;
}

const QueryLogSchema = new Schema<IQueryLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    username: { type: String, required: true },
    question: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const QueryLog =
  mongoose.models.QueryLog || mongoose.model<IQueryLog>('QueryLog', QueryLogSchema);
