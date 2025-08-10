import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import bcrypt from 'bcrypt';

// Get all admins
export const getAllAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await prisma.utilisateur.findMany({
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                profilePictureUrl: true,
                cities: {
                    select: {
                        id: true,
                        nom: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        res.json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des administrateurs' });
    }
};

// Get admin by ID
export const getAdminById = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID administrateur invalide' });
    }

    try {
        const admin = await prisma.utilisateur.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                profilePictureUrl: true,
                cities: {
                    select: {
                        id: true,
                        nom: true,
                        latitude: true,
                        longitude: true,
                        rayon: true
                    }
                }
            }
        });

        if (!admin) {
            return res.status(404).json({ error: 'Administrateur introuvable' });
        }

        res.json(admin);
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de l\'administrateur' });
    }
};

// Create new admin
export const createAdmin = async (req: Request, res: Response) => {
    const { firstname, lastname, email, password, role, cityIds } = req.body;

    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    try {
        // Check if email already exists
        const existingUser = await prisma.utilisateur.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Un administrateur avec cet email existe déjà' });
        }

        // Validate cities if provided
        if (cityIds && cityIds.length > 0) {
            const cities = await prisma.city.findMany({
                where: { id: { in: cityIds } }
            });

            if (cities.length !== cityIds.length) {
                return res.status(400).json({ error: 'Une ou plusieurs villes sélectionnées sont invalides' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
    const pictureUrl = (req as any).file ? `/uploads/profile-pictures/${(req as any).file.filename}` : undefined;
    const newAdmin = await prisma.utilisateur.create({
            data: {
                firstname,
                lastname,
                email,
                password: hashedPassword,
                role: role || 'ADMIN',
        ...(pictureUrl && { profilePictureUrl: pictureUrl }),
                ...(cityIds && cityIds.length > 0 && {
                    cities: {
                        connect: cityIds.map((id: number) => ({ id }))
                    }
                })
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
        profilePictureUrl: true,
                cities: {
                    select: {
                        id: true,
                        nom: true
                    }
                }
            }
        });

        res.status(201).json(newAdmin);
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création de l\'administrateur' });
    }
};

// Helper function to validate cities
const validateCityIds = async (cityIds: number[]) => {
    if (!cityIds || cityIds.length === 0) return true;
    
    const cities = await prisma.city.findMany({
        where: { id: { in: cityIds } }
    });
    
    return cities.length === cityIds.length;
};

// Helper function to check email availability
const isEmailAvailable = async (email: string, excludeId?: number) => {
    const existingUser = await prisma.utilisateur.findUnique({
        where: { email }
    });
    
    return !existingUser || (excludeId && existingUser.id === excludeId);
};

// Helper function to prepare update data
const prepareUpdateData = async (data: any) => {
    const updateData: any = {};
    
    if (data.firstname) updateData.firstname = data.firstname;
    if (data.lastname) updateData.lastname = data.lastname;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    
    if (data.password) {
        if (data.password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
        updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    return updateData;
};

// Helper function to handle city assignments
const handleCityAssignments = async (adminId: number, cityIds?: number[]) => {
    if (cityIds === undefined) return {};

    // First disconnect all existing cities
    await prisma.utilisateur.update({
        where: { id: adminId },
        data: {
            cities: {
                disconnect: await prisma.city.findMany({
                    where: { adminId },
                    select: { id: true }
                })
            }
        }
    });

    // Then connect new cities if any
    if (cityIds.length > 0) {
        return {
            cities: {
                connect: cityIds.map((cityId: number) => ({ id: cityId }))
            }
        };
    }
    
    return {};
};

// Update admin
export const updateAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { firstname, lastname, email, role, cityIds, password } = req.body;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID administrateur invalide' });
    }

    try {
        const adminId = Number(id);
        
        // Check if admin exists
        const existingAdmin = await prisma.utilisateur.findUnique({
            where: { id: adminId }
        });

        if (!existingAdmin) {
            return res.status(404).json({ error: 'Administrateur introuvable' });
        }

        // Check if email is available
        if (email && email !== existingAdmin.email && !(await isEmailAvailable(email))) {
            return res.status(409).json({ error: 'Un administrateur avec cet email existe déjà' });
        }

        // Validate cities
        if (cityIds && !(await validateCityIds(cityIds))) {
            return res.status(400).json({ error: 'Une ou plusieurs villes sélectionnées sont invalides' });
        }

        // Prepare update data
        const updateData = await prepareUpdateData({ firstname, lastname, email, role, password });
        
        // Handle city assignments
        const cityAssignments = await handleCityAssignments(adminId, cityIds);
        Object.assign(updateData, cityAssignments);

        // Update admin
        const pictureUrl = (req as any).file ? `/uploads/profile-pictures/${(req as any).file.filename}` : undefined;
        if (pictureUrl) {
            (updateData).profilePictureUrl = pictureUrl as any;
        }
        const updatedAdmin = await prisma.utilisateur.update({
            where: { id: adminId },
            data: updateData,
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                role: true,
                profilePictureUrl: true,
                cities: {
                    select: {
                        id: true,
                        nom: true
                    }
                }
            }
        });

        res.json(updatedAdmin);
    } catch (error: any) {
        console.error('Error updating admin:', error);
        if (error?.message?.includes('mot de passe')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de l\'administrateur' });
    }
};

// Delete admin
export const deleteAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID administrateur invalide' });
    }

    try {
        // Check if admin exists
        const existingAdmin = await prisma.utilisateur.findUnique({
            where: { id: Number(id) }
        });

        if (!existingAdmin) {
            return res.status(404).json({ error: 'Administrateur introuvable' });
        }

        // First, disconnect all cities assigned to this admin
        await prisma.city.updateMany({
            where: { adminId: Number(id) },
            data: { adminId: null }
        });

        // Delete the admin
        await prisma.utilisateur.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Administrateur supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression de l\'administrateur' });
    }
};

// Get statistics about admins
export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const totalAdmins = await prisma.utilisateur.count();
        const superAdmins = await prisma.utilisateur.count({
            where: { role: 'SUPER_ADMIN' }
        });
        const regularAdmins = await prisma.utilisateur.count({
            where: { role: 'ADMIN' }
        });

        const adminsWithCities = await prisma.utilisateur.count({
            where: {
                cities: {
                    some: {}
                }
            }
        });

        res.json({
            total: totalAdmins,
            superAdmins,
            regularAdmins,
            adminsWithCities,
            adminsWithoutCities: totalAdmins - adminsWithCities
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des statistiques' });
    }
};
