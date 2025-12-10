import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { scheduleService, campaignService } from '@/services/qurban/qurbanService'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import type { QurbanSchedule } from '@/types'

interface CreateScheduleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  schedule?: QurbanSchedule
}

export function CreateScheduleDialog({
  open,
  onClose,
  onSuccess,
  schedule,
}: CreateScheduleDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const isEditing = !!schedule

  const { data: campaigns = [] } = useQuery({
    queryKey: ['qurban-campaigns-schedule', selectedFacility?.id],
    queryFn: async () => {
      const allCampaigns = await campaignService.getCampaigns({
        facilityId: selectedFacility?.id,
      })
      return allCampaigns.filter(c => c.status === 'active' || c.status === 'completed')
    },
    enabled: open && !!selectedFacility?.id,
  })

  const [formData, setFormData] = useState({
    date: schedule?.date || new Date().toISOString().split('T')[0],
    startTime: schedule?.startTime || '08:00',
    endTime: schedule?.endTime || '17:00',
    location: schedule?.location || '',
    plannedCount: schedule?.plannedCount?.toString() || '0',
    campaignIds: schedule?.campaignIds || [],
    responsible: schedule?.responsible || '',
    notes: schedule?.notes || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      isEditing
        ? scheduleService.updateSchedule(schedule!.id, {
          ...data,
          plannedCount: parseInt(data.plannedCount) || 0,
          facilityId: selectedFacility?.id,
        })
        : scheduleService.createSchedule({
          ...data,
          plannedCount: parseInt(data.plannedCount) || 0,
          facilityId: selectedFacility?.id,
        }),
    onSuccess: () => {
      toast.success(isEditing ? 'Kesim programı güncellendi' : 'Kesim programı oluşturuldu')
      onSuccess()
    },
    onError: () => {
      toast.error('Bir hata oluştu')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.date || !formData.location || !formData.responsible) {
      toast.error('Gerekli alanları doldurun')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Kesim Programını Düzenle' : 'Yeni Kesim Programı'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Kesim programı bilgilerini güncelleyin'
              : 'Yeni kesim programı oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarih *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Lokasyon *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Mezbaha adı"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlangıç Saati *</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Bitiş Saati *</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Planlanan Hayvan Sayısı *</Label>
              <Input
                type="number"
                value={formData.plannedCount}
                onChange={(e) => setFormData({ ...formData, plannedCount: e.target.value })}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Sorumlu *</Label>
              <Input
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                placeholder="Sorumlu kişi adı"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kampanyalar</Label>
            <Select
              value={formData.campaignIds[0] || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, campaignIds: [value] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Kampanya seçin" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.status === 'active' ? 'Aktif' : 'Tamamlandı'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Ek notlar..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? 'Kaydediliyor...'
                : isEditing
                  ? 'Güncelle'
                  : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

