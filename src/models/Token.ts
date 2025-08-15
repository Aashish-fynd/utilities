import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IToken extends Document {
  jti: string;
  userId: Types.ObjectId;
  scopes: string[];
  active: boolean;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;
}

const tokenSchema = new Schema<IToken>({
  jti: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  scopes: { type: [String], required: true, default: [] },
  active: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: () => new Date() },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  lastUsedAt: { type: Date, default: null },
});

export const Token: Model<IToken> =
  mongoose.models.Token || mongoose.model<IToken>('Token', tokenSchema);