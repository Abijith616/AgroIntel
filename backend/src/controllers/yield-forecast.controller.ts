import { Request, Response } from 'express';
import { computeYieldForecast, MARKET_CATALOGUE } from '../services/yield-forecast.service';

export async function getMarkets(_req: Request, res: Response) {
    res.json({ markets: MARKET_CATALOGUE });
}

export async function forecastYield(req: Request, res: Response) {
    try {
        const input = req.body;

        if (!input.crops || !Array.isArray(input.crops) || input.crops.length === 0) {
            return res.status(400).json({ error: 'At least one crop is required.' });
        }
        if (!input.selectedMarketId) {
            return res.status(400).json({ error: 'selectedMarketId is required.' });
        }
        if (!input.totalInvestment || input.totalInvestment <= 0) {
            return res.status(400).json({ error: 'totalInvestment must be a positive number.' });
        }

        const result = await computeYieldForecast(input);
        return res.json(result);
    } catch (err: any) {
        console.error('[YieldForecast] Error:', err);
        return res.status(500).json({ error: 'Failed to compute forecast.' });
    }
}
