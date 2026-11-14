import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { apiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';
import { logger } from './utils/logger.js';

export const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS setup
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow localhost during dev
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please retry after some time.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api/', limiter);

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Root & Health Check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'IntelliDecision AI API Engine',
    version: '1.0.0',
    baseApi: '/api/v1',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IntelliDecision AI API Engine',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// Mount versioned REST API, unversioned /api, and root endpoints
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Unmatched route handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized error handler
app.use(errorHandler);
