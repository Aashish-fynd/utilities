import { getDb } from '@/db/sqlite.js';
import { randomUUID } from 'crypto';

export interface User {
  id: string;
  email: string;
  is_admin: number;
  created_at: string;
}

export interface Token {
  id: string;
  user_id: string;
  token: string;
  apis: string; // comma-separated list
  active: number;
  created_at: string;
  revoked_at?: string | null;
}

export type TokenRequestStatus = 'pending' | 'approved' | 'rejected';

export interface TokenRequest {
  id: string;
  user_id: string;
  requested_apis: string; // comma-separated list
  status: TokenRequestStatus;
  admin_note?: string | null;
  token_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const authService = {
  findOrCreateUserByEmail(email: string): User {
    const db = getDb();
    const find = db.prepare<[string], User>('SELECT * FROM users WHERE email = ?');
    const user = find.get(email);
    if (user) return user as User;
    const newUser: User = {
      id: randomUUID(),
      email,
      is_admin: 0,
      created_at: new Date().toISOString(),
    };
    db.prepare(
      'INSERT INTO users (id, email, is_admin, created_at) VALUES (@id, @email, @is_admin, @created_at)'
    ).run(newUser);
    return newUser;
  },

  createTokenRequest(userId: string, apis: string[]): TokenRequest {
    const db = getDb();
    const now = new Date().toISOString();
    const req: TokenRequest = {
      id: randomUUID(),
      user_id: userId,
      requested_apis: apis.join(','),
      status: 'pending',
      admin_note: null,
      token_id: null,
      created_at: now,
      updated_at: now,
    };
    db.prepare(
      'INSERT INTO token_requests (id, user_id, requested_apis, status, admin_note, token_id, created_at, updated_at) VALUES (@id, @user_id, @requested_apis, @status, @admin_note, @token_id, @created_at, @updated_at)'
    ).run(req);
    return req;
  },

  listTokenRequests(status?: TokenRequestStatus): TokenRequest[] {
    const db = getDb();
    if (status) {
      return db
        .prepare<
          [TokenRequestStatus],
          TokenRequest
        >('SELECT * FROM token_requests WHERE status = ? ORDER BY created_at DESC')
        .all(status) as unknown as TokenRequest[];
    }
    return db
      .prepare<[], TokenRequest>('SELECT * FROM token_requests ORDER BY created_at DESC')
      .all() as unknown as TokenRequest[];
  },

  approveTokenRequest(
    requestId: string,
    adminNote?: string
  ): { request: TokenRequest; token: Token } {
    const db = getDb();
    const tx = db.transaction(() => {
      const req = db
        .prepare<[string], TokenRequest>('SELECT * FROM token_requests WHERE id = ?')
        .get(requestId) as TokenRequest | undefined;
      if (!req) throw new Error('Request not found');
      if (req.status !== 'pending') throw new Error('Request not pending');

      // If a token already exists for this user, update its scopes; otherwise create a new token
      const existing = db
        .prepare<
          [string],
          Token
        >('SELECT * FROM tokens WHERE user_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1')
        .get(req.user_id) as Token | undefined;

      let token: Token;
      if (existing) {
        db.prepare('UPDATE tokens SET apis = ?, revoked_at = NULL, active = 1 WHERE id = ?').run(
          req.requested_apis,
          existing.id
        );
        token = db
          .prepare<[string], Token>('SELECT * FROM tokens WHERE id = ?')
          .get(existing.id) as Token;
      } else {
        token = {
          id: randomUUID(),
          user_id: req.user_id,
          token: randomUUID().replace(/-/g, ''),
          apis: req.requested_apis,
          active: 1,
          created_at: new Date().toISOString(),
          revoked_at: null,
        };
        db.prepare(
          'INSERT INTO tokens (id, user_id, token, apis, active, created_at, revoked_at) VALUES (@id, @user_id, @token, @apis, @active, @created_at, @revoked_at)'
        ).run(token);
      }

      db.prepare(
        'UPDATE token_requests SET status = ?, admin_note = ?, token_id = ?, updated_at = ? WHERE id = ?'
      ).run('approved', adminNote || null, token.id, new Date().toISOString(), requestId);
      const updatedReq = db
        .prepare<[string], TokenRequest>('SELECT * FROM token_requests WHERE id = ?')
        .get(requestId) as TokenRequest;
      return { request: updatedReq, token };
    });
    return tx();
  },

  rejectTokenRequest(requestId: string, adminNote?: string): TokenRequest {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE token_requests SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?'
    ).run('rejected', adminNote || null, now, requestId);
    const updated = db
      .prepare<[string], TokenRequest>('SELECT * FROM token_requests WHERE id = ?')
      .get(requestId) as TokenRequest | undefined;
    if (!updated) throw new Error('Request not found');
    return updated;
  },

  findTokenByValue(tokenValue: string): (Token & { email: string }) | undefined {
    const db = getDb();
    return db
      .prepare<
        [string],
        Token & { email: string }
      >(`SELECT t.*, u.email FROM tokens t JOIN users u ON u.id = t.user_id WHERE t.token = ? AND t.active = 1`)
      .get(tokenValue) as (Token & { email: string }) | undefined;
  },

  updateTokenScopes(tokenId: string, apis: string[]): Token {
    const db = getDb();
    db.prepare('UPDATE tokens SET apis = ?, revoked_at = NULL, active = 1 WHERE id = ?').run(
      apis.join(','),
      tokenId
    );
    const token = db.prepare<[string], Token>('SELECT * FROM tokens WHERE id = ?').get(tokenId) as
      | Token
      | undefined;
    if (!token) throw new Error('Token not found');
    return token;
  },

  revokeToken(tokenId: string): void {
    const db = getDb();
    db.prepare('UPDATE tokens SET active = 0, revoked_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      tokenId
    );
  },
};
