import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

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