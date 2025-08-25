import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

// Interface pour les requêtes authentifiées
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

// Type guard pour erreurs Prisma avec propriété `code`
function hasPrismaCode(err: unknown): err is { code: string } {
    return typeof err === 'object' && err !== null && 'code' in err;
}

// Normalise une chaîne optionnelle: undefined -> undefined, string -> trim, non-string -> ''
function normalizeOptionalString(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'string') return value.trim();
    return '';
}

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
        const poi = await prisma.pOI.findUnique({ 
            where: { id },
            include: { city: true }
        });
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
        // First check if the city exists
        const city = await prisma.city.findUnique({
            where: { id: cityId }
        });
        
        if (!city) {
            return res.status(404).json({ error: 'City not found' });
        }

        const pois = await prisma.pOI.findMany({ 
            where: { cityId },
            include: { city: true }
        });
        
        // Return empty array if no POIs found (this is valid behavior)
        res.json(pois);
    } catch (err) {
        console.error('Error fetching POIs by city:', err);
        res.status(500).json({ error: 'Error fetching POIs by city' });
    }
};

export const getPOIsByAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const adminId = req.user?.id;

    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });

    try {
        // Récupérer les POIs dans les villes assignées à cet admin
        const pois = await prisma.pOI.findMany({
            where: {
                city: {
                    adminId: adminId
                }
            },
            include: { 
                city: {
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

        res.status(200).json(pois);
    } catch (error) {
        console.error('Error fetching POIs by admin:', error);
        return res.status(500).json({ error: 'An error occurred while fetching POIs for the admin' });
    }
};

export const createPOI = async (req: Request, res: Response) => {
    const { nom, description, latitude, longitude, iconUrl, modelUrl, cityId } = req.body;
    
    try {
        // Validate that the city exists
        const cityExists = await prisma.city.findUnique({
            where: { id: parseInt(cityId) }
        });
        
        if (!cityExists) {
            return res.status(400).json({ error: 'La ville spécifiée n\'existe pas' });
        }

        // Handle file uploads if present
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        let finalIconUrl = '';
        let finalModelUrl = '';

        // Use uploaded files if available, otherwise use provided URLs
        if (files?.iconFile?.[0]) {
            finalIconUrl = `${req.protocol}://${req.get('host')}/uploads/icons/${files.iconFile[0].filename}`;
        } else if (typeof iconUrl === 'string' && iconUrl.trim().length > 0) {
            finalIconUrl = iconUrl.trim();
        }

        if (files?.modelFile?.[0]) {
            finalModelUrl = `${req.protocol}://${req.get('host')}/uploads/models/${files.modelFile[0].filename}`;
        } else if (typeof modelUrl === 'string' && modelUrl.trim().length > 0) {
            finalModelUrl = modelUrl.trim();
        }

        const poi = await prisma.pOI.create({
            data: { 
                nom, 
                description, 
                latitude: parseFloat(latitude), 
                longitude: parseFloat(longitude), 
                iconUrl: finalIconUrl,
                modelUrl: finalModelUrl,
                cityId: parseInt(cityId)
            },
            include: { city: true }
        });
        res.status(201).json(poi);
    } catch (err) {
        console.error('Error creating POI:', err);
        res.status(500).json({ error: 'Error creating POI' });
    }
};

export const createPOIAsAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const { nom, description, latitude, longitude, iconUrl, modelUrl, cityId } = req.body;
    const adminId = req.user?.id;

    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });
    
    try {
        // Vérifier que la ville existe et appartient à cet admin
        const cityExists = await prisma.city.findFirst({
            where: { 
                id: parseInt(cityId),
                adminId: adminId 
            }
        });
        
        if (!cityExists) {
            return res.status(403).json({ error: 'Vous n\'avez pas l\'autorisation de créer un POI dans cette ville' });
        }

        // Handle file uploads if present
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        let finalIconUrl = '';
        let finalModelUrl = '';

        // Use uploaded files if available, otherwise use provided URLs
        if (files?.iconFile?.[0]) {
            finalIconUrl = `${req.protocol}://${req.get('host')}/uploads/icons/${files.iconFile[0].filename}`;
        } else if (typeof iconUrl === 'string' && iconUrl.trim().length > 0) {
            finalIconUrl = iconUrl.trim();
        }

        if (files?.modelFile?.[0]) {
            finalModelUrl = `${req.protocol}://${req.get('host')}/uploads/models/${files.modelFile[0].filename}`;
        } else if (typeof modelUrl === 'string' && modelUrl.trim().length > 0) {
            finalModelUrl = modelUrl.trim();
        }

        const poi = await prisma.pOI.create({
            data: { 
                nom, 
                description, 
                latitude: parseFloat(latitude), 
                longitude: parseFloat(longitude), 
                iconUrl: finalIconUrl,
                modelUrl: finalModelUrl,
                cityId: parseInt(cityId)
            },
            include: { city: true }
        });
        res.status(201).json(poi);
    } catch (err) {
        console.error('Error creating POI as admin:', err);
        res.status(500).json({ error: 'Error creating POI' });
    }
};

