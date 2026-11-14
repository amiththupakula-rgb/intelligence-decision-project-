import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtAudience: process.env.JWT_AUDIENCE || 'authenticated',
  },

  db: {
    directUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
    host: process.env.SUPABASE_DB_HOST || '',
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432', 10),
    name: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || '',
    ssl: process.env.SUPABASE_DB_SSL !== 'false',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    timeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '60000', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '2', 10),
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '8192', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  },

  upload: {
    maxFileSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10)) * 1024 * 1024,
    maxRows: parseInt(process.env.MAX_DATASET_ROWS || '100000', 10),
  },
};
