import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { calendarService } from '@/services/calendarService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { useNotifications } from '@/components/common/NotificationProvider'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface UseCalendarRemindersOptions {
  enabled?: boolean
  pollInterval?: number
}

export function useCalendarReminders(options: UseCalendarRemindersOptions = {}) {
  const { enabled = true, pollInterval = 60000 } = options
  const user = useAuthStore(state => state.user)
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const { addNotification } = useNotifications()
  const previousRemindersRef = useRef<Set<string>>(new Set())
  const isPollingRef = useRef(false)

  const { data: events } = useQuery({
    queryKey: ['calendar-events-reminders', selectedFacility?.id],
    queryFn: () => calendarService.getEvents({ 
      facilityId: selectedFacility?.id,
      status: 'scheduled',
    }),
    enabled: enabled && !!user && !!selectedFacility?.id,
    refetchInterval: pollInterval,
  })

  useEffect(() => {
    if (!enabled || !user || !events || !selectedFacility?.id) return

    const checkReminders = () => {
      if (isPollingRef.current) return
      isPollingRef.current = true

      try {
        const now = new Date()
        const currentReminders = new Set<string>()

        events.forEach(event => {
          if (!event.reminder?.enabled || event.status !== 'scheduled') return

          const eventDateTime = event.allDay
            ? new Date(event.startDate + 'T00:00:00')
            : new Date(`${event.startDate}T${event.startTime || '00:00'}:00`)

          event.reminder.minutesBefore.forEach((minutes, index) => {
            const reminderTime = new Date(eventDateTime.getTime() - minutes * 60 * 1000)
            const timeDiff = reminderTime.getTime() - now.getTime()
            const reminderKey = `${event.id}-${index}`

            // Hatırlatıcı zamanı geldi (1 dakika tolerans)
            if (
              timeDiff <= 60000 &&
              timeDiff >= -60000 &&
              !previousRemindersRef.current.has(reminderKey)
            ) {
              currentReminders.add(reminderKey)

              const reminderLabel = minutes < 60
                ? `${minutes} dakika`
                : minutes < 1440
                ? `${Math.floor(minutes / 60)} saat`
                : `${Math.floor(minutes / 1440)} gün`

              const notificationTitle = event.priority === 'urgent'
                ? '🚨 Acil Etkinlik Hatırlatıcısı'
                : '📅 Etkinlik Hatırlatıcısı'

              const notificationMessage = event.allDay
                ? `${event.title} - Bugün (${format(new Date(event.startDate), 'd MMMM', { locale: tr })})`
                : `${event.title} - ${format(eventDateTime, 'd MMMM yyyy, HH:mm', { locale: tr })}`

              addNotification({
                type: 'reminder',
                title: notificationTitle,
                message: notificationMessage,
                read: false,
                link: `/calendar?event=${event.id}`,
                priority: event.priority === 'urgent' ? 'high' : event.priority === 'high' ? 'medium' : 'low',
                metadata: {
                  eventId: event.id,
                  reminderMinutes: minutes,
                  reminderIndex: index,
                },
              })

              toast.info(notificationTitle, {
                description: `${reminderLabel} sonra: ${event.title}`,
                action: {
                  label: 'Görüntüle',
                  onClick: () => {
                    window.location.href = `/calendar?event=${event.id}`
                  },
                },
                duration: 10000,
              })
            }
          })
        })

        previousRemindersRef.current = currentReminders
      } catch (error) {
        console.error('Error checking calendar reminders:', error)
      } finally {
        isPollingRef.current = false
      }
    }

    checkReminders()
    const interval = setInterval(checkReminders, pollInterval)

    return () => clearInterval(interval)
  }, [enabled, user, events, selectedFacility?.id, addNotification, pollInterval])

  return {
    events,
  }
}

