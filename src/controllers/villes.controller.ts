import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const getVilles = async (req: Request, res: Response) => {
    try {
        // fetching cities from a database
        const villes = await prisma.ville.findMany({
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

export const getVillesByAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const adminId = req.user?.id;
    
    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });
    
    try {
        const villes = await prisma.ville.findMany({
            where: {
                adminId: adminId
            }
        });

        if (villes.length === 0) return res.status(404).json({ error: 'No cities found for this admin' });

        res.status(200).json(villes);
            
    }catch (error) {
        console.error('Error fetching cities by admin:', error);
        return res.status(500).json({ error: 'An error occurred while fetching cities for the admin' });
    }

}

export const createVille = async (req: Request, res: Response) => {

    const { nom, latitude, longitude, rayon, adminId } = req.body;

    try {
        const newVille = await prisma.ville.create({
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

export const updateVille = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nom, latitude, longitude, rayon } = req.body;

    try {
        const updatedVille = await prisma.ville.update({
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

export const deleteVille = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.ville.delete({
            where: { id: Number(id) }
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting city:', error);
        res.status(500).json({ error: 'An error occurred while deleting the city' });
    }
}