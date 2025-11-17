import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler } from './utils/errors';
import logger, { stream } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import publicRoutes from './routes/public.routes';

// Create Express app
const app = express();

app.set('trust proxy', 1);

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
}));

// ==========================================
// PARSING MIDDLEWARE
// ==========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==========================================
// LOGGING MIDDLEWARE
// ==========================================

// HTTP request logging
app.use(morgan(
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : 'dev',
  { stream }
));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
      memory: 'unknown' as 'healthy' | 'warning' | 'unknown'
    }
  };

  // Check database connection
  try {
    const { testDatabaseConnection } = await import('./config/database');
    const dbHealthy = await testDatabaseConnection();
    health.checks.database = dbHealthy ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    logger.error('Health check - database error:', error);
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memoryPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = memoryPercent < 90 ? 'healthy' : 'warning';

  const statusCode = health.checks.database === 'healthy' ? 200 : 503;
  
  logger.debug(`Health check requested from ${req.ip}`);
  
  res.status(statusCode).json(health);
});

// ==========================================
// API ROUTES
// ==========================================

const API_VERSION = process.env.API_VERSION || 'v1';

// API root
app.get(`/api/${API_VERSION}`, (req: Request, res: Response) => {
  logger.debug(`API root accessed from ${req.ip}`);
  
  res.json({
    success: true,
    message: `Cereforge API ${API_VERSION}`,
    version: API_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/public`, publicRoutes);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// ERROR HANDLER (Must be last)
// ==========================================

app.use(errorHandler);

export default app;