import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

export const getCities = async (req: Request, res: Response) => {
    try {
        // fetching cities from a database
        const villes = await prisma.city.findMany({
            include: {
                admin: {
                    select: {
                        id: true,
                        email: true,
                    }
                },
                pois: true
            }
        })
        res.status(200).json(villes);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'An error occurred while fetching cities' });
    }
}

export const getCitiesByAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const adminId = req.user?.id;

    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });

    try {
        const villes = await prisma.city.findMany({
            where: {
                adminId: adminId
            }
        });

        if (villes.length === 0) return res.status(404).json({ error: 'No cities found for this admin' });

        res.status(200).json(villes);

    } catch (error) {
        console.error('Error fetching cities by admin:', error);
        return res.status(500).json({ error: 'An error occurred while fetching cities for the admin' });
    }

}

export const createCity = async (req: Request, res: Response) => {

    const { nom, latitude, longitude, rayon, adminId } = req.body;

    try {
        const newVille = await prisma.city.create({
            data: {
                nom,
                latitude,
                longitude,
                rayon,
                admin: {
                    connect: { id: adminId }
                }
            }
        });
        res.status(201).json(newVille);
    } catch (error) {
        console.error('Error creating city:', error);
        res.status(500).json({ error: 'An error occurred while creating the city' });
    }
}

export const updateCity = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nom, latitude, longitude, rayon } = req.body;

    try {
        const updatedVille = await prisma.city.update({
            where: { id: Number(id) },
            data: {
                nom,
                latitude,
                longitude,
                rayon
            }
        });
        res.status(200).json(updatedVille);
    } catch (error) {
        console.error('Error updating city:', error);
        res.status(500).json({ error: 'An error occurred while updating the city' });
    }
}

export const assignCityToAdmin = async (req: Request, res: Response) => {
    const { cityId, adminId } = req.body;
    if (!cityId || !adminId) return res.status(400).json({ error: 'City ID and Admin ID are required' });
    try {
        const updatedCity = await prisma.city.update({
            where: { id: Number(cityId) },
            data: {
                admin: {
                    connect: { id: Number(adminId) }
                }
            }
        });
        res.status(200).json(updatedCity);
    } catch (error) {
        console.error('Error assigning city to admin:', error);
        res.status(500).json({ error: 'An error occurred while assigning the city to the admin' });
    }
}

export const unassignCityFromAdmin = async (req: Request, res: Response) => {
    const { cityId } = req.params;
    try {
        const updatedCity = await prisma.city.update({
            where: { id: Number(cityId) },
            data: {
                admin: {
                    disconnect: true
                }
            }
        });
        res.status(200).json(updatedCity);
    } catch (error) {
        console.error('Error unassigning city from admin:', error);
        res.status(500).json({ error: 'An error occurred while unassigning the city from the admin' });
    }
}

export const deleteCity = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.city.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting city:', error);
        res.status(500).json({ error: 'An error occurred while deleting the city' });
    }
}