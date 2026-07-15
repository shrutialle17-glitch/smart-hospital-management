import { prisma } from '../index.js';

export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.status(200).json({ success: true, data: notifications, meta: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id, userId: req.user.id }, // ensure they own it
      data: { isRead: true }
    });

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    }
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
