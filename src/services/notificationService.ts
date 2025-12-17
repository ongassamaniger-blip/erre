import type { Notification, NotificationStats } from '@/types'
import { supabase } from '@/lib/supabase'

// Helper to map DB result to Notification type
const mapToNotification = (data: any): Notification => {
  return {
    id: data.id,
    type: data.type || 'info',
    title: data.title,
    message: data.message,
    timestamp: data.timestamp || data.created_at,
    isRead: data.read || false,
    read: data.read || false,
    link: data.link || undefined,
    priority: data.priority || 'medium',
    metadata: data.metadata || {}
  }
}

export const notificationService = {
  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      // Get current user if not provided
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        console.warn('No user ID available for notifications')
        return []
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Get notifications error:', error)
        throw error
      }

      return (data || []).map(mapToNotification)
    } catch (error) {
      console.error('Get notifications error:', error)
      // Return empty array on error instead of throwing
      return []
    }
  },

  async getUnreadCount(userId?: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        return 0
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('read', false)

      if (error) {
        console.error('Get unread count error:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get unread count error:', error)
      return 0
    }
  },

  async getStats(userId?: string): Promise<NotificationStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        return { unread: 0, today: 0, thisWeek: 0 }
      }

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 3600000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600000)

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('read', false)

      // Get today's count
      const { count: todayCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gte('created_at', oneDayAgo.toISOString())

      // Get this week's count
      const { count: weekCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gte('created_at', oneWeekAgo.toISOString())

      return {
        unread: unreadCount || 0,
        today: todayCount || 0,
        thisWeek: weekCount || 0
      }
    } catch (error) {
      console.error('Get notification stats error:', error)
      return { unread: 0, today: 0, thisWeek: 0 }
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) {
        console.error('Mark notification as read error:', error)
        throw error
      }
    } catch (error) {
      console.error('Mark notification as read error:', error)
      throw error
    }
  },

  async markAllAsRead(userId?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        throw new Error('No user ID available')
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', targetUserId)
        .eq('read', false)

      if (error) {
        console.error('Mark all notifications as read error:', error)
        throw error
      }
    } catch (error) {
      console.error('Mark all notifications as read error:', error)
      throw error
    }
  },

  async deleteNotification(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete notification error:', error)
        throw error
      }
    } catch (error) {
      console.error('Delete notification error:', error)
      throw error
    }
  },

  async createNotification(notification: {
    userId: string
    title: string
    message: string
    type?: Notification['type']
    link?: string
    priority?: 'low' | 'medium' | 'high'
    metadata?: Record<string, any>
  }): Promise<Notification> {
    try {
      // Map frontend notification types to DB types
      const dbType = notification.type === 'info' || 
                     notification.type === 'success' || 
                     notification.type === 'warning' || 
                     notification.type === 'error'
        ? notification.type
        : 'info' // Default to 'info' for custom types like 'approval', 'approved', etc.

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: dbType,
          link: notification.link || null,
          priority: notification.priority || 'medium',
          read: false,
          metadata: notification.metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Create notification error:', error)
        throw error
      }

      return mapToNotification(data)
    } catch (error) {
      console.error('Create notification error:', error)
      throw error
    }
  }
}
