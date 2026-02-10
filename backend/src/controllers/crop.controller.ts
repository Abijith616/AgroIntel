import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
    };
}

export const createCrop = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, landVolume, landUnit, phase, country, state, district, place } = req.body;

        if (!name || !landVolume || !landUnit || !phase || !country || !place) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        if (country === 'India' && (!state || !district)) {
            res.status(400).json({ error: 'State and District are required for India' });
            return;
        }

        const crop = await prisma.crop.create({
            data: {
                name,
                landVolume: parseFloat(landVolume),
                landUnit,
                phase,
                country,
                state: state || "",
                district: district || "",
                place,
                userId
            }
        });

        res.status(201).json(crop);
    } catch (error) {
        console.error('Error creating crop:', error);
        res.status(500).json({ error: 'Failed to create crop' });
    }
};

export const getCrops = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const crops = await prisma.crop.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(crops);
    } catch (error) {
        console.error('Error fetching crops:', error);
        res.status(500).json({ error: 'Failed to fetch crops' });
    }
};

export const updateCrop = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const cropId = parseInt(Array.isArray(id) ? id[0] : id);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, landVolume, landUnit, phase, country, state, district, place } = req.body;

        // Verify ownership
        const existingCrop = await prisma.crop.findFirst({
            where: { id: cropId, userId }
        });

        if (!existingCrop) {
            res.status(404).json({ error: 'Crop not found or unauthorized' });
            return;
        }

        const updatedCrop = await prisma.crop.update({
            where: { id: cropId },
            data: {
                name,
                landVolume: landVolume ? parseFloat(landVolume) : undefined,
                landUnit,
                phase,
                country,
                state,
                district,
                place
            }
        });

        res.json(updatedCrop);
    } catch (error) {
        console.error('Error updating crop:', error);
        res.status(500).json({ error: 'Failed to update crop' });
    }
};

export const deleteCrop = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const cropId = parseInt(Array.isArray(id) ? id[0] : id);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Verify ownership
        const existingCrop = await prisma.crop.findFirst({
            where: { id: cropId, userId }
        });

        if (!existingCrop) {
            res.status(404).json({ error: 'Crop not found or unauthorized' });
            return;
        }

        await prisma.crop.delete({
            where: { id: cropId }
        });

        res.status(200).json({ message: 'Crop deleted successfully' });
    } catch (error) {
        console.error('Error deleting crop:', error);
        res.status(500).json({ error: 'Failed to delete crop' });
    }
};
