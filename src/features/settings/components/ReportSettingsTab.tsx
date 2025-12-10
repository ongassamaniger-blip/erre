import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { FloppyDisk } from '@phosphor-icons/react'
import type { BranchSettings } from '@/types/branchSettings'

interface ReportSettingsTabProps {
  settings: BranchSettings
  onUpdate: (data: Partial<BranchSettings['reports']>) => void
}

export function ReportSettingsTab({ settings, onUpdate }: ReportSettingsTabProps) {
  const {
    register,
    handleSubmit,
    formState: { isDirty },
    setValue,
    watch,
  } = useForm<BranchSettings['reports']>({
    defaultValues: settings.reports,
  })

  const onSubmit = (data: BranchSettings['reports']) => {
    onUpdate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Varsayılan Rapor Ayarları</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultReportFormat">Varsayılan Rapor Formatı</Label>
              <Select
                value={watch('defaultReportFormat')}
                onValueChange={(value) => setValue('defaultReportFormat', value as 'pdf' | 'excel' | 'both')}
              >
                <SelectTrigger id="defaultReportFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="both">Her İkisi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoGenerateReports">Otomatik Rapor Oluşturma</Label>
                <p className="text-sm text-muted-foreground">
                  Zamanlanmış raporları otomatik olarak oluştur
                </p>
              </div>
              <Switch
                id="autoGenerateReports"
                checked={watch('autoGenerateReports')}
                onCheckedChange={(checked) => setValue('autoGenerateReports', checked)}
              />
            </div>
          </div>
        </div>

        {watch('autoGenerateReports') && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Rapor Zamanlama</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Sıklık</Label>
                  <Select
                    value={watch('reportSchedule?.frequency') || 'monthly'}
                    onValueChange={(value) =>
                      setValue('reportSchedule', {
                        ...watch('reportSchedule'),
                        frequency: value as 'daily' | 'weekly' | 'monthly',
                      })
                    }
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Günlük</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="monthly">Aylık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day">Gün</Label>
                  <Input
                    id="day"
                    type="number"
                    min="1"
                    max="31"
                    value={watch('reportSchedule?.day') || ''}
                    onChange={(e) =>
                      setValue('reportSchedule', {
                        ...watch('reportSchedule'),
                        day: Number(e.target.value),
                      })
                    }
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Saat</Label>
                  <Input
                    id="time"
                    type="time"
                    value={watch('reportSchedule?.time') || '09:00'}
                    onChange={(e) =>
                      setValue('reportSchedule', {
                        ...watch('reportSchedule'),
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Rapor Alıcıları</h3>
            <div className="space-y-2">
              <Label htmlFor="reportRecipients">E-posta Adresleri</Label>
              <Input
                id="reportRecipients"
                value={watch('reportRecipients')?.join(', ') || ''}
                onChange={(e) =>
                  setValue(
                    'reportRecipients',
                    e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  )
                }
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Raporlar bu e-posta adreslerine gönderilecektir (virgülle ayırın)
              </p>
            </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty} className="gap-2">
              <FloppyDisk size={16} />
          Değişiklikleri Kaydet
        </Button>
      </div>
    </form>
  )
}