export const updatePOI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { nom, description, latitude, longitude, iconUrl, modelUrl } = req.body;

    try {
        // Construire l'objet d'update en normalisant les champs puis en supprimant les undefined
        const data: Record<string, unknown> = {
            nom,
            description,
            latitude,
            longitude,
            iconUrl: normalizeOptionalString(iconUrl),
            modelUrl: normalizeOptionalString(modelUrl),
        };
        Object.keys(data).forEach((k) => {
            if (data[k] === undefined) delete data[k];
        });

        const poi = await prisma.pOI.update({
            where: { id },
            data,
            include: { city: true }
        });
        res.json(poi);
    } catch (err) {
        if (hasPrismaCode(err) && err.code === 'P2025') {
            return res.status(404).json({ error: 'POI not found' });
        }
        console.error('Error updating POI:', err);
        res.status(500).json({ error: 'Error updating POI' });
    }
};

export const updatePOIAsAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const { nom, description, latitude, longitude, iconUrl, modelUrl } = req.body;
    const adminId = req.user?.id;

    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });

    try {
        // Vérifier que le POI existe et appartient à une ville de cet admin
        const existingPOI = await prisma.pOI.findFirst({
            where: {
                id: id,
                city: {
                    adminId: adminId
                }
            }
        });

        if (!existingPOI) {
            return res.status(403).json({ error: 'Vous n\'avez pas l\'autorisation de modifier ce POI' });
        }

        // Construire l'objet d'update en normalisant les champs puis en supprimant les undefined
        const data: Record<string, unknown> = {
            nom,
            description,
            latitude,
            longitude,
            iconUrl: normalizeOptionalString(iconUrl),
            modelUrl: normalizeOptionalString(modelUrl),
        };
        Object.keys(data).forEach((k) => {
            if (data[k] === undefined) delete data[k];
        });

        const poi = await prisma.pOI.update({
            where: { id },
            data,
            include: { city: true }
        });
        res.json(poi);
    } catch (err) {
        if (hasPrismaCode(err) && err.code === 'P2025') {
            return res.status(404).json({ error: 'POI not found' });
        }
        console.error('Error updating POI as admin:', err);
        res.status(500).json({ error: 'Error updating POI' });
    }
};

export const deletePOI = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    
    // Valider que l'ID est un nombre valide
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID POI invalide' });
    }
    
    try {
        await prisma.pOI.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        console.error('❌ Erreur lors de la suppression du POI:', err);
        if (hasPrismaCode(err) && err.code === 'P2025') {
            return res.status(404).json({ error: 'POI introuvable' });
        }
        res.status(500).json({ error: 'Erreur lors de la suppression du POI' });
    }
};

export const deletePOIAsAdmin = async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const adminId = req.user?.id;

    if (!adminId) return res.status(400).json({ error: 'Admin ID is required' });
    
    // Valider que l'ID est un nombre valide
    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID POI invalide' });
    }
    
    try {
        // Vérifier que le POI existe et appartient à une ville de cet admin
        const existingPOI = await prisma.pOI.findFirst({
            where: {
                id: id,
                city: {
                    adminId: adminId
                }
            }
        });

        if (!existingPOI) {
            return res.status(403).json({ error: 'Vous n\'avez pas l\'autorisation de supprimer ce POI' });
        }

        await prisma.pOI.delete({ where: { id } });
        res.status(204).send();
    } catch (err) {
        console.error('❌ Erreur lors de la suppression du POI en tant qu\'admin:', err);
        if (hasPrismaCode(err) && err.code === 'P2025') {
            return res.status(404).json({ error: 'POI introuvable' });
        }
        res.status(500).json({ error: 'Erreur lors de la suppression du POI' });
    }
};
