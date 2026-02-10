import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

import authRoutes from './routes/auth.routes';
import cropRoutes from './routes/crop.routes';
import schemeRoutes from './routes/scheme.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/schemes', schemeRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to AgroIntel API' });
});

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
