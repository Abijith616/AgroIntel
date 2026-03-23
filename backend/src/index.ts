import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

import authRoutes from './routes/auth.routes';
import cropRoutes from './routes/crop.routes';
import schemeRoutes from './routes/scheme.routes';
import weatherRoutes from './routes/weather.routes';
import marketRoutes from './routes/market.routes';
import aiReportRoutes from './routes/ai-report.routes';
import expenseRoutes from './routes/expense.routes';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ai-report', aiReportRoutes);
app.use('/api/expenses', expenseRoutes);

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
