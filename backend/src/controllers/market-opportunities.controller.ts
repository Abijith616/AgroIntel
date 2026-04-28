import { Request, Response } from 'express';
import { MarketOpportunitiesService } from '../services/market-opportunities.service';

export const getMarketOpportunities = async (req: Request, res: Response) => {
    try {
        const { crop, state, district, place, lat, lon } = req.query;

        const cropName = (crop as string) || 'Rice';
        const stateName = (state as string) || 'Kerala';
        const districtName = (district as string) || '';
        const placeName = (place as string) || '';

        if (!lat || !lon) {
            res.status(400).json({
                error: 'Latitude and longitude are required for nearby market discovery'
            });
            return;
        }

        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lon as string);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            res.status(400).json({
                error: 'Latitude and longitude must be valid numbers'
            });
            return;
        }

        const result = await MarketOpportunitiesService.getOpportunities(
            cropName,
            latitude,
            longitude,
            stateName,
            districtName,
            placeName
        );

        res.json(result);
    } catch (error: any) {
        console.error('Market opportunities error:', error);
        res.status(500).json({
            error: 'Failed to fetch market opportunities',
            message: error.message,
        });
    }
};
