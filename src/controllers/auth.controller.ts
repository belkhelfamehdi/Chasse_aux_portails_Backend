import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { prisma } from '../prisma/client';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { resetLoginAttempts } from '../middlewares/rateLimit.middleware';

const toAbsoluteUrl = (req: Request, url?: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const origin = `${req.protocol}://${req.get('host')}`;
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const login = async (req: Request, res: Response) => {
    const {email, password} = req.body;

    if (!email || !password) return res.status(400).json({ error: "L'email et mot e passe sont obligatoires" });

    try {
        const user = await prisma.utilisateur.findUnique({
            where: { email }
        })

        if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) return res.status(401).json({ error: 'Identifiants invalides' });

        const payload = { id: user.id, email: user.email, role: user.role };
        const accessToken = generateAccessToken(payload)
        const refreshToken = generateRefreshToken(payload);

        // Reset login attempts for this IP on successful authentication
        resetLoginAttempts(req);

        res
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .json({
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    profilePictureUrl: toAbsoluteUrl(req, user.profilePictureUrl)
                }
            });

    }catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la connexion' });
    }
}

export const register = async (req: Request, res: Response) => {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname || !lastname || !email || !password) return res.status(400).json({ error: "Veillez remplir tout les champs" });

    try {
        const existingUser = await prisma.utilisateur.findUnique({
            where: { email }
        });

        if (existingUser) return res.status(409).json({ error: 'Email déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.utilisateur.create({
            data: {
                firstname,
                lastname,
                email,
                password: hashedPassword,
        role: 'ADMIN'
            }
        });

        res.status(201).json({
            id: newUser.id,
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            email: newUser.email,
            role: newUser.role
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de l\'inscription' });
    }
}

export const logout = (req: Request, res: Response) => {
    res
        .clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })
        .json({ message: 'Déconnexion réussie' });
}

export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.status(401).json({ error: 'No refresh token provided' });

    try{
        const decoded: any = verifyRefreshToken(refreshToken);
        
        const user = await prisma.utilisateur.findUnique({
            where: { id: decoded.id }
        })

        if (!user) return res.status(403).json({ error: 'Invalid token' });

        const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role });

    res.json({
            accessToken: newAccessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstname: user.firstname,
        lastname: user.lastname,
        profilePictureUrl: toAbsoluteUrl(req, user.profilePictureUrl)
            }
        });

    }catch (error) {
        console.error('Refresh token verification error:', error);
        return res.status(403).json({ error: 'Invalid refresh token' });
    }
}

export const changePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Le mot de passe actuel et le nouveau mot de passe sont obligatoires' });
    }

    if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    try {
        // Get the current user from database
        const user = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in database
        await prisma.utilisateur.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        res.json({ message: 'Mot de passe modifié avec succès' });

    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la modification du mot de passe' });
    }
}

export const updateProfilePicture = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    try {
        // Get the current user to check if they have an existing profile picture
        const user = await prisma.utilisateur.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Delete old profile picture if it exists
        if (user.profilePictureUrl) {
            const oldFilename = path.basename(user.profilePictureUrl);
            const oldFilePath = path.join(__dirname, '..', '..', 'uploads', 'profile-pictures', oldFilename);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Generate new profile picture URL
        const profilePictureUrl = `/uploads/profile-pictures/${file.filename}`;

        // Update user with new profile picture
        const updatedUser = await prisma.utilisateur.update({
            where: { id: userId },
            data: { profilePictureUrl },
            select: {
                id: true,
                email: true,
                role: true,
                firstname: true,
                lastname: true,
                profilePictureUrl: true
            }
        });

        res.json({
            message: 'Photo de profil mise à jour avec succès',
            user: {
                ...updatedUser,
                profilePictureUrl: toAbsoluteUrl(req, updatedUser.profilePictureUrl)
            }
        });

    } catch (error) {
        console.error('Update profile picture error:', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la photo de profil' });
    }
}