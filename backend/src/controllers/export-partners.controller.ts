import { Request, Response } from 'express';
import { ExportPartnersService } from '../services/export-partners.service';

export class ExportPartnersController {

    /**
     * GET /api/export-partners?crops=Rice,Wheat&state=Kerala&forceRefresh=true
     */
    static async getPartners(req: Request, res: Response) {
        try {
            const cropsParam = (req.query.crops as string) || '';
            const state = (req.query.state as string) || 'Kerala';
            const forceRefresh = req.query.forceRefresh === 'true';

            const crops = cropsParam.split(',').map(c => c.trim()).filter(Boolean);

            if (crops.length === 0) {
                return res.status(400).json({ error: 'At least one crop is required. Pass crops=Rice,Wheat' });
            }

            // If force refresh, clear cache for these crops first
            if (forceRefresh) {
                ExportPartnersService.clearCache(crops, state);
            }

            const result = await ExportPartnersService.getPartners(crops, state);

            res.json({
                partners: result.partners,
                totalCount: result.partners.length,
                cached: result.cached,
                fetchedAt: result.fetchedAt,
                metadata: {
                    crops,
                    state,
                    forceRefresh,
                },
            });
        } catch (error: any) {
            console.error('Export partners error:', error);
            res.status(503).json({
                error: 'Export partners unavailable',
                message: error.message || 'Failed to fetch export partners',
                partners: [],
            });
        }
    }
}
