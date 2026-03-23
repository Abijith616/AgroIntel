import { Router } from 'express';
import { generateMarketReport } from '../controllers/ai-report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/ai-report — protected route, requires JWT
router.post('/', authenticateToken, generateMarketReport);

export default router;
