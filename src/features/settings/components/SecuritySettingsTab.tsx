import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { FloppyDisk } from '@phosphor-icons/react'
import type { BranchSettings } from '@/types/branchSettings'

interface SecuritySettingsTabProps {
  settings: BranchSettings
  onUpdate: (data: Partial<BranchSettings['security']>) => void
}

export function SecuritySettingsTab({ settings, onUpdate }: SecuritySettingsTabProps) {
  const {
    register,
    handleSubmit,
    formState: { isDirty },
    setValue,
    watch,
  } = useForm<BranchSettings['security']>({
    defaultValues: settings.security,
  })

  const onSubmit = (data: BranchSettings['security']) => {
    onUpdate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Şifre Politikası</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minLength">Minimum Şifre Uzunluğu</Label>
              <Input
                id="minLength"
                type="number"
                min="4"
                max="32"
                {...register('passwordPolicy.minLength', { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireUppercase">Büyük Harf Gerekli</Label>
                <p className="text-sm text-muted-foreground">
                  Şifrede en az bir büyük harf bulunmalı
                </p>
              </div>
              <Switch
                id="requireUppercase"
                checked={watch('passwordPolicy.requireUppercase')}
                onCheckedChange={(checked) =>
                  setValue('passwordPolicy.requireUppercase', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireLowercase">Küçük Harf Gerekli</Label>
                <p className="text-sm text-muted-foreground">
                  Şifrede en az bir küçük harf bulunmalı
                </p>
              </div>
              <Switch
                id="requireLowercase"
                checked={watch('passwordPolicy.requireLowercase')}
                onCheckedChange={(checked) =>
                  setValue('passwordPolicy.requireLowercase', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireNumbers">Rakam Gerekli</Label>
                <p className="text-sm text-muted-foreground">
                  Şifrede en az bir rakam bulunmalı
                </p>
              </div>
              <Switch
                id="requireNumbers"
                checked={watch('passwordPolicy.requireNumbers')}
                onCheckedChange={(checked) =>
                  setValue('passwordPolicy.requireNumbers', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireSpecialChars">Özel Karakter Gerekli</Label>
                <p className="text-sm text-muted-foreground">
                  Şifrede en az bir özel karakter bulunmalı (!@#$%^&*)
                </p>
              </div>
              <Switch
                id="requireSpecialChars"
                checked={watch('passwordPolicy.requireSpecialChars')}
                onCheckedChange={(checked) =>
                  setValue('passwordPolicy.requireSpecialChars', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDays">Şifre Geçerlilik Süresi (Gün)</Label>
              <Input
                id="expirationDays"
                type="number"
                min="0"
                {...register('passwordPolicy.expirationDays', { valueAsNumber: true })}
                placeholder="90"
              />
              <p className="text-xs text-muted-foreground">
                0 = süresiz geçerli
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Oturum Ayarları</h3>
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Oturum Zaman Aşımı (Dakika)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              min="5"
              max="480"
              {...register('sessionTimeout', { valueAsNumber: true })}
              placeholder="60"
            />
            <p className="text-xs text-muted-foreground">
              Kullanıcı bu süre boyunca işlem yapmazsa oturum kapanır
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Güvenlik Özellikleri</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorAuth">İki Faktörlü Kimlik Doğrulama</Label>
                <p className="text-sm text-muted-foreground">
                  Ek güvenlik için iki faktörlü kimlik doğrulamayı etkinleştir
                </p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={watch('twoFactorAuth')}
                onCheckedChange={(checked) => setValue('twoFactorAuth', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">IP Beyaz Listesi</Label>
              <Input
                id="ipWhitelist"
                value={watch('ipWhitelist')?.join(', ') || ''}
                onChange={(e) =>
                  setValue(
                    'ipWhitelist',
                    e.target.value.split(',').map(ip => ip.trim()).filter(Boolean)
                  )
                }
                placeholder="192.168.1.1, 10.0.0.1"
              />
              <p className="text-xs text-muted-foreground">
                Sadece bu IP adreslerinden erişime izin ver (virgülle ayırın)
              </p>
            </div>
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

