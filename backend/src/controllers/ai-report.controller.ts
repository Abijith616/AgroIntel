import { Request, Response } from 'express';
import { generateAIReport, AIReportRequest, MarketSnapshotInput } from '../services/ai-report.service';
import { MarketService } from '../services/market.service';

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

export const generateMarketReport = async (req: Request, res: Response) => {
    try {
        const { crops } = req.body as { crops: AIReportRequest['crops'] };

        if (!crops || crops.length === 0) {
            return res.status(400).json({ error: 'No crops provided' });
        }

        const farmerState = crops[0]?.state || 'Kerala';
        const farmerDistrict = crops[0]?.district || '';
        const coords = STATE_COORDS[farmerState] || { lat: 9.9312, lon: 76.2673 };

        // Build market snapshots synchronously using the fast in-memory market service
        // (avoids extra Groq/API calls before the AI request)
        const uniqueCropNames = [...new Set(crops.map(c => c.name))];
        const snapshots: MarketSnapshotInput[] = [];

        // MSP values for quick lookup (same as market.service)
        const CROP_MSP: Record<string, number> = {
            rice: 2300, wheat: 2275, maize: 2090, sugarcane: 340,
            cotton: 7521, soybean: 4892, groundnut: 6783, sunflower: 7280,
            mustard: 5650, gram: 5440, tur: 7550, moong: 8682, urad: 7400,
            jowar: 3371, bajra: 2625, ragi: 4290,
            tomato: 1500, onion: 1200, potato: 900, default: 2200,
        };

        for (const cropName of uniqueCropNames) {
            try {
                const marketData = MarketService.getMarketPrices(cropName, coords.lat, coords.lon);
                const nearest = marketData.nearestMarket;
                const allPrices = [nearest, ...marketData.alternativeMarkets].map(m => m.price);
                const natAvg = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
                const msp = CROP_MSP[cropName.toLowerCase()] ?? CROP_MSP['default'];

                // Compute a simple trend from oldest vs newest alternative markets as proxy
                const trend = nearest.trend ?? 0;

                snapshots.push({
                    cropName,
                    localPrice: nearest.price,
                    nationalAvg: natAvg,
                    msp,
                    trend,
                    profitPotential: nearest.profitPotential,
                });
            } catch {
                // skip if market data fails
            }
        }

        const reportReq: AIReportRequest = {
            crops,
            marketSnapshots: snapshots,
            farmerState,
            farmerDistrict,
            currentDate: new Date().toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
            }),
        };

        const report = await generateAIReport(reportReq);
        res.json(report);

    } catch (error: any) {
        console.error('AI Report error:', error?.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate AI report',
            message: error?.response?.data?.error?.message || error.message,
        });
    }
};
