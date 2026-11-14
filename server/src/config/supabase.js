import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let supabaseAdmin = null;

if (config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  const keyToUse = config.supabase.serviceRoleKey || config.supabase.anonKey;
  supabaseAdmin = createClient(config.supabase.url, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  logger.info('[Supabase] Initialized Supabase admin client.');
} else {
  logger.warn('[Supabase] Supabase credentials not fully configured. Using mock/development mode.');
}

/**
 * Creates a user-scoped Supabase client that honors Row Level Security (RLS)
 * using the authenticated user's access token.
 */
export function createUserScopedClient(accessToken) {
  if (!config.supabase.url || !config.supabase.anonKey) {
    return null;
  }

  return createClient(config.supabase.url, config.supabase.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { supabaseAdmin };
