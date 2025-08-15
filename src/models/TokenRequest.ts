import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TokenRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ITokenRequest extends Document {
  userId: Types.ObjectId;
  requestedApis: string[];
  status: TokenRequestStatus;
  adminNote?: string | null;
  tokenId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const tokenRequestSchema = new Schema<ITokenRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestedApis: { type: [String], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', required: true, index: true },
  adminNote: { type: String, default: null },
  tokenId: { type: Schema.Types.ObjectId, ref: 'Token', default: null },
  createdAt: { type: Date, required: true, default: () => new Date() },
  updatedAt: { type: Date, required: true, default: () => new Date() },
});

export const TokenRequest: Model<ITokenRequest> =
  mongoose.models.TokenRequest ||
  mongoose.model<ITokenRequest>('TokenRequest', tokenRequestSchema);