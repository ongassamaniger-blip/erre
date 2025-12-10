import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CalendarBlank,
  Plus,
  MagnifyingGlass,
  FunnelSimple,
  ArrowLeft,
  ArrowRight,
  List,
  GridFour,
  Clock,
} from '@phosphor-icons/react'
import { calendarService } from '@/services/calendarService'
import type { CalendarEvent, CalendarView, CalendarFilters } from '@/types/calendar'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { useCalendarReminders } from '@/hooks/use-calendar-reminders'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, isSameDay, isSameMonth, isToday, parseISO, getDay } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarMonthView } from './components/CalendarMonthView'
import { CalendarWeekView } from './components/CalendarWeekView'
import { CalendarDayView } from './components/CalendarDayView'
import { CalendarAgendaView } from './components/CalendarAgendaView'
import { EventDialog } from './components/EventDialog'
import { CalendarStats } from './components/CalendarStats'

export function CalendarPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [filters, setFilters] = useState<CalendarFilters>({
    facilityId: selectedFacility?.id,
    type: 'all',
    status: 'all',
    priority: 'all',
  })
  const [search, setSearch] = useState('')

  // Tarih aralığını hesapla
  const getDateRange = useCallback(() => {
    switch (view) {
      case 'month':
        return {
          startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
        }
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        return {
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        }
      case 'day':
        return {
          startDate: format(currentDate, 'yyyy-MM-dd'),
          endDate: format(currentDate, 'yyyy-MM-dd'),
        }
      case 'agenda':
        return {
          startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(addMonths(currentDate, 2)), 'yyyy-MM-dd'),
        }
      default:
        return {
          startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
        }
    }
  }, [view, currentDate])

  const dateRange = getDateRange()

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events', filters, dateRange],
    queryFn: () =>
      calendarService.getEvents({
        ...filters,
        ...dateRange,
        search: search || undefined,
      }),
    enabled: !!selectedFacility?.id,
  })

  const { data: stats } = useQuery({
    queryKey: ['calendar-stats', selectedFacility?.id],
    queryFn: () => calendarService.getStats(selectedFacility?.id),
    enabled: !!selectedFacility?.id,
  })

  const createMutation = useMutation({
    mutationFn: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) =>
      calendarService.createEvent(event),
    onSuccess: () => {
      toast.success('Etkinlik başarıyla oluşturuldu')
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] })
      setEventDialogOpen(false)
      setEditingEvent(null)
    },
    onError: () => {
      toast.error('Etkinlik oluşturulurken bir hata oluştu')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) =>
      calendarService.updateEvent(id, updates),
    onSuccess: () => {
      toast.success('Etkinlik başarıyla güncellendi')
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] })
      setEventDialogOpen(false)
      setEditingEvent(null)
    },
    onError: () => {
      toast.error('Etkinlik güncellenirken bir hata oluştu')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.deleteEvent(id),
    onSuccess: () => {
      toast.success('Etkinlik başarıyla silindi')
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] })
    },
    onError: () => {
      toast.error('Etkinlik silinirken bir hata oluştu')
    },
  })

  const handleCreateEvent = () => {
    setEditingEvent(null)
    setEventDialogOpen(true)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setEventDialogOpen(true)
  }

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    switch (direction) {
      case 'prev':
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
        else if (view === 'day') setCurrentDate(subDays(currentDate, 1))
        break
      case 'next':
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
        else if (view === 'day') setCurrentDate(addDays(currentDate, 1))
        break
      case 'today':
        setCurrentDate(new Date())
        break
    }
  }

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: tr })
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(weekStart, 'd MMM', { locale: tr })} - ${format(weekEnd, 'd MMM yyyy', { locale: tr })}`
      case 'day':
        return format(currentDate, 'd MMMM yyyy, EEEE', { locale: tr })
      case 'agenda':
        return format(currentDate, 'MMMM yyyy', { locale: tr })
      default:
        return format(currentDate, 'MMMM yyyy', { locale: tr })
    }
  }

  // Hatırlatıcı kontrolü
  useCalendarReminders({
    enabled: true,
    pollInterval: 60000, // Her dakika kontrol et
  })

  useEffect(() => {
    if (selectedFacility?.id) {
      setFilters(prev => ({ ...prev, facilityId: selectedFacility.id }))
    }
  }, [selectedFacility?.id])

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Takvim</h1>
            <p className="text-muted-foreground mt-1">
              Etkinliklerinizi planlayın ve takip edin
            </p>
          </div>
          <Button onClick={handleCreateEvent} className="gap-2">
            <Plus size={16} />
            Yeni Etkinlik
          </Button>
        </div>
      </div>

      {stats && <CalendarStats stats={stats} />}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('prev')}
              >
                <ArrowLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('today')}
              >
                Bugün
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate('next')}
              >
                <ArrowRight size={16} />
              </Button>
              <div className="ml-4 font-semibold text-lg">{getViewTitle()}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Etkinlik ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Ay</SelectItem>
                  <SelectItem value="week">Hafta</SelectItem>
                  <SelectItem value="day">Gün</SelectItem>
                  <SelectItem value="agenda">Ajanda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, type: value as any }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="meeting">Toplantı</SelectItem>
                <SelectItem value="task">Görev</SelectItem>
                <SelectItem value="reminder">Hatırlatıcı</SelectItem>
                <SelectItem value="deadline">Son Tarih</SelectItem>
                <SelectItem value="holiday">Tatil</SelectItem>
                <SelectItem value="project">Proje</SelectItem>
                <SelectItem value="training">Eğitim</SelectItem>
                <SelectItem value="other">Diğer</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, status: value as any }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="scheduled">Planlandı</SelectItem>
                <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <>
              {view === 'month' && (
                <CalendarMonthView
                  currentDate={currentDate}
                  events={events || []}
                  onEventClick={handleEditEvent}
                  onDateClick={(date) => {
                    setCurrentDate(date)
                    setView('day')
                  }}
                />
              )}
              {view === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={events || []}
                  onEventClick={handleEditEvent}
                />
              )}
              {view === 'day' && (
                <CalendarDayView
                  currentDate={currentDate}
                  events={events || []}
                  onEventClick={handleEditEvent}
                />
              )}
              {view === 'agenda' && (
                <CalendarAgendaView
                  currentDate={currentDate}
                  events={events || []}
                  onEventClick={handleEditEvent}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EventDialog
        open={eventDialogOpen}
        onOpenChange={(open) => {
          setEventDialogOpen(open)
          if (!open) setEditingEvent(null)
        }}
        event={editingEvent}
        onSave={async (eventData) => {
          if (editingEvent) {
            updateMutation.mutate({ id: editingEvent.id, updates: eventData })
          } else {
            createMutation.mutate({
              ...eventData,
              facilityId: selectedFacility?.id,
              createdBy: 'user-001', // Gerçek uygulamada auth'dan gelecek
            })
          }
        }}
        onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : undefined}
      />
    </div>
  )
}

