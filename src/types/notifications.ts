export interface Notification {
  id: string
  type: 'approval' | 'approved' | 'rejected' | 'reminder' | 'deadline' | 'comment' | 'mention' | 'system' | 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: string
  isRead?: boolean
  read?: boolean
  link?: string
  metadata?: Record<string, any>
  priority?: 'low' | 'medium' | 'high'
}

export interface NotificationStats {
  unread: number
  today: number
  thisWeek: number
}
