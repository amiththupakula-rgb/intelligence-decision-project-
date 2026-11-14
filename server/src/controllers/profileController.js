import { dbService } from '../services/storage/databaseService.js';
import { updateProfileSchema } from '../validators/schemas.js';

export const profileController = {
  async get(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await dbService.getProfile(userId);
      return res.json({
        success: true,
        message: 'Profile retrieved',
        data: profile,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const validated = updateProfileSchema.parse(req.body);
      const updated = await dbService.updateProfile(userId, validated);
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
