import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string, limit = 20) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);
    return { items, unreadCount };
  }

  async markAsRead(userId: string, id?: string) {
    if (id) {
      await this.prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }
    return { success: true };
  }

  async notify(userId: string, type: NotificationType, title: string, message: string, linkUrl?: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl,
      },
    });
  }
}
