export type CalendarEventType = 
  | 'meeting' 
  | 'task' 
  | 'reminder' 
  | 'deadline' 
  | 'holiday' 
  | 'project' 
  | 'training' 
  | 'other'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string // ISO date string
  endDate: string // ISO date string
  startTime?: string // HH:mm format
  endTime?: string // HH:mm format
  allDay: boolean
  type: CalendarEventType
  color?: string
  location?: string
  attendees?: CalendarEventAttendee[]
  reminder?: CalendarEventReminder
  recurrence?: CalendarEventRecurrence
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  facilityId?: string
  relatedEntityId?: string // İlişkili entity (project, task, approval, vb.)
  relatedEntityType?: 'project' | 'task' | 'approval' | 'leave' | 'transaction'
  createdBy: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface CalendarEventAttendee {
  id: string
  name: string
  email?: string
  avatar?: string
  role?: string
  status: 'pending' | 'accepted' | 'declined' | 'tentative'
  responseDate?: string
}

export interface CalendarEventReminder {
  enabled: boolean
  minutesBefore: number[] // [15, 60, 1440] = 15 dakika, 1 saat, 1 gün önce
  notificationSent?: boolean[]
  lastSent?: string
}

export interface CalendarEventRecurrence {
  pattern: RecurrencePattern
  interval: number // Her X gün/hafta/ay/yıl
  endDate?: string // Tekrarın bitiş tarihi
  occurrences?: number // Toplam tekrar sayısı
  daysOfWeek?: number[] // 0=Pazar, 6=Cumartesi
  dayOfMonth?: number // Ayın kaçıncı günü
  exceptions?: string[] // Hariç tutulan tarihler
}

export interface CalendarFilters {
  facilityId?: string
  type?: CalendarEventType | 'all'
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'all'
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all'
  startDate?: string
  endDate?: string
  search?: string
}

export interface CalendarStats {
  totalEvents: number
  upcomingEvents: number
  todayEvents: number
  overdueEvents: number
  byType: Record<CalendarEventType, number>
  byStatus: Record<string, number>
}

