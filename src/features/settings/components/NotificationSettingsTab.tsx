import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { BranchSettings } from '@/types/branchSettings'

interface NotificationSettingsTabProps {
  settings: BranchSettings
  onUpdate: (data: Partial<BranchSettings['notifications']>) => void
}

export function NotificationSettingsTab({ settings, onUpdate }: NotificationSettingsTabProps) {
  const {
    setValue,
    watch,
  } = useForm<BranchSettings['notifications']>({
    defaultValues: settings.notifications,
  })

  // Auto-save when values change
  useEffect(() => {
    const subscription = watch((value) => {
      onUpdate(value as BranchSettings['notifications'])
    })
    return () => subscription.unsubscribe()
  }, [watch, onUpdate])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Bildirim Türleri</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="approvalNotifications">Onay Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Onay talepleri için bildirim al
              </p>
            </div>
            <Switch
              id="approvalNotifications"
              checked={watch('approvalNotifications')}
              onCheckedChange={(checked) => setValue('approvalNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminderNotifications">Hatırlatıcı Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Takvim ve görev hatırlatıcıları için bildirim al
              </p>
            </div>
            <Switch
              id="reminderNotifications"
              checked={watch('reminderNotifications')}
              onCheckedChange={(checked) => setValue('reminderNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reportNotifications">Rapor Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">
                Rapor oluşturma ve zamanlanmış raporlar için bildirim al
              </p>
            </div>
            <Switch
              id="reportNotifications"
              checked={watch('reportNotifications')}
              onCheckedChange={(checked) => setValue('reportNotifications', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

