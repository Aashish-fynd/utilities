import { Router } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validation.js';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { authService } from '@/services/auth.service.js';
import { authenticate, requireAdmin } from '@/middleware/auth.js';

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
router.post('/request', validate(requestSchema), asyncHandler(async (req, res) => {
	const { email, apis } = req.body as z.infer<typeof requestSchema>;
	const user = authService.findOrCreateUserByEmail(email);
	const request = authService.createTokenRequest(user.id, apis);
	res.json({ status: 'success', data: { request } });
}));

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
router.get('/requests', authenticate, requireAdmin, asyncHandler(async (req, res) => {
	const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
	const list = authService.listTokenRequests(status);
	res.json({ status: 'success', data: list });
}));

const decisionSchema = z.object({
	requestId: z.string().uuid(),
	note: z.string().optional(),
});

/**
 * @openapi
 * /api/v1/auth/approve:
 *   post:
 *     summary: Approve a token request and issue a token (admin only)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Approved with token
 */
router.post('/approve', authenticate, requireAdmin, validate(decisionSchema), asyncHandler(async (req, res) => {
	const { requestId, note } = req.body as z.infer<typeof decisionSchema>;
	const { request, token } = authService.approveTokenRequest(requestId, note);
	res.json({ status: 'success', data: { request, token } });
}));

/**
 * @openapi
 * /api/v1/auth/reject:
 *   post:
 *     summary: Reject a token request (admin only)
 *     tags: [Auth]
 */
router.post('/reject', authenticate, requireAdmin, validate(decisionSchema), asyncHandler(async (req, res) => {
	const { requestId, note } = req.body as z.infer<typeof decisionSchema>;
	const updated = authService.rejectTokenRequest(requestId, note);
	res.json({ status: 'success', data: updated });
}));

export default router;