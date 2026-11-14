import { dbService } from '../services/storage/databaseService.js';
import { supabaseAdmin } from '../config/supabase.js';

export const authController = {
  async getMe(req, res, next) {
    try {
      const user = req.user;
      const profile = await dbService.getProfile(user.id);
      return res.json({
        success: true,
        message: 'Current authenticated session retrieved',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: profile.full_name || user.fullName,
            avatarUrl: profile.avatar_url,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      return res.json({
        success: true,
        message: 'Session terminated successfully',
        data: {},
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const { email, password, fullName } = req.body;
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });
        if (error) throw error;
        await dbService.updateProfile(data.user.id, { full_name: fullName });
        return res.status(201).json({
          success: true,
          message: 'Account created successfully',
          data: { user: data.user },
          meta: {},
        });
      }

      // Demo/dev registration
      return res.status(201).json({
        success: true,
        message: 'Account registered (Development mode)',
        data: {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email,
            fullName,
          },
          token: 'demo-token',
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (supabaseAdmin) {
        // Authenticate with Supabase
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return res.json({
          success: true,
          message: 'Authenticated successfully',
          data: {
            user: data.user,
            session: data.session,
            token: data.session?.access_token,
          },
          meta: {},
        });
      }

      // Dev login
      return res.json({
        success: true,
        message: 'Authenticated successfully (Development Mode)',
        data: {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email,
            fullName: 'Lead Decision Architect',
          },
          token: 'demo-token',
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
