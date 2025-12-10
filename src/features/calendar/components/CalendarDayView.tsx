import { format, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { CalendarEvent } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CalendarDayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarDayView({
  currentDate,
  events,
  onEventClick,
}: CalendarDayViewProps) {
  const dateStr = format(currentDate, 'yyyy-MM-dd')
  const dayEvents = events.filter(e => e.startDate === dateStr)

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500'
      case 'task': return 'bg-purple-500'
      case 'reminder': return 'bg-yellow-500'
      case 'deadline': return 'bg-red-500'
      case 'holiday': return 'bg-orange-500'
      case 'project': return 'bg-indigo-500'
      case 'training': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Etkinlikleri saate göre sırala
  const sortedEvents = [...dayEvents].sort((a, b) => {
    if (a.allDay && !b.allDay) return -1
    if (!a.allDay && b.allDay) return 1
    if (a.allDay && b.allDay) return 0
    
    const timeA = a.startTime || '00:00'
    const timeB = b.startTime || '00:00'
    return timeA.localeCompare(timeB)
  })

  const getEventPosition = (event: CalendarEvent) => {
    if (event.allDay || !event.startTime) {
      return null
    }
    const [startHrs, startMins] = (event.startTime || '00:00').split(':').map(Number)
    const [endHrs, endMins] = (event.endTime || '23:59').split(':').map(Number)
    const startMinutes = startHrs * 60 + startMins
    const endMinutesTotal = endHrs * 60 + endMins
    const duration = endMinutesTotal - startMinutes

    return {
      top: (startMinutes / 60) * 60, // Her saat 60px
      height: Math.max(40, (duration / 60) * 60),
    }
  }

  return (
    <div className="space-y-4">
      {/* Tüm gün etkinlikleri */}
      {sortedEvents.filter(e => e.allDay).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Tüm Gün</div>
          <div className="space-y-2">
            {sortedEvents
              .filter(e => e.allDay)
              .map(event => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    'px-4 py-3 rounded-lg border-l-4 cursor-pointer hover:bg-accent transition-colors',
                    getEventTypeColor(event.type),
                    'border-l-4'
                  )}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </div>
                  )}
                  {event.location && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📍 {event.location}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Saatlik etkinlikler */}
      <ScrollArea className="h-[600px]">
        <div className="relative">
          {/* Saat çizgileri */}
          <div className="space-y-0">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-16 border-b flex items-start"
              >
                <div className="text-xs text-muted-foreground pr-4 w-16 text-right pt-1">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
                <div className="flex-1 relative">
                  {/* Etkinlikler */}
                  {sortedEvents
                    .filter(e => !e.allDay)
                    .map(event => {
                      const position = getEventPosition(event)
                      if (!position) return null

                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                          }}
                          className={cn(
                            'absolute left-0 right-0 px-3 py-2 rounded-lg cursor-pointer hover:opacity-90 transition-opacity',
                            getEventTypeColor(event.type),
                            'text-white'
                          )}
                        >
                          <div className="font-medium text-sm">{event.title}</div>
                          {event.startTime && event.endTime && (
                            <div className="text-xs opacity-90 mt-1">
                              {event.startTime} - {event.endTime}
                            </div>
                          )}
                          {event.location && (
                            <div className="text-xs opacity-75 mt-1">
                              📍 {event.location}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {sortedEvents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Bu gün için etkinlik bulunmuyor
        </div>
      )}
    </div>
  )
}

