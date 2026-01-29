import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as passwordResetController from '../controllers/password-reset.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Password reset routes
router.post('/forgot-password', passwordResetController.requestPasswordReset);
router.post('/verify-otp', passwordResetController.verifyOTP);
router.post('/reset-password', passwordResetController.resetPassword);

// Debug route for testing
import prisma from '../prisma';
router.get('/debug-otp', async (req, res) => {
    try {
        const reset = await prisma.passwordReset.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ otp: reset?.otp });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

