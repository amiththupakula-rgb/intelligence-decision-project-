import { dbService } from '../services/storage/databaseService.js';
import { NotFoundError } from '../utils/errors.js';

export const notificationController = {
  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const notifications = await dbService.listNotifications(userId);
      return res.json({
        success: true,
        message: 'Notifications retrieved',
        data: notifications,
        meta: { unreadCount: notifications.filter(n => !n.is_read).length },
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await dbService.markNotificationRead(userId, req.params.id);
      if (!updated) throw new NotFoundError('Notification not found');
      return res.json({
        success: true,
        message: 'Notification marked as read',
        data: { id: req.params.id, is_read: true },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
