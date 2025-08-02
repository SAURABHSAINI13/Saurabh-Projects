import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import patrolRoutes from './routes/routes.js';
import reportRoutes from './routes/reports.js';

dotenv.config();
await connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/routes', patrolRoutes);
app.use('/api/incident-report', reportRoutes);

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
