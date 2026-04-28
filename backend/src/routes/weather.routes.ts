import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/local', authenticateToken, WeatherController.getLocalWeather);
router.get('/global', authenticateToken, WeatherController.getGlobalInsights);
router.get('/market-opportunities', authenticateToken, WeatherController.getMarketOpportunities);
router.get('/opportunity-details', authenticateToken, WeatherController.getOpportunityDetails);

export default router;
