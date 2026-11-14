import pg from 'pg';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

let pool = null;

if (config.db.directUrl || (config.db.host && config.db.password)) {
  const poolConfig = config.db.directUrl
    ? {
        connectionString: config.db.directUrl,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: config.db.host,
        port: config.db.port,
        database: config.db.name,
        user: config.db.user,
        password: config.db.password,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
      };

  pool = new Pool(poolConfig);
  pool.on('error', (err) => {
    logger.error(`[PostgreSQL Pool Error]: ${err.message}`);
  });
  logger.info('[PostgreSQL] Initialized database connection pool.');
} else {
  logger.warn('[PostgreSQL] Database credentials not configured.');
}

export { pool };
