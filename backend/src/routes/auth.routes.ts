/**
 * src/routes/auth.routes.ts
 * --------------------------
 * Routing untuk endpoint autentikasi.
 *
 * Base path: /api/auth  (didaftarkan di app.ts)
 *
 * Endpoint:
 *   POST /api/auth/register  → Register user baru
 *   POST /api/auth/login     → Login, mendapat JWT token
 *   GET  /api/auth/me        → Ambil data user yang sedang login (Protected)
 *   POST /api/auth/logout    → Logout (Protected)
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { 
  registerValidator, 
  loginValidator, 
  forgotPasswordValidator, 
  resetPasswordValidator 
} from '../validators/auth.validator';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes — tidak perlu token
router.post('/register', registerValidator, authController.register);
router.post('/login',    loginValidator,    authController.login);
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, authController.resetPassword);

// Protected routes — wajib login (butuh Bearer token)
router.get('/me',      authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout);

export default router;
