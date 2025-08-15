import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IUsageLog extends Document {
  userId?: Types.ObjectId;
  tokenId?: Types.ObjectId;
  route: string;
  method: string;
  statusCode: number;
  ip?: string;
  userAgent?: string;
  durationMs?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const usageLogSchema = new Schema<IUsageLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  tokenId: { type: Schema.Types.ObjectId, ref: 'Token', index: true },
  route: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  ip: { type: String },
  userAgent: { type: String },
  durationMs: { type: Number },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, required: true, default: () => new Date() },
});

export const UsageLog: Model<IUsageLog> =
  mongoose.models.UsageLog || mongoose.model<IUsageLog>('UsageLog', usageLogSchema);