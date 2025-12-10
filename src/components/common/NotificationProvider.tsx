import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useApprovalNotifications } from '@/hooks/use-approval-notifications'
import { useAuthStore } from '@/store/authStore'
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
