import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WeatherService } from '../services/weather.service';
import { generatePlantHealthReport, PlantHealthRequest } from '../services/plant-health.service';

const prisma = new PrismaClient();

// Shared with ai-report.controller — coords per Indian state
const STATE_COORDS: Record<string, { lat: number; lon: number }> = {
    'Kerala': { lat: 9.9312, lon: 76.2673 },
    'Tamil Nadu': { lat: 11.1271, lon: 78.6569 },
    'Karnataka': { lat: 15.3173, lon: 75.7139 },
    'Maharashtra': { lat: 19.7515, lon: 75.7139 },
    'Andhra Pradesh': { lat: 15.9129, lon: 79.7400 },
    'Telangana': { lat: 18.1124, lon: 79.0193 },
    'Punjab': { lat: 31.1471, lon: 75.3412 },
    'Haryana': { lat: 29.0588, lon: 76.0856 },
    'Uttar Pradesh': { lat: 26.8467, lon: 80.9462 },
    'Rajasthan': { lat: 27.0238, lon: 74.2179 },
    'Madhya Pradesh': { lat: 22.9734, lon: 78.6569 },
    'Gujarat': { lat: 22.2587, lon: 71.1924 },
    'West Bengal': { lat: 22.9868, lon: 87.8550 },
    'Bihar': { lat: 25.0961, lon: 85.3131 },
    'Odisha': { lat: 20.9517, lon: 85.0985 },
};

interface AuthenticatedRequest extends Request {
    user?: { userId: number };
}

export const getPlantHealth = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const cropId = parseInt(Array.isArray(req.params.cropId) ? req.params.cropId[0] : req.params.cropId);
        if (isNaN(cropId)) return res.status(400).json({ error: 'Invalid cropId' });

        // 1 — Fetch crop (verify ownership)
        const crop = await prisma.crop.findFirst({
            where: { id: cropId, userId },
        });

        if (!crop) return res.status(404).json({ error: 'Crop not found or unauthorized' });

        // 2 — Get coords for the crop's state
        const coords = STATE_COORDS[crop.state] || { lat: 9.9312, lon: 76.2673 };

        // 3 — Fetch real-time weather from Open-Meteo
        const weatherData = await WeatherService.getLocalWeather(coords.lat, coords.lon);

        const forecast = (weatherData.daily?.time || []).map((date: string, i: number) => ({
            date,
            maxTemp: weatherData.daily.temperature_2m_max[i],
            minTemp: weatherData.daily.temperature_2m_min[i],
            rain: weatherData.daily.rain_sum[i],
        }));

        const weather: PlantHealthRequest['weather'] = {
            temperature: weatherData.current.temperature_2m,
            humidity: weatherData.current.relative_humidity_2m,
            rain: weatherData.current.rain,
            maxTemp: weatherData.daily.temperature_2m_max[0] ?? weatherData.current.temperature_2m,
            minTemp: weatherData.daily.temperature_2m_min[0] ?? weatherData.current.temperature_2m,
            forecast,
        };

        // 4 — Generate AI health report with weather context
        const healthReq: PlantHealthRequest = {
            cropName: crop.name,
            phase: crop.phase,
            landVolume: crop.landVolume,
            landUnit: crop.landUnit,
            state: crop.state,
            district: crop.district,
            place: crop.place,
            weather,
        };

        const report = await generatePlantHealthReport(healthReq);

        // Include basic crop info for the frontend to display
        res.json({
            crop: {
                id: crop.id,
                name: crop.name,
                phase: crop.phase,
                landVolume: crop.landVolume,
                landUnit: crop.landUnit,
                state: crop.state,
                district: crop.district,
                place: crop.place,
            },
            weather,
            report,
        });

    } catch (error: any) {
        console.error('Plant health error:', error?.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate plant health report',
            message: error?.response?.data?.error?.message || error.message,
        });
    }
};
