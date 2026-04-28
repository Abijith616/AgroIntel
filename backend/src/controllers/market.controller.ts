import { Request, Response } from 'express';
import { MarketService } from '../services/market.service';

// Rough state centroid coordinates for when user doesn't provide lat/lon
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

export const getMarketPrices = async (req: Request, res: Response) => {
    try {
        const { crop, state, lat, lon } = req.query;

        const cropName = (crop as string) || 'Rice';

        let latitude: number;
        let longitude: number;

        if (lat && lon) {
            latitude = parseFloat(lat as string);
            longitude = parseFloat(lon as string);
        } else if (state && STATE_COORDS[state as string]) {
            const coords = STATE_COORDS[state as string];
            latitude = coords.lat;
            longitude = coords.lon;
        } else {
            // Default to center of India
            latitude = 20.5937;
            longitude = 78.9629;
        }

        const stateName = (state as string) || 'Kerala';
        const data = await MarketService.getMarketPrices(cropName, latitude, longitude, stateName);

        res.json({
            crop: cropName,
            farmerLocation: { lat: latitude, lon: longitude, state: stateName },
            ...data,
            metadata: {
                fetchedAt: new Date().toISOString(),
                totalMarkets: 1 + data.alternativeMarkets.length,
            },
        });
    } catch (error: any) {
        console.error('Market price fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch market prices',
            message: error.message,
        });
    }
};

export const getMarketTrend = async (req: Request, res: Response) => {
    try {
        const { crop, state } = req.query;
        const cropName = (crop as string) || 'Rice';
        const stateName = (state as string) || 'Kerala';
        const days = parseInt(req.query.days as string) || 30;

        const result = await MarketService.getTrendHistory(cropName, stateName, days);

        res.json({
            crop: cropName,
            state: stateName,
            days,
            source: result.source,
            msp: result.trend[0]?.msp ?? null,
            trend: result.trend,
            metadata: { fetchedAt: new Date().toISOString() },
        });
    } catch (error: any) {
        console.error('Market trend fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch market trend', message: error.message });
    }
};
