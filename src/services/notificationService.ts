import type { Notification, NotificationStats } from '@/types'

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return [
      {
        id: '1',
        type: 'approval',
        title: 'Yeni Onay Talebi',
        message: '25.000 TL tutarında bir harcama talebinizin onayını bekliyor',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        isRead: false,
        read: false,
        link: '/approvals',
        priority: 'high'
      },
      {
        id: '2',
        type: 'approved',
        title: 'Talep Onaylandı',
        message: 'Ofis ekipman alımı talebiniz onaylandı',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        isRead: false,
        read: false,
        link: '/finance/transactions'
      },
      {
        id: '3',
        type: 'deadline',
        title: 'Yaklaşan Son Tarih',
        message: 'Bütçe raporu için son 2 gün',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
        isRead: false,
        read: false,
        priority: 'medium'
      },
      {
        id: '4',
        type: 'comment',
        title: 'Yeni Yorum',
        message: 'Ahmet Yılmaz projenize yorum yaptı',
        timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
        isRead: true,
        read: true,
        link: '/projects/1'
      },
      {
        id: '5',
        type: 'reminder',
        title: 'Hatırlatma',
        message: 'Bugün 3 personel izin talebiniz var',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        isRead: true,
        read: true,
        link: '/hr/leaves'
      },
      {
        id: '6',
        type: 'rejected',
        title: 'Talep Reddedildi',
        message: 'Seyahat masrafı talebiniz reddedildi',
        timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        isRead: true,
        read: true,
        link: '/finance/transactions'
      },
      {
        id: '7',
        type: 'system',
        title: 'Sistem Güncellemesi',
        message: 'Bu gece 02:00-04:00 arası bakım çalışması yapılacak',
        timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
        isRead: true,
        read: true,
        priority: 'low'
      },
      {
        id: '8',
        type: 'mention',
        title: 'Etiketlendiniz',
        message: 'Fatma Demir sizi bir tartışmada etiketledi',
        timestamp: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        isRead: true,
        read: true,
        link: '/projects/2'
      }
    ]
  },

  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications()
    return notifications.filter(n => !n.isRead && !n.read).length
  },

  async getStats(): Promise<NotificationStats> {
    const notifications = await this.getNotifications()
    const now = Date.now()
    const oneDayAgo = now - 24 * 3600000
    const oneWeekAgo = now - 7 * 24 * 3600000

    return {
      unread: notifications.filter(n => !n.isRead && !n.read).length,
      today: notifications.filter(n => new Date(n.timestamp).getTime() > oneDayAgo).length,
      thisWeek: notifications.filter(n => new Date(n.timestamp).getTime() > oneWeekAgo).length
    }
  },

  async markAsRead(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  },

  async markAllAsRead(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
  },

  async deleteNotification(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}
