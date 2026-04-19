import { Router } from 'express';
import { getMarkets, forecastYield } from '../controllers/yield-forecast.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/markets', authenticateToken, getMarkets);
router.post('/forecast', authenticateToken, forecastYield);

export default router;
