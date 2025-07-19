import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import citiesRoutes from './routes/cities.routes';
import poisRoutes from './routes/pois.routes';

dotenv.config();
const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/auth', authRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/villes', citiesRoutes);
app.use('/api/pois', poisRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
