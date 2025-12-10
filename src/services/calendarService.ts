import type {
  CalendarEvent,
  CalendarFilters,
  CalendarStats,
  CalendarEventType,
} from '@/types/calendar'
import { supabase } from '@/lib/supabase'

export const calendarService = {
  async getEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }

      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('start_date', filters.endDate)
      }

      // Search (client-side filtering might be better for complex search, but let's try basic ILIKE)
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('start_date', { ascending: true })

      if (error) throw error

      return (data || []).map(this.mapToCalendarEvent)
    } catch (error) {
      console.error('Get events error:', error)
      return []
    }
  },

  async getEventById(id: string): Promise<CalendarEvent | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return null

      return this.mapToCalendarEvent(data)
    } catch (error) {
      console.error('Get event by id error:', error)
      return null
    }
  },

  async getEventsByDateRange(
    startDate: string,
    endDate: string,
    facilityId?: string
  ): Promise<CalendarEvent[]> {
    return this.getEvents({
      startDate,
      endDate,
      facilityId,
    })
  },

  async createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    try {
      const dbEvent = this.mapToDbEvent(event)

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(dbEvent)
        .select()
        .single()

      if (error) throw error

      return this.mapToCalendarEvent(data)
    } catch (error) {
      console.error('Create event error:', error)
      throw error
    }
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const dbUpdates = this.mapToDbEvent(updates, true)

      const { data, error } = await supabase
        .from('calendar_events')
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.mapToCalendarEvent(data)
    } catch (error) {
      console.error('Update event error:', error)
      throw error
    }
  },

  async deleteEvent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete event error:', error)
      throw error
    }
  },

  async getStats(facilityId?: string): Promise<CalendarStats> {
    try {
      const events = await this.getEvents({ facilityId })
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()

      const todayEvents = events.filter(e => e.startDate === today)
      const upcomingEvents = events.filter(
        e => e.status === 'scheduled' && new Date(`${e.startDate} ${e.startTime || '00:00'}`) > now
      )
      const overdueEvents = events.filter(
        e =>
          e.status === 'scheduled' &&
          new Date(`${e.startDate} ${e.startTime || '00:00'}`) < now &&
          e.startDate < today
      )

      const byType = events.reduce(
        (acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        },
        {} as Record<CalendarEventType, number>
      )

      const byStatus = events.reduce(
        (acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      return {
        totalEvents: events.length,
        upcomingEvents: upcomingEvents.length,
        todayEvents: todayEvents.length,
        overdueEvents: overdueEvents.length,
        byType,
        byStatus,
      }
    } catch (error) {
      console.error('Get stats error:', error)
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        todayEvents: 0,
        overdueEvents: 0,
        byType: {} as any,
        byStatus: {},
      }
    }
  },

  // Helper to map DB result to CalendarEvent
  mapToCalendarEvent(data: any): CalendarEvent {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      startTime: data.start_time,
      endTime: data.end_time,
      allDay: data.all_day,
      type: data.type,
      color: data.color,
      location: data.location,
      attendees: data.attendees || [],
      reminder: data.reminder,
      status: data.status,
      priority: data.priority,
      facilityId: data.facility_id,
      relatedEntityId: data.related_entity_id,
      relatedEntityType: data.related_entity_type,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  // Helper to map CalendarEvent to DB object
  mapToDbEvent(event: Partial<CalendarEvent>, isUpdate = false): any {
    const dbEvent: any = {}

    if (event.title !== undefined) dbEvent.title = event.title
    if (event.description !== undefined) dbEvent.description = event.description
    if (event.startDate !== undefined) dbEvent.start_date = event.startDate
    if (event.endDate !== undefined) dbEvent.end_date = event.endDate
    if (event.startTime !== undefined) dbEvent.start_time = event.startTime
    if (event.endTime !== undefined) dbEvent.end_time = event.endTime
    if (event.allDay !== undefined) dbEvent.all_day = event.allDay
    if (event.type !== undefined) dbEvent.type = event.type
    if (event.color !== undefined) dbEvent.color = event.color
    if (event.location !== undefined) dbEvent.location = event.location
    if (event.attendees !== undefined) dbEvent.attendees = event.attendees
    if (event.reminder !== undefined) dbEvent.reminder = event.reminder
    if (event.status !== undefined) dbEvent.status = event.status
    if (event.priority !== undefined) dbEvent.priority = event.priority
    if (event.facilityId !== undefined) dbEvent.facility_id = event.facilityId
    if (event.relatedEntityId !== undefined) dbEvent.related_entity_id = event.relatedEntityId
    if (event.relatedEntityType !== undefined) dbEvent.related_entity_type = event.relatedEntityType
    if (event.createdBy !== undefined) dbEvent.created_by = event.createdBy

    // createdAt is usually handled by default value in DB, but if passed:
    if (!isUpdate && event.createdAt) dbEvent.created_at = event.createdAt

    return dbEvent
  }
}
