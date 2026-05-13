import { Router } from 'express';
import { getMarketPrices, getMarketTrend, getSupplyDemand } from '../controllers/market.controller';

const router = Router();

router.get('/prices', getMarketPrices);
router.get('/trend', getMarketTrend);
router.get('/supply-demand', getSupplyDemand);

export default router;
