import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './utils/errors';
import { getApiLandingHtml } from './utils/apiLanding';
import logger, { stream } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import publicRoutes from './routes/public.routes';
import calendarRoutes from './routes/calendar.routes';
import adminRoutes from './routes/admin.routes'

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
// ✅ FIXED CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

// Add development origins explicitly
const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  allowedOrigins.push('http://localhost:5173'); // ✅ Vite default
  allowedOrigins.push('http://127.0.0.1:5173');
  allowedOrigins.push('http://localhost:5000'); // ✅ Backend itself
}

app.use(cors({
  origin: (origin, callback) => {
    // ✅ Allow requests with no origin (mobile apps, Postman, same-origin)
    if (!origin) {
      return callback(null, true);
    }

    // ✅ Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ✅ CRITICAL: Allows cookies to be sent/received
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  optionsSuccessStatus: 204 // ✅ Better for legacy browsers
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
// FAVICON
// ==========================================

app.get('/favicon.ico', (_req: Request, res: Response) => {
  const faviconPath = path.join(__dirname, 'assets', 'cereforge.ico');

  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  res.sendFile(faviconPath, (err) => {
    if (err) {
      logger.error('Failed to serve favicon:', err);
      res.status(404).send('Favicon not found');
    }
  });
});

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

  // Check if request accepts HTML (browser)
  if (req.accepts('html')) {
    const html = getApiLandingHtml(API_VERSION, process.env.NODE_ENV || 'development');
    res.send(html);
  } else {
    // JSON response for API clients
    res.json({
      success: true,
      message: `Cereforge API ${API_VERSION}`,
      version: API_VERSION,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/public`, publicRoutes);
app.use(`/api/${API_VERSION}/calendar`, calendarRoutes); 
app.use(`/api/${API_VERSION}/admin`, adminRoutes);

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