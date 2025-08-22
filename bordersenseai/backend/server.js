import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Import authentication middleware
import { authenticate, authorizeRoles } from './middleware/auth.js';
import { tokenManager } from './utils/jwt.js';
import { logger } from './utils/logger.js';

// Routes
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import patrolRoutes from './routes/routes.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import modelRoutes from './routes/models.js';
import assetRoutes from './routes/assetRoutes.js';
import aiModelRoutes from './routes/aiModelRoutes.js';
import modelFeedbackRoutes from './routes/modelFeedbackRoutes.js';

// Workers
import { processFeedbackForRetraining } from './workers/retrainingWorker.js';

dotenv.config();

// ===== MongoDB Connection =====
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bordersenseai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info({ msg: 'Connected to MongoDB' });
  } catch (err) {
    logger.error({ msg: 'MongoDB connection error', error: err.message });
    process.exit(1);
  }
};

// Authentication middleware is now imported from './middleware/auth.js'

const app = express();

// ===== Middleware =====
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // per IP
  })
);

// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/routes', patrolRoutes);
app.use('/api/incident-report', reportRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/ai-models', aiModelRoutes);
app.use('/api/feedback', modelFeedbackRoutes);

// Extra custom endpoints
app.get('/api/alerts', authenticate, authorizeRoles(['FIELD_OFFICER', 'COMMAND_CENTER', 'ADMIN']), async (req, res) => {
  try {
    const alerts = await mongoose.model('Alert').find({ active: true });
    res.json(alerts);
  } catch (err) {
    logger.error({ msg: 'Failed to fetch alerts', error: err.message });
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/ground-reports', authenticate, authorizeRoles(['FIELD_OFFICER']), async (req, res) => {
  try {
    const { report, media } = req.body;
    if (!report) return res.status(400).json({ error: 'Report content required' });
    const newReport = await mongoose.model('GroundReport').create({
      userId: req.user.id,
      report,
      media,
      timestamp: new Date(),
    });
    app.get('io').emit('new_report', newReport);
    res.status(201).json({ message: 'Report submitted', data: newReport });
  } catch (err) {
    logger.error({ msg: 'Failed to submit report', error: err.message });
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ===== Background Tasks =====
setInterval(() => {
  processFeedbackForRetraining().catch((err) => {
    console.error('Error in feedback batch processing:', err);
  });
}, 60 * 60 * 1000); // every hour

// ===== Server & Socket.IO =====
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) return next(new Error('Authentication error: token missing'));
  try {
    const payload = tokenManager.verifyAccessToken(token);
    socket.user = payload;
    next();
  } catch (e) {
    logger.warn({ msg: 'Socket auth failed', error: e.message });
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info({ 
    msg: 'Socket connected', 
    socketId: socket.id, 
    user: socket.user?.username || socket.user?.id || 'anonymous' 
  });
  
  socket.on('subscribe', (room) => socket.join(room));
  
  socket.on('disconnect', () => {
    logger.info({ msg: 'Socket disconnected', socketId: socket.id });
  });
});

app.set('io', io);

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  logger.error({ msg: 'Unhandled error', error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ===== Start Server =====
const start = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      logger.info({ 
        msg: 'Server started', 
        port: PORT, 
        environment: process.env.NODE_ENV || 'development' 
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info({ msg: 'Shutting down server' });
  httpServer.close(() => {
    mongoose.connection.close();
    logger.info({ msg: 'Server and MongoDB connection closed' });
    process.exit(0);
  });
});

start();