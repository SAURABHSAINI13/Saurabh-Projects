import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Routes
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import patrolRoutes from './routes/patrolRoutes.js';
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
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// ===== JWT Auth Middleware =====
const authenticateToken = (rolesAllowed = []) => {
  return (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      if (rolesAllowed.length && !rolesAllowed.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      req.user = user;
      next();
    });
  };
};

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
app.get('/api/alerts', authenticateToken(['field_officer', 'command_officer', 'admin']), async (req, res) => {
  try {
    const alerts = await mongoose.model('Alert').find({ active: true });
    res.json(alerts);
  } catch (err) {
    console.error('GET /api/alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/ground-reports', authenticateToken(['field_officer']), async (req, res) => {
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
    console.error('POST /api/ground-reports error:', err);
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
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    next();
  } catch (e) {
    console.warn('Socket auth failed:', e.message);
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (user=${socket.user?.username || socket.user?.id || 'anonymous'})`);
  socket.on('subscribe', (room) => socket.join(room));
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

app.set('io', io);

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== Start Server =====
const start = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server + Socket.IO running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  httpServer.close(() => {
    mongoose.connection.close();
    console.log('Server and MongoDB connection closed.');
    process.exit(0);
  });
});

start();
