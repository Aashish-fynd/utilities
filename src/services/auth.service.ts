import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { config } from '@/config/index.js';
import { User, IUser } from '@/models/User.js';
import { Token, IToken } from '@/models/Token.js';
import { RefreshToken, IRefreshToken } from '@/models/RefreshToken.js';
import { TokenRequest, ITokenRequest, TokenRequestStatus } from '@/models/TokenRequest.js';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '@/utils/errors.js';

export interface JwtPayload {
  sub: string; // user id
  jti: string; // token id
  scopes: string[];
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function ensureScopes(apis: string[]): string[] {
  const scopes = apis.map((s) => s.trim()).filter(Boolean);
  if (scopes.length === 0) throw new ValidationError('At least one API scope is required');
  return Array.from(new Set(scopes));
}

export const authService = {
  async findOrCreateUserByEmail(email: string): Promise<IUser> {
    let user = await User.findOne({ email });
    if (user) return user as unknown as IUser;
    user = await User.create({ email, isAdmin: false });
    return user as unknown as IUser;
  },

  async createTokenRequest(userId: string, apis: string[]): Promise<ITokenRequest> {
    const scopes = ensureScopes(apis);
    const request = await TokenRequest.create({
      userId: new Types.ObjectId(userId),
      requestedApis: scopes,
      status: 'pending',
    });
    return request as unknown as ITokenRequest;
  },

  async listTokenRequests(status?: TokenRequestStatus): Promise<ITokenRequest[]> {
    const q = status ? { status } : {};
    return (await TokenRequest.find(q).sort({ createdAt: -1 }).lean()) as unknown as ITokenRequest[];
  },

  async approveTokenRequest(requestId: string, adminNote?: string): Promise<{ request: ITokenRequest; token: IToken; accessToken: string; refreshToken: string; }>{
    const req = await TokenRequest.findById(requestId);
    if (!req) throw new NotFoundError('Request not found');
    if (req.status !== 'pending') throw new ValidationError('Request not pending');

    const now = new Date();

    // Either update existing active token scopes or create a new token record (jti)
    let tokenDoc = await Token.findOne({ userId: req.userId, active: true }).sort({ createdAt: -1 });
    const scopes = ensureScopes(req.requestedApis);

    if (tokenDoc) {
      tokenDoc.scopes = scopes;
      tokenDoc.revokedAt = null;
      tokenDoc.active = true;
      tokenDoc.expiresAt = addDays(now, Math.min(config.REFRESH_TOKEN_TTL_DAYS, config.REFRESH_TOKEN_MAX_DAYS));
      await tokenDoc.save();
    } else {
      const jti = new Types.ObjectId().toString();
      tokenDoc = await Token.create({
        jti,
        userId: req.userId,
        scopes,
        active: true,
        createdAt: now,
        expiresAt: addDays(now, Math.min(config.REFRESH_TOKEN_TTL_DAYS, config.REFRESH_TOKEN_MAX_DAYS)),
      });
    }

    // Issue new access and refresh tokens
    const accessToken = jwt.sign(
      { sub: (tokenDoc.userId as any).toString(), jti: tokenDoc.jti, scopes: tokenDoc.scopes },
      config.JWT_ACCESS_SECRET,
      { expiresIn: `${config.ACCESS_TOKEN_TTL_MINUTES}m` }
    );

    // Clear older refresh tokens for this tokenId
    await RefreshToken.updateMany({ tokenId: tokenDoc._id, revokedAt: null }, { $set: { revokedAt: now } });

    const refreshPlain = new Types.ObjectId().toString() + '.' + new Types.ObjectId().toString();
    const refreshHash = await bcrypt.hash(refreshPlain, 10);
    await RefreshToken.create({
      userId: tokenDoc.userId,
      tokenId: tokenDoc._id,
      hash: refreshHash,
      createdAt: now,
      expiresAt: addDays(now, Math.min(config.REFRESH_TOKEN_TTL_DAYS, config.REFRESH_TOKEN_MAX_DAYS)),
    });

    req.status = 'approved';
    req.adminNote = adminNote || null;
    req.tokenId = tokenDoc._id as any;
    req.updatedAt = new Date();
    await req.save();

    return { request: req as unknown as ITokenRequest, token: tokenDoc as unknown as IToken, accessToken, refreshToken: refreshPlain };
  },

  async rejectTokenRequest(requestId: string, adminNote?: string): Promise<ITokenRequest> {
    const req = await TokenRequest.findById(requestId);
    if (!req) throw new NotFoundError('Request not found');
    req.status = 'rejected';
    req.adminNote = adminNote || null;
    req.updatedAt = new Date();
    await req.save();
    return req as unknown as ITokenRequest;
  },

  async rotateRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; }>{
    const now = new Date();
    // We do not store refresh token in plaintext; locate by scanning non-revoked and validate hash
    const candidates = await RefreshToken.find({ revokedAt: null, expiresAt: { $gt: now } }).limit(1000);
    let matched: IRefreshToken | null = null;
    for (const doc of candidates) {
      const ok = await bcrypt.compare(refreshToken, doc.hash);
      if (ok) {
        matched = doc;
        break;
      }
    }
    if (!matched) throw new AuthenticationError('Invalid refresh token');

    // Revoke old refresh token
    matched.revokedAt = now;
    await matched.save();

    // Load token/jti record
    const tokenDoc = await Token.findById(matched.tokenId);
    if (!tokenDoc || !tokenDoc.active || tokenDoc.expiresAt <= now) {
      throw new AuthorizationError('Token expired or inactive');
    }

    // Issue new access token
    const accessToken = jwt.sign(
      { sub: (tokenDoc.userId as any).toString(), jti: tokenDoc.jti, scopes: tokenDoc.scopes },
      config.JWT_ACCESS_SECRET,
      { expiresIn: `${config.ACCESS_TOKEN_TTL_MINUTES}m` }
    );

    // Issue new refresh token (rotate)
    const refreshPlain = new Types.ObjectId().toString() + '.' + new Types.ObjectId().toString();
    const refreshHash = await bcrypt.hash(refreshPlain, 10);
    await RefreshToken.create({
      userId: tokenDoc.userId,
      tokenId: tokenDoc._id,
      hash: refreshHash,
      createdAt: now,
      expiresAt: addDays(now, Math.min(config.REFRESH_TOKEN_TTL_DAYS, config.REFRESH_TOKEN_MAX_DAYS)),
    });

    return { accessToken, refreshToken: refreshPlain };
  },

  async revokeToken(tokenId: string): Promise<void> {
    await Token.findByIdAndUpdate(tokenId, { $set: { active: false, revokedAt: new Date() } });
    await RefreshToken.updateMany({ tokenId: new Types.ObjectId(tokenId), revokedAt: null }, { $set: { revokedAt: new Date() } });
  },

  async getTokenDetailsByAccessToken(accessToken: string): Promise<{ token: IToken; user: IUser } | null> {
    try {
      const decoded = jwt.verify(accessToken, config.JWT_ACCESS_SECRET) as JwtPayload;
      const token = await Token.findOne({ jti: decoded.jti, active: true });
      if (!token) return null;
      const user = await User.findById(token.userId);
      if (!user) return null;
      return { token: token as unknown as IToken, user: user as unknown as IUser };
    } catch {
      return null;
    }
  },

  async findTokenByValue(accessToken: string): Promise<(IToken & { userEmail?: string }) | undefined> {
    try {
      const decoded = jwt.verify(accessToken, config.JWT_ACCESS_SECRET) as JwtPayload;
      const token = await Token.findOne({ jti: decoded.jti, active: true }).populate('userId');
      if (!token) return undefined;
      const anyToken: any = token.toObject();
      anyToken.email = (anyToken.userId && (anyToken.userId as any).email) || undefined;
      return anyToken as any;
    } catch {
      return undefined;
    }
  },

  async updateTokenScopes(tokenId: string, apis: string[]): Promise<IToken> {
    const scopes = ensureScopes(apis);
    const token = await Token.findByIdAndUpdate(
      tokenId,
      { $set: { scopes, revokedAt: null, active: true } },
      { new: true }
    );
    if (!token) throw new NotFoundError('Token not found');
    return token as unknown as IToken;
  },
};
