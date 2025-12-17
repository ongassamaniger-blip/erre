import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useApprovalNotifications } from '@/hooks/use-approval-notifications'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/services/notificationService'
import { toast } from 'sonner'
import type { Notification } from '@/types'

interface NotificationContextType {
  lastApprovalCheck: Date
  refreshApprovals: () => void
  notificationCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const user = useAuthStore(state => state.user)
  const notifications = useAuthStore(state => state.notifications)
  const addNotificationToStore = useAuthStore(state => state.addNotification)
  const loadUserNotifications = useAuthStore(state => state.loadUserNotifications)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { lastCheck, checkNow } = useApprovalNotifications({
    enabled: !!user,
    pollInterval: 30000,
    onNewApproval: () => {
      setRefreshTrigger(prev => prev + 1)
    }
  })

  const notificationCount = notifications.filter(n => !n.read).length

  const refreshApprovals = () => {
    checkNow()
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    addNotificationToStore(notification)
  }

  // Realtime subscription for notifications
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // New notification received
          const newNotification = payload.new as any
          const notification: Notification = {
            id: newNotification.id,
            type: newNotification.type || 'info',
            title: newNotification.title,
            message: newNotification.message,
            timestamp: newNotification.timestamp || newNotification.created_at,
            isRead: newNotification.read || false,
            read: newNotification.read || false,
            link: newNotification.link,
            priority: newNotification.priority || 'medium',
            metadata: newNotification.metadata || {}
          }

          // Add to store
          addNotificationToStore(notification)

          // Show toast for unread notifications
          if (!notification.read) {
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
              action: notification.link ? {
                label: 'Görüntüle',
                onClick: () => {
                  if (notification.link) {
                    window.location.href = notification.link
                  }
                }
              } : undefined
            })
          }

          // Refresh notification list
          loadUserNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Notification updated (e.g., marked as read)
          loadUserNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, addNotificationToStore, loadUserNotifications])

  return (
    <NotificationContext.Provider
      value={{
        lastApprovalCheck: lastCheck,
        refreshApprovals,
        notificationCount,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
