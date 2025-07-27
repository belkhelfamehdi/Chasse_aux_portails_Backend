import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { prisma } from '../prisma/client';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';

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

        res
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            })
            .json({
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });

    }catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la connexion' });
    }
}

export const register = async (req: Request, res: Response) => {
    const { firstname, lastname, email, password, role } = req.body;
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
                role: role || 'USER'
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
            secure: false,
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

        res.json({ accessToken: newAccessToken });

    }catch (error) {
        console.error('Refresh token verification error:', error);
        return res.status(403).json({ error: 'Invalid refresh token' });
    }
}