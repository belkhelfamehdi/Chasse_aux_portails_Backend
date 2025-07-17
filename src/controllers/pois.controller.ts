import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const getPOIs = async (_req: Request, res: Response) => {
    try {
        const pois = await prisma.pOI.findMany({
            include: { ville: true },
        });
        res.status(200).json(pois);
    } catch (err) {
        console.error('Error fetching POIs:', err);
        res.status(500).json({ error: 'Failed to fetch POIs' });
    }
};

export const getPOI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
        const poi = await prisma.pOI.findUnique({ where: { id } });
        if (!poi) return res.status(404).json({ error: 'POI not found' });
        res.json(poi);
    } catch (err) {
        console.error('Error fetching POI:', err);
        res.status(500).json({ error: 'Error fetching POI' });
    }
};

export const createPOI = async (req: Request, res: Response) => {
    const { nom, description, latitude, longitude, iconUrl, modelUrl, villeId } = req.body;
    try {
        const poi = await prisma.pOI.create({
            data: { nom, description, latitude, longitude, iconUrl, modelUrl, villeId },
        });
        res.status(201).json(poi);
    } catch (err) {
        console.error('Error creating POI:', err);
        res.status(500).json({ error: 'Error creating POI' });
    }
};

export const updatePOI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { nom, description, latitude, longitude, iconUrl, modelUrl } = req.body;

    try {
        const poi = await prisma.pOI.update({
            where: { id },
            data: { nom, description, latitude, longitude, iconUrl, modelUrl },
        });
        res.json(poi);
    } catch (err) {
        console.error('Error updating POI:', err);
        res.status(500).json({ error: 'Error updating POI' });
    }
};

export const deletePOI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    try {
        await prisma.pOI.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting POI:', err);
        res.status(500).json({ error: 'Error deleting POI' });
    }
};
