import { Router } from 'express';
import { getMarketOpportunities } from '../controllers/market-opportunities.controller';

const router = Router();

router.get('/', getMarketOpportunities);

export default router;
