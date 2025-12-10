import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CalendarBlank,
  Clock,
  MapPin,
  Users,
  Bell,
  Trash,
} from '@phosphor-icons/react'
import type { CalendarEvent, CalendarEventType } from '@/types/calendar'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'


const eventSchema = z.object({
  title: z.string().min(1, 'Başlık zorunludur'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Başlangıç tarihi zorunludur'),
  endDate: z.string().min(1, 'Bitiş tarihi zorunludur'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  allDay: z.boolean(),
  type: z.enum(['meeting', 'task', 'reminder', 'deadline', 'holiday', 'project', 'training', 'other']),
  color: z.string().optional(),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  reminderEnabled: z.boolean(),
  reminderMinutes: z.array(z.number()).optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  onSave: (event: Partial<CalendarEvent>) => Promise<void>
  onDelete?: () => void
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      allDay: false,
      type: 'meeting',
      priority: 'medium',
      reminderEnabled: false,
      reminderMinutes: [],
    },
  })

  const allDay = watch('allDay')
  const reminderEnabled = watch('reminderEnabled')

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description || '',
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime || '09:00',
        endTime: event.endTime || '10:00',
        allDay: event.allDay,
        type: event.type,
        color: event.color,
        location: event.location || '',
        priority: event.priority,
        reminderEnabled: event.reminder?.enabled || false,
        reminderMinutes: event.reminder?.minutesBefore || [],
      })
      setReminderMinutes(event.reminder?.minutesBefore || [])
    } else {
      reset({
        title: '',
        description: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        allDay: false,
        type: 'meeting',
        priority: 'medium',
        reminderEnabled: false,
        reminderMinutes: [],
      })
      setReminderMinutes([])
    }
  }, [event, reset])

  const onSubmit = async (data: EventFormData) => {
    await onSave({
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.allDay ? undefined : data.startTime,
      endTime: data.allDay ? undefined : data.endTime,
      allDay: data.allDay,
      type: data.type,
      color: data.color,
      location: data.location,
      priority: data.priority,
      reminder: data.reminderEnabled
        ? {
          enabled: true,
          minutesBefore: reminderMinutes,
          notificationSent: reminderMinutes.map(() => false),
        }
        : undefined,
      status: 'scheduled',
    })
  }

  const handleReminderToggle = (minutes: number) => {
    if (reminderMinutes.includes(minutes)) {
      setReminderMinutes(reminderMinutes.filter(m => m !== minutes))
    } else {
      setReminderMinutes([...reminderMinutes, minutes].sort((a, b) => a - b))
    }
  }

  const reminderOptions = [
    { label: '15 dakika önce', value: 15 },
    { label: '30 dakika önce', value: 30 },
    { label: '1 saat önce', value: 60 },
    { label: '12 saat önce', value: 720 },
    { label: '1 gün önce', value: 1440 },
  ]

  const eventTypeColors: Record<CalendarEventType, string> = {
    meeting: '#3b82f6',
    task: '#8b5cf6',
    reminder: '#f59e0b',
    deadline: '#ef4444',
    holiday: '#f59e0b',
    project: '#6366f1',
    training: '#10b981',
    other: '#6b7280',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}</DialogTitle>
          <DialogDescription>
            {event ? 'Etkinlik bilgilerini güncelleyin' : 'Yeni bir etkinlik oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Etkinlik başlığı"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Etkinlik açıklaması"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="allDay"
              checked={allDay}
              onCheckedChange={(checked) => setValue('allDay', checked)}
            />
            <Label htmlFor="allDay" className="cursor-pointer">
              Tüm Gün
            </Label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Başlangıç Saati</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Bitiş Saati</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tip</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as CalendarEventType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Öncelik</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as any)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Konum</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Etkinlik konumu"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="reminderEnabled"
                checked={reminderEnabled}
                onCheckedChange={(checked) => setValue('reminderEnabled', checked)}
              />
              <Label htmlFor="reminderEnabled" className="cursor-pointer">
                Hatırlatıcı
              </Label>
            </div>

            {reminderEnabled && (
              <div className="space-y-2 pl-6">
                <Label className="text-sm">Hatırlatma Zamanları</Label>
                <div className="space-y-2">
                  {reminderOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`reminder-${option.value}`}
                        checked={reminderMinutes.includes(option.value)}
                        onCheckedChange={() => handleReminderToggle(option.value)}
                      />
                      <Label
                        htmlFor={`reminder-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {event && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="mr-auto"
              >
                <Trash size={16} className="mr-2" />
                Sil
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">
              {event ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

