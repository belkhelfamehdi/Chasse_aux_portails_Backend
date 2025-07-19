import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const getPOIs = async (_req: Request, res: Response) => {
    try {
        const pois = await prisma.pOI.findMany({
            include: { city: true },
        });
        res.status(200).json(pois);
    } catch (err) {
        console.error('Error fetching POIs:', err);
        res.status(500).json({ error: 'Failed to fetch POIs' });
    }
};

export const getPOIById = async (req: Request, res: Response) => {
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

export const getPOIsByCity = async (req: Request, res: Response) => {
    const cityId = Number(req.params.cityId);
    try {
        const pois = await prisma.pOI.findMany({ where: { cityId } });
        if (pois.length === 0) return res.status(404).json({ error: 'No POIs found for this city' });
        res.json(pois);
    } catch (err) {
        console.error('Error fetching POIs by city:', err);
        res.status(500).json({ error: 'Error fetching POIs by city' });
    }
};

export const createPOI = async (req: Request, res: Response) => {
    const { nom, description, latitude, longitude, iconUrl, modelUrl, cityId } = req.body;
    try {
        const poi = await prisma.pOI.create({
            data: { nom, description, latitude, longitude, iconUrl, modelUrl, cityId },
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
