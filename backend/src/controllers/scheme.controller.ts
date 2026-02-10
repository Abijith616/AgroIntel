import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllSchemes = async (req: Request, res: Response) => {
    try {
        const schemes = await prisma.scheme.findMany();
        res.json(schemes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schemes' });
    }
};

export const getMatchingSchemes = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId; // Assuming authentication middleware adds user to req
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userCrops = await prisma.crop.findMany({
            where: { userId: Number(userId) },
        });

        const allSchemes = await prisma.scheme.findMany();

        const matchedSchemes = allSchemes.filter(scheme => {
            if (scheme.applicableCrops.toLowerCase() === 'all') return true;

            const applicableCropsList = scheme.applicableCrops.split(',').map(s => s.trim().toLowerCase());

            // Check if any of the user's crops match the applicable crops
            return userCrops.some(userCrop => {
                const userCropName = userCrop.name.toLowerCase();
                return applicableCropsList.some(appCrop => userCropName.includes(appCrop) || appCrop.includes(userCropName));
            });
        });

        res.json(matchedSchemes);

    } catch (error) {
        console.error("Error matching schemes:", error);
        res.status(500).json({ error: 'Failed to match schemes' });
    }
};
