import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay, addDays, getDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { CalendarEvent } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface CalendarMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}

export function CalendarMonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

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

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

  return (
    <div className="space-y-2">
      {/* Hafta günleri başlığı */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Takvim grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isCurrentDay = isToday(day)

          return (
            <div
              key={index}
              className={cn(
                'min-h-[100px] border rounded-lg p-2 cursor-pointer hover:bg-accent transition-colors',
                !isCurrentMonth && 'opacity-40',
                isCurrentDay && 'ring-2 ring-primary'
              )}
              onClick={() => onDateClick(day)}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-1',
                  isCurrentDay && 'text-primary font-bold'
                )}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80',
                      getEventTypeColor(event.type),
                      'text-white'
                    )}
                    title={event.title}
                  >
                    {event.allDay || !event.startTime
                      ? event.title
                      : `${event.startTime} ${event.title}`}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} daha
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

