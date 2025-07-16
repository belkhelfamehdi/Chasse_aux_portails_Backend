import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const generateAccessToken = (payload: object) => {
    console.log(ACCESS_SECRET, REFRESH_SECRET);
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: object) => {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, REFRESH_SECRET);
};
