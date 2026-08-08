import mongoose, { Schema, type Document } from 'mongoose';

export interface IAdminAuditLog extends Document {
  admin_username: string;
  action: string;
  target_user_id: mongoose.Types.ObjectId;
  target_username: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    admin_username: { type: String, required: true },
    action: { type: String, required: true },
    target_user_id: { type: Schema.Types.ObjectId, required: true },
    target_username: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const AdminAuditLog =
  mongoose.models.AdminAuditLog || mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
