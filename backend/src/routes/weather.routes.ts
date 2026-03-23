import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';

const router = Router();

router.get('/local', WeatherController.getLocalWeather);
router.get('/global', WeatherController.getGlobalInsights);

export default router;
