import { Router } from 'express';
import { getMarketPrices, getMarketTrend } from '../controllers/market.controller';

const router = Router();

router.get('/prices', getMarketPrices);
router.get('/trend', getMarketTrend);

export default router;
