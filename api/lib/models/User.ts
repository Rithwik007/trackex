import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  name: string;
  starting_balance: number;
  token: string;
  created_at: Date;
}

const UserSchema = new Schema<IUser>({
  username:         { type: String, required: true, unique: true, lowercase: true, index: true },
  name:             { type: String, required: true },
  starting_balance: { type: Number, required: true, default: 0 },
  token:            { type: String, required: true },
  created_at:       { type: Date, default: Date.now },
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
