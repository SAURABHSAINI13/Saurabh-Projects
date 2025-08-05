// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import patrolRoutes from './routes/patrolRoutes.js'; // ensure filename matches
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import modelRoutes from './routes/models.js';
import assetRoutes from './routes/assetRoutes.js';
import aiModelRoutes from './routes/aiModelRoutes.js';
import modelFeedbackRoutes from './routes/modelFeedbackRoutes.js';

// Services
import { processFeedbackForRetraining } from './workers/retrainingWorker.js';

// Load env vars early
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // In production, restrict origin explicitly e.g., { origin: ['https://yourdomain.com'] }
app.use(express.json());

// Route mounting (order/grouped)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/routes', patrolRoutes);
app.use('/api/incident-report', reportRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/ai-models', aiModelRoutes);
app.use('/api/feedback', modelFeedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'undefined',
  });
});

// Start background feedback processing
setInterval(() => {
  processFeedbackForRetraining().catch((err) => {
    console.error('Error in feedback batch processing:', err);
  });
}, 60 * 60 * 1000); // every hour

// HTTP + Socket.IO setup
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new IOServer(httpServer, {
  cors: {
    origin: '*', // tighten in production
    methods: ['GET', 'POST'],
  },
});

// Socket authentication middleware
io.use((socket, next) => {
  const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  let token;

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (typeof socket.handshake.auth?.token === 'string') {
    token = socket.handshake.auth.token;
  }

  if (!token) {
    // If anonymous connections should be allowed, replace with: return next();
    return next(new Error('Authentication error: token missing'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    next();
  } catch (e) {
    console.warn('Socket auth failed:', e.message);
    return next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(
    'Socket connected:',
    socket.id,
    socket.user ? `(user=${socket.user.username || socket.user.id})` : '(anonymous)'
  );

  socket.on('subscribe', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Expose io to controllers
app.set('io', io);

// Helper to broadcast alerts
export const broadcastNewAlert = (alert) => {
  io.emit('new-alert', alert);
};

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const start = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(
        `🚀 Server + Socket.IO running on port ${PORT} (env: ${process.env.NODE_ENV || 'dev'})`
      );
    });

    const shutdown = (signal) => {
      console.log(`\nReceived ${signal}. Shutting down...`);
      httpServer.close(() => {
        console.log('HTTP/SOCKET server closed.');
        process.exit(0);
      });
      setTimeout(() => {
        console.warn('Forcefully exiting.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
