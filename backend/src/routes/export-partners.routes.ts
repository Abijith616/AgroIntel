import { Router } from 'express';
import { ExportPartnersController } from '../controllers/export-partners.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, ExportPartnersController.getPartners);

export default router;
