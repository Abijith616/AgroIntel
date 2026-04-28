import { Request, Response } from 'express';
import prisma from '../prisma';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
    };
}

interface CropRow {
    id: number;
    userId: number;
    name: string;
    landVolume: number;
    landUnit: string;
    phase: string;
    country: string;
    state: string;
    district: string;
    place: string;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    updatedAt: string;
}

const parseCoordinate = (value: unknown, label: string): number => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    if (!Number.isFinite(parsed)) {
        throw new Error(`${label} is required`);
    }
    return parsed;
};

const parsePositiveNumber = (value: unknown, label: string): number => {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${label} must be a valid positive number`);
    }
    return parsed;
};

const validateCoordinateRange = (latitude: number, longitude: number) => {
    if (latitude < -90 || latitude > 90) {
        throw new Error('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
        throw new Error('Longitude must be between -180 and 180');
    }
};

export const createCrop = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, landVolume, landUnit, phase, country, state, district, place, latitude, longitude } = req.body;

        if (!name || !landUnit || !phase || !country || !place) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        if (country === 'India' && (!state || !district)) {
            res.status(400).json({ error: 'State and District are required for India' });
            return;
        }

        const parsedLandVolume = parsePositiveNumber(landVolume, 'Land volume');
        const parsedLatitude = parseCoordinate(latitude, 'Latitude');
        const parsedLongitude = parseCoordinate(longitude, 'Longitude');
        validateCoordinateRange(parsedLatitude, parsedLongitude);

        const rows = await prisma.$queryRawUnsafe<CropRow[]>(
            `INSERT INTO "Crop" ("userId", "name", "landVolume", "landUnit", "phase", "country", "state", "district", "place", "latitude", "longitude", "createdAt", "updatedAt")
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING *`,
            userId,
            name,
            parsedLandVolume,
            landUnit,
            phase,
            country,
            state || '',
            district || '',
            place,
            parsedLatitude,
            parsedLongitude
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating crop:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
            return;
        }
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

        const crops = await prisma.$queryRawUnsafe<CropRow[]>(
            `SELECT "id", "userId", "name", "landVolume", "landUnit", "phase", "country", "state", "district", "place", "latitude", "longitude", "createdAt", "updatedAt"
             FROM "Crop"
             WHERE "userId" = ?
             ORDER BY "createdAt" DESC`,
            userId
        );

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
        const cropId = parseInt(Array.isArray(id) ? id[0] : id, 10);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { name, landVolume, landUnit, phase, country, state, district, place, latitude, longitude } = req.body;
        const parsedLandVolume = parsePositiveNumber(landVolume, 'Land volume');
        const parsedLatitude = parseCoordinate(latitude, 'Latitude');
        const parsedLongitude = parseCoordinate(longitude, 'Longitude');
        validateCoordinateRange(parsedLatitude, parsedLongitude);

        const existingCrop = await prisma.$queryRawUnsafe<CropRow[]>(
            `SELECT * FROM "Crop" WHERE "id" = ? AND "userId" = ? LIMIT 1`,
            cropId,
            userId
        );

        if (existingCrop.length === 0) {
            res.status(404).json({ error: 'Crop not found or unauthorized' });
            return;
        }

        const rows = await prisma.$queryRawUnsafe<CropRow[]>(
            `UPDATE "Crop"
             SET "name" = ?, "landVolume" = ?, "landUnit" = ?, "phase" = ?, "country" = ?, "state" = ?, "district" = ?, "place" = ?, "latitude" = ?, "longitude" = ?, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "id" = ? AND "userId" = ?
             RETURNING *`,
            name,
            parsedLandVolume,
            landUnit,
            phase,
            country,
            state || '',
            district || '',
            place,
            parsedLatitude,
            parsedLongitude,
            cropId,
            userId
        );

        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating crop:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Failed to update crop' });
    }
};

export const deleteCrop = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const cropId = parseInt(Array.isArray(id) ? id[0] : id, 10);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const existingCrop = await prisma.$queryRawUnsafe<CropRow[]>(
            `SELECT * FROM "Crop" WHERE "id" = ? AND "userId" = ? LIMIT 1`,
            cropId,
            userId
        );

        if (existingCrop.length === 0) {
            res.status(404).json({ error: 'Crop not found or unauthorized' });
            return;
        }

        await prisma.$executeRawUnsafe(
            `DELETE FROM "Crop" WHERE "id" = ? AND "userId" = ?`,
            cropId,
            userId
        );

        res.status(200).json({ message: 'Crop deleted successfully' });
    } catch (error) {
        console.error('Error deleting crop:', error);
        res.status(500).json({ error: 'Failed to delete crop' });
    }
};
