import { supabaseAdmin } from '../config/supabase.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const SUPABASE_DEMO_USER_ID = '780618c4-593d-435b-a877-88502029f863';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development, if no Supabase credentials exist yet, allow fallback demo session
      if (process.env.NODE_ENV !== 'production' && !supabaseAdmin) {
        req.user = {
          id: SUPABASE_DEMO_USER_ID,
          email: 'architect@intellidecision.ai',
          fullName: 'Lead Decision Architect',
          role: 'authenticated',
        };
        req.token = 'demo-token';
        return next();
      }
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // Development demo token support
    if (token === 'demo-token') {
      req.user = {
        id: SUPABASE_DEMO_USER_ID,
        email: 'architect@intellidecision.ai',
        fullName: 'Lead Decision Architect',
        role: 'authenticated',
      };
      req.token = token;
      return next();
    }

    // Supabase Auth verification
    if (supabaseAdmin) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        throw new UnauthorizedError('Invalid or expired Supabase authentication token');
      }

      req.user = {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email,
        role: user.role || 'authenticated',
      };
      req.token = token;
      return next();
    }

    // Default mock user if Supabase is unconfigured
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'architect@intellidecision.ai',
      fullName: 'Lead Decision Architect',
      role: 'authenticated',
    };
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}
