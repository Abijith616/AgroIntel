import { Request, Response } from 'express';
import { WeatherService } from '../services/weather.service';

export class WeatherController {

    static async getLocalWeather(req: Request, res: Response) {
        try {
            const { lat, lon, crop } = req.query;

            // Default to Kochi, Kerala if not provided
            const latitude = lat ? parseFloat(lat as string) : 9.9312;
            const longitude = lon ? parseFloat(lon as string) : 76.2673;
            const cropName = (crop as string) || 'Rice';

            const weather = await WeatherService.getLocalWeather(latitude, longitude);
            const verdict = WeatherService.getVerdict(cropName, weather);

            res.json({
                location: { lat: latitude, lon: longitude },
                weather,
                verdict,
                metadata: {
                    dataSource: 'real',
                    fetchedAt: new Date().toISOString()
                }
            });
        } catch (error: any) {
            console.error('Weather fetch error:', error);
            res.status(503).json({
                error: 'Weather data unavailable',
                message: error.message || 'Failed to fetch weather data',
                metadata: {
                    dataSource: 'unavailable',
                    fetchedAt: new Date().toISOString()
                }
            });
        }
    }

    static async getGlobalInsights(req: Request, res: Response) {
        try {
            const insights = await WeatherService.getGlobalInsights();

            // Check if any insights failed
            const hasErrors = insights.some((insight: any) => insight.error);
            const successCount = insights.filter((insight: any) => !insight.error).length;

            res.json({
                insights,
                metadata: {
                    dataSource: hasErrors ? 'partial' : 'real',
                    fetchedAt: new Date().toISOString(),
                    successCount,
                    totalCount: insights.length
                }
            });
        } catch (error: any) {
            console.error('Global insights error:', error);
            res.status(503).json({
                error: 'Global insights unavailable',
                message: error.message || 'Failed to fetch global insights',
                metadata: {
                    dataSource: 'unavailable',
                    fetchedAt: new Date().toISOString()
                }
            });
        }
    }
}
