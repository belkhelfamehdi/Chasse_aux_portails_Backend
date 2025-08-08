import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import citiesRoutes from './routes/cities.routes';
import poisRoutes from './routes/pois.routes';
import adminsRoutes from './routes/admins.routes';

dotenv.config();
const app = express();
const helmet = require('helmet');
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/pois', poisRoutes);
app.use('/api/admins', adminsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
