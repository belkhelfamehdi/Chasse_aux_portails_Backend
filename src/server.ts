import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { prisma } from './prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get('/', async (_, res) => {
  res.json({ message: '✅ CMS backend with TypeScript + Prisma is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
