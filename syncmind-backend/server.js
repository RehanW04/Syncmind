import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';
import { connectDatabase, disconnectDatabase } from './db/index.js';
import { setupSocketHandlers } from './socket/handler.js';
import { getAiServiceUrl } from './services/aiClient.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'syncmind-backend',
    timestamp: new Date().toISOString(),
    aiServiceUrl: getAiServiceUrl()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

// Root route so visiting the backend URL directly doesn't look broken
app.get('/', (req, res) => {
  res.send('SyncMind Backend is running!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();
  httpServer.listen(PORT, () => {
    console.log(`SyncMind backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Database connection failed:', error);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}
