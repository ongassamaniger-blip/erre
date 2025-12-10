import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { campaignService } from '@/services/qurban/qurbanService'
import { toast } from 'sonner'
import type { QurbanCampaign } from '@/types'
import { useAuthStore } from '@/store/authStore'

interface CreateCampaignDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateCampaignDialog({ open, onClose, onSuccess }: CreateCampaignDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    status: 'pending_approval' as QurbanCampaign['status'],
    campaignType: 'small_cattle' as QurbanCampaign['campaignType'],
    targetAmount: '',
    targetAnimals: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',

    description: '',
    currency: 'TRY',
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!selectedFacility?.id) {
        throw new Error('Lütfen önce bir tesis/şube seçin')
      }
      return campaignService.createCampaign({
        ...data,
        targetAmount: parseFloat(data.targetAmount) || 0,
        targetAnimals: parseInt(data.targetAnimals) || 0,
        facilityId: selectedFacility.id,
      })
    },
    onSuccess: () => {
      toast.success('Kampanya başarıyla oluşturuldu')
      onSuccess()
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kampanya oluşturulurken bir hata oluştu')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Kampanya adı zorunludur')
      return
    }
    if (!selectedFacility?.id) {
      toast.error('Lütfen önce bir tesis/şube seçin')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Kampanya Oluştur</DialogTitle>
          <DialogDescription>Yeni bir kurban kampanyası oluşturun</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-base font-medium">Kampanya Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Kurban 2025"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Yıl</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignType">Kampanya Tipi</Label>
              <Select
                value={formData.campaignType}
                onValueChange={(value: any) => setFormData({ ...formData, campaignType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small_cattle">Küçükbaş (Koyun/Keçi)</SelectItem>
                  <SelectItem value="large_cattle">Büyükbaş (İnek/Deve)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Hedef Tutar</Label>
              <div className="relative">
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="0"
                  className="h-10 pl-8"
                />
                <span className="absolute left-3 top-2.5 text-muted-foreground">₺</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAnimals">Hedef Hayvan Sayısı</Label>
              <Input
                id="targetAnimals"
                type="number"
                value={formData.targetAnimals}
                onChange={(e) => setFormData({ ...formData, targetAnimals: e.target.value })}
                placeholder="0"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="h-10"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kampanya hakkında detaylı açıklama..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Kampanya Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
