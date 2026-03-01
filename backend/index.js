import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDB } from './config/init.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes         from './routes/auth.js';
import usersRoutes        from './routes/users.js';
import tasksRoutes        from './routes/tasks.js';
import departmentsRoutes  from './routes/departments.js';
import notificationsRoutes from './routes/notifications.js';
import dashboardRoutes    from './routes/dashboard.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Security & middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/tasks',         tasksRoutes);
app.use('/api/departments',   departmentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard',     dashboardRoutes);

app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '2.0.0',
  environment: process.env.NODE_ENV,
}));

app.use(errorHandler);

initDB()
  .then(() => app.listen(PORT, () => {
    console.log(`\n🚀 UMS Pro Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  }))
  .catch((err) => {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  });

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
}

export default app;