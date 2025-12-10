import { format, isToday, isPast } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { CalendarEvent } from '@/types/calendar'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface CalendarAgendaViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarAgendaView({
  currentDate,
  events,
  onEventClick,
}: CalendarAgendaViewProps) {
  // Etkinlikleri tarihe göre grupla
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = event.startDate
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, CalendarEvent[]>)

  // Tarihleri sırala
  const sortedDates = Object.keys(groupedEvents).sort()

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

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'Toplantı'
      case 'task': return 'Görev'
      case 'reminder': return 'Hatırlatıcı'
      case 'deadline': return 'Son Tarih'
      case 'holiday': return 'Tatil'
      case 'project': return 'Proje'
      case 'training': return 'Eğitim'
      default: return 'Diğer'
    }
  }

  return (
    <div className="space-y-6">
      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Etkinlik bulunmuyor
        </div>
      ) : (
        sortedDates.map(dateStr => {
          const date = new Date(dateStr + 'T00:00:00')
          const dayEvents = groupedEvents[dateStr].sort((a, b) => {
            if (a.allDay && !b.allDay) return -1
            if (!a.allDay && b.allDay) return 1
            if (a.allDay && b.allDay) return 0
            return (a.startTime || '00:00').localeCompare(b.startTime || '00:00')
          })

          return (
            <div key={dateStr}>
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  'text-2xl font-bold',
                  isToday(date) && 'text-primary'
                )}>
                  {format(date, 'd', { locale: tr })}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    'font-medium',
                    isToday(date) && 'text-primary'
                  )}>
                    {format(date, 'EEEE, MMMM yyyy', { locale: tr })}
                  </div>
                  {isToday(date) && (
                    <Badge variant="outline" className="mt-1">Bugün</Badge>
                  )}
                  {isPast(date) && !isToday(date) && (
                    <Badge variant="secondary" className="mt-1">Geçmiş</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3 ml-12">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                      getEventTypeColor(event.type)
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getEventTypeColor(event.type), 'text-white border-0')}
                        >
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        {event.priority === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">Acil</Badge>
                        )}
                        {event.priority === 'high' && (
                          <Badge variant="default" className="text-xs">Yüksek</Badge>
                        )}
                      </div>
                      <div className="font-medium">{event.title}</div>
                      {event.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {!event.allDay && event.startTime && (
                          <span>
                            🕐 {event.startTime}
                            {event.endTime && ` - ${event.endTime}`}
                          </span>
                        )}
                        {event.allDay && <span>📅 Tüm Gün</span>}
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="mt-6" />
            </div>
          )
        })
      )}
    </div>
  )
}

