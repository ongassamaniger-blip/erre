import { format, startOfWeek, endOfWeek, addDays, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { CalendarEvent } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CalendarWeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarWeekView({
  currentDate,
  events,
  onEventClick,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter(e => e.startDate === dateStr)
  }

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

  const getEventPosition = (event: CalendarEvent) => {
    if (event.allDay || !event.startTime) {
      return { top: 0, height: 32 }
    }
    const [hours, minutes] = (event.startTime || '00:00').split(':').map(Number)
    const [endHours, endMins] = (event.endTime || '23:59').split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutesTotal = endHours * 60 + endMins
    const duration = endMinutesTotal - startMinutes

    return {
      top: (startMinutes / 60) * 60, // Her saat 60px
      height: Math.max(32, (duration / 60) * 60),
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="space-y-2">
      {/* Hafta günleri başlığı */}
      <div className="grid grid-cols-8 gap-2 border-b pb-2">
        <div className="text-sm font-medium text-muted-foreground">Saat</div>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              'text-center text-sm font-medium',
              isToday(day) && 'text-primary font-bold'
            )}
          >
            <div>{format(day, 'EEE', { locale: tr })}</div>
            <div className="text-lg">{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-8 gap-2">
          {/* Saat sütunu */}
          <div className="space-y-0">
            {hours.map(hour => (
              <div
                key={hour}
                className="h-16 border-b text-xs text-muted-foreground pr-2 text-right"
              >
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
            ))}
          </div>

          {/* Gün sütunları */}
          {weekDays.map((day, dayIndex) => {
            const dayEvents = getEventsForDay(day)

            return (
              <div key={dayIndex} className="relative space-y-0">
                {hours.map(hour => (
                  <div
                    key={hour}
                    className={cn(
                      'h-16 border-b',
                      isToday(day) && 'bg-primary/5'
                    )}
                  />
                ))}
                
                {/* Etkinlikler */}
                <div className="absolute inset-0 pointer-events-none">
                  {dayEvents.map(event => {
                    if (event.allDay) {
                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={cn(
                            'px-2 py-1 mb-1 rounded text-xs text-white truncate cursor-pointer pointer-events-auto hover:opacity-80',
                            getEventTypeColor(event.type)
                          )}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      )
                    }

                    const position = getEventPosition(event)
                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        style={{
                          top: `${position.top}px`,
                          height: `${position.height}px`,
                        }}
                        className={cn(
                          'absolute left-0 right-0 px-2 py-1 rounded text-xs text-white cursor-pointer pointer-events-auto hover:opacity-80 overflow-hidden',
                          getEventTypeColor(event.type)
                        )}
                        title={event.title}
                      >
                        <div className="font-medium">{event.title}</div>
                        {event.startTime && (
                          <div className="text-xs opacity-90">
                            {event.startTime} - {event.endTime || '23:59'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

