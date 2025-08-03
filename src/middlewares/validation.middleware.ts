import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Schéma pour l'inscription
export const registerSchema = z.object({
  firstname: z.string().min(1, 'Le prénom est requis'),
  lastname: z.string().min(1, 'Le nom est requis'),
  email: z.email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN']).optional(),
});

// Schéma pour le login
export const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

// Schéma pour la création d'un POI
export const createPOISchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  description: z.string().min(1, 'La description est requise'),
  latitude: z.number('Latitude invalide'),
  longitude: z.number('Longitude invalide'),
  iconUrl: z.url('URL de l\'icône invalide'),
  modelUrl: z.url('URL du modèle invalide'),
  cityId: z.number('cityId invalide'),
});

// Schéma pour la mise à jour d'un POI (cityId non modifiable)
export const updatePOISchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  description: z.string().min(1, 'La description est requise'),
  latitude: z.number('Latitude invalide'),
  longitude: z.number('Longitude invalide'),
  iconUrl: z.url('URL de l\'icône invalide'),
  modelUrl: z.url('URL du modèle invalide'),
});

// Schéma pour la création d'une City
export const createCitySchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  latitude: z.number('Latitude invalide'),
  longitude: z.number('Longitude invalide'),
  rayon: z.number('Rayon invalide'),
  adminId: z.number('adminId invalide'),
});

// Schéma pour la mise à jour d'une City (adminId non modifiable)
export const updateCitySchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  latitude: z.number('Latitude invalide'),
  longitude: z.number('Longitude invalide'),
  rayon: z.number('Rayon invalide'),
});

// Middleware générique de validation Zod
export const validateBody = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  req.body = result.data; // On remplace par les données validées
  next();
};

// Middleware générique de validation Zod pour les paramètres d'URL
export const validateParams = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.issues });
  }
  req.params = result.data;
  next();
};

// Schéma pour un paramètre id numérique
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID invalide').transform(Number),
});