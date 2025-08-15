import { Router } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { authService } from '@/services/auth.service';
import { authenticate, requireAdmin } from '@/middleware/auth';
import { UsageLog } from '@/models/UsageLog';

const router: Router = Router();

const requestSchema = z.object({
  email: z.string().email(),
  apis: z.array(z.string()).min(1),
});

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Token request and admin approval
 */

/**
 * @openapi
 * /api/v1/auth/request:
 *   post:
 *     summary: Request a bearer token for specific APIs
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, apis]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               apis:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Request created
 */
router.post(
  '/request',
  validate(requestSchema),
  asyncHandler(async (req, res) => {
    const { email, apis } = req.body as z.infer<typeof requestSchema>;
    const user = await authService.findOrCreateUserByEmail(email);
    const request = await authService.createTokenRequest((user._id as any).toString(), apis);
    res.json({ status: 'success', data: { request } });
  })
);

/**
 * @openapi
 * /api/v1/auth/requests:
 *   get:
 *     summary: List token requests (admin only)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of requests
 */
router.get(
  '/requests',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
    const list = await authService.listTokenRequests(status);
    res.json({ status: 'success', data: list });
  })
);

const decisionSchema = z.object({
  requestId: z.string(),
  note: z.string().optional(),
});

/**
 * @openapi
 * /api/v1/auth/approve:
 *   post:
 *     summary: Approve a token request and issue a token (admin only)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId]
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: The ID of the token request to approve
 *               note:
 *                 type: string
 *                 description: Optional admin note for the approval
 *     responses:
 *       200:
 *         description: Approved with tokens
 */
router.post(
  '/approve',
  authenticate,
  requireAdmin,
  validate(decisionSchema),
  asyncHandler(async (req, res) => {
    const { requestId, note } = req.body as z.infer<typeof decisionSchema>;
    const result = await authService.approveTokenRequest(requestId, note);
    res.json({ status: 'success', data: result });
  })
);

/**
 * @openapi
 * /api/v1/auth/reject:
 *   post:
 *     summary: Reject a token request (admin only)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [requestId]
 *             properties:
 *               requestId:
 *                 type: string
 *                 description: The ID of the token request to reject
 *               note:
 *                 type: string
 *                 description: Optional admin note for the rejection
 */
router.post(
  '/reject',
  authenticate,
  requireAdmin,
  validate(decisionSchema),
  asyncHandler(async (req, res) => {
    const { requestId, note } = req.body as z.infer<typeof decisionSchema>;
    const updated = await authService.rejectTokenRequest(requestId, note);
    res.json({ status: 'success', data: updated });
  })
);

// Refresh token endpoint
const refreshSchema = z.object({ refreshToken: z.string().min(20) });
router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const tokens = await authService.rotateRefreshToken(refreshToken);
    res.json({ status: 'success', data: tokens });
  })
);

// Token details endpoint
router.get(
  '/token',
  authenticate,
  asyncHandler(async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length).trim()
      : undefined;
    if (!token) {
      res.status(400).json({ status: 'error', message: 'Missing access token' });
      return;
    }
    const details = await authService.getTokenDetailsByAccessToken(token);
    if (!details) {
      res.status(404).json({ status: 'error', message: 'Token not found' });
      return;
    }
    res.json({ status: 'success', data: { token: details.token, user: details.user } });
  })
);

// Usage logs: admin or current user
const usageQuerySchema = z.object({
  userId: z.string().optional(),
  tokenId: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
});
router.get(
  '/usage',
  authenticate,
  validate(usageQuerySchema, 'query'),
  asyncHandler(async (req: any, res) => {
    const { userId, tokenId, limit } = req.query as z.infer<typeof usageQuerySchema>;
    const isAdmin = !!req.user?.isAdmin;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (tokenId) filter.tokenId = tokenId;
    if (!isAdmin) {
      filter.userId = req.user?.id;
    }
    const logs = await UsageLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ status: 'success', data: logs });
  })
);

export default router;
