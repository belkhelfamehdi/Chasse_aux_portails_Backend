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

export const getCityById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid city ID' });
    }

    try {
        const city = await prisma.city.findUnique({
            where: { id: Number(id) },
            include: {
                admin: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true
                    }
                },
                pois: true
            }
        });

        if (!city) {
            return res.status(404).json({ error: 'City not found' });
        }

        res.status(200).json(city);
    } catch (error) {
        console.error('Error fetching city:', error);
        res.status(500).json({ error: 'An error occurred while fetching the city' });
    }
};

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

    // Validate required fields
    if (!nom || latitude === undefined || longitude === undefined || rayon === undefined) {
        return res.status(400).json({ error: 'Missing required fields: nom, latitude, longitude, rayon' });
    }

    // Validate data types and ranges
    if (isNaN(Number(latitude)) || isNaN(Number(longitude)) || isNaN(Number(rayon))) {
        return res.status(400).json({ error: 'Latitude, longitude, and rayon must be valid numbers' });
    }

    if (Number(rayon) <= 0) {
        return res.status(400).json({ error: 'Rayon must be greater than 0' });
    }

    try {
        // Prepare the data object
        const cityData: any = {
            nom: nom.trim(),
            latitude: Number(latitude),
            longitude: Number(longitude),
            rayon: Number(rayon)
        };

        // Only connect to admin if adminId is provided and valid
        if (adminId !== null && adminId !== undefined && adminId !== '') {
            if (isNaN(Number(adminId))) {
                return res.status(400).json({ error: 'Admin ID must be a valid number' });
            }

            // First check if the admin exists
            const adminExists = await prisma.utilisateur.findUnique({
                where: { id: Number(adminId) }
            });

            if (!adminExists) {
                return res.status(400).json({ error: 'Admin not found' });
            }

            cityData.admin = {
                connect: { id: Number(adminId) }
            };
        }
        // If adminId is null, undefined, or empty string, don't connect to any admin

        const newVille = await prisma.city.create({
            data: cityData,
            include: {
                admin: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json(newVille);
    } catch (error) {
        console.error('Error creating city:', error);
        res.status(500).json({ error: 'An error occurred while creating the city' });
    }
};

export const updateCity = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nom, latitude, longitude, rayon, adminId } = req.body;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid city ID' });
    }

    try {
        // Check if city exists
        const existingCity = await prisma.city.findUnique({
            where: { id: Number(id) }
        });

        if (!existingCity) {
            return res.status(404).json({ error: 'City not found' });
        }

        // Prepare update data
        const updateData: any = {};
        
        if (nom !== undefined) updateData.nom = nom;
        if (latitude !== undefined) updateData.latitude = Number(latitude);
        if (longitude !== undefined) updateData.longitude = Number(longitude);
        if (rayon !== undefined) updateData.rayon = Number(rayon);

        // Handle admin assignment
        if (adminId !== undefined) {
            if (adminId === null) {
                // Disconnect admin
                updateData.admin = {
                    disconnect: true
                };
            } else if (!isNaN(Number(adminId))) {
                // Check if admin exists
                const adminExists = await prisma.utilisateur.findUnique({
                    where: { id: Number(adminId) }
                });

                if (!adminExists) {
                    return res.status(400).json({ error: 'Admin not found' });
                }

                // Connect to new admin
                updateData.admin = {
                    connect: { id: Number(adminId) }
                };
            } else {
                return res.status(400).json({ error: 'Invalid admin ID' });
            }
        }

        const updatedVille = await prisma.city.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                admin: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json(updatedVille);
    } catch (error) {
        console.error('Error updating city:', error);
        res.status(500).json({ error: 'An error occurred while updating the city' });
    }
};

export const updateCityAsAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { nom, latitude, longitude, rayon } = req.body;
    const adminId = req.user?.id;

    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid city ID' });
    }

    try {
        // Vérifier que la ville existe et appartient à cet admin
        const existingCity = await prisma.city.findFirst({
            where: { 
                id: Number(id),
                adminId: adminId 
            }
        });

        if (!existingCity) {
            return res.status(403).json({ error: 'Vous n\'avez pas l\'autorisation de modifier cette ville' });
        }

        // Prepare update data (admins ne peuvent pas changer l'adminId)
        const updateData: any = {};
        
        if (nom !== undefined) updateData.nom = nom;
        if (latitude !== undefined) updateData.latitude = Number(latitude);
        if (longitude !== undefined) updateData.longitude = Number(longitude);
        if (rayon !== undefined) updateData.rayon = Number(rayon);

        const updatedVille = await prisma.city.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                admin: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json(updatedVille);
    } catch (error) {
        console.error('Error updating city as admin:', error);
        res.status(500).json({ error: 'An error occurred while updating the city' });
    }
};

export const assignCityToAdmin = async (req: Request, res: Response) => {
    const { cityId, adminId } = req.body;
    
    if (!cityId || !adminId) {
        return res.status(400).json({ error: 'City ID and Admin ID are required' });
    }

    if (isNaN(Number(cityId)) || isNaN(Number(adminId))) {
        return res.status(400).json({ error: 'Invalid City ID or Admin ID' });
    }

    try {
        // Check if city exists
        const cityExists = await prisma.city.findUnique({
            where: { id: Number(cityId) }
        });

        if (!cityExists) {
            return res.status(404).json({ error: 'City not found' });
        }

        // Check if admin exists
        const adminExists = await prisma.utilisateur.findUnique({
            where: { id: Number(adminId) }
        });

        if (!adminExists) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const updatedCity = await prisma.city.update({
            where: { id: Number(cityId) },
            data: {
                admin: {
                    connect: { id: Number(adminId) }
                }
            },
            include: {
                admin: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true
                    }
                }
            }
        });

        res.status(200).json(updatedCity);
    } catch (error) {
        console.error('Error assigning city to admin:', error);
        res.status(500).json({ error: 'An error occurred while assigning the city to the admin' });
    }
};

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

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'Invalid city ID' });
    }

    try {
        // Check if city exists
        const existingCity = await prisma.city.findUnique({
            where: { id: Number(id) },
            include: {
                pois: true
            }
        });

        if (!existingCity) {
            return res.status(404).json({ error: 'City not found' });
        }

        // Check if city has POIs
        if (existingCity.pois.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete city with existing POIs. Please delete all POIs first.' 
            });
        }

        await prisma.city.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({ message: 'City deleted successfully' });
    } catch (error) {
        console.error('Error deleting city:', error);
        res.status(500).json({ error: 'An error occurred while deleting the city' });
    }
};