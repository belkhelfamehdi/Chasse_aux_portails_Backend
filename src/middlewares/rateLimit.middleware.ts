import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Create a simple in-memory store for tracking login attempts
const attemptStore = new Map<string, { count: number; resetTime: number }>();

const getClientIP = (req: Request): string => {
    return req.ip || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.socket.remoteAddress || 
           'unknown';
};

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        error: 'Too many login attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        return getClientIP(req);
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Too many login attempts, please try again later.',
            retryAfter: '15 minutes'
        });
    },
    // Custom store to track attempts
    store: {
        incr: (key: string, callback: (error: any, totalHits: number, resetTime?: Date) => void) => {
            const now = Date.now();
            const windowMs = 15 * 60 * 1000;
            
            if (!attemptStore.has(key)) {
                attemptStore.set(key, { count: 1, resetTime: now + windowMs });
                callback(null, 1, new Date(now + windowMs));
                return;
            }
            
            const data = attemptStore.get(key)!;
            
            // Check if window has expired
            if (now > data.resetTime) {
                data.count = 1;
                data.resetTime = now + windowMs;
            } else {
                data.count++;
            }
            
            callback(null, data.count, new Date(data.resetTime));
        },
        decrement: (key: string) => {
            // Not used by rate-limit, but required by interface
        },
        resetKey: (key: string) => {
            attemptStore.delete(key);
        },
        resetAll: () => {
            attemptStore.clear();
        }
    }
});

// Function to reset rate limit for a specific IP on successful login
export const resetLoginAttempts = (req: Request) => {
    const key = getClientIP(req);
    attemptStore.delete(key);
};