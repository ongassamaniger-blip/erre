import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Building, Image, FloppyDisk } from '@phosphor-icons/react'
import type { BranchSettings } from '@/types/branchSettings'
import { LogoUploadDialog } from './LogoUploadDialog'

const generalSchema = z.object({
  name: z.string().min(1, 'İsim zorunludur'),
  code: z.string().min(1, 'Kod zorunludur'),
  location: z.string().min(1, 'Konum zorunludur'),
  description: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
})

type GeneralFormData = z.infer<typeof generalSchema>

interface GeneralSettingsTabProps {
  settings: BranchSettings
  onUpdate: (data: Partial<GeneralFormData>) => void
}

export function GeneralSettingsTab({ settings, onUpdate }: GeneralSettingsTabProps) {
  const [logoDialogOpen, setLogoDialogOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState(settings.general.logo)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: settings.general.name,
      code: settings.general.code,
      location: settings.general.location,
      description: settings.general.description || '',
      taxId: settings.general.taxId || '',
      registrationNumber: settings.general.registrationNumber || '',
    },
  })

  const handleLogoUpload = (url: string) => {
    setLogoUrl(url)
    onUpdate({ logo: url })
  }

  const onSubmit = (data: GeneralFormData) => {
    onUpdate({ ...data, logo: logoUrl })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Temel Bilgiler</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Şube Adı *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: İstanbul Şubesi"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Şube adı değiştirilemez
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Şube Kodu *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="Örn: IST01"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Şube kodu değiştirilemez
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="location">Konum *</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Örn: İstanbul, Türkiye"
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Şube hakkında açıklama"
              rows={3}
            />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Yasal Bilgiler</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">Vergi Numarası</Label>
              <Input
                id="taxId"
                {...register('taxId')}
                placeholder="Vergi numarası"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Ticaret Sicil No</Label>
              <Input
                id="registrationNumber"
                {...register('registrationNumber')}
                placeholder="Ticaret sicil numarası"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Logo</h3>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="w-24 h-24 rounded-lg border flex items-center justify-center overflow-hidden">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg border flex items-center justify-center bg-muted">
                <Building size={32} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setLogoDialogOpen(true)}
              >
                <Image size={16} />
                Logo Yükle
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG veya SVG formatında logo yükleyebilirsiniz (Max: 2MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty && !logoUrl} className="gap-2">
          <FloppyDisk size={16} />
          Değişiklikleri Kaydet
        </Button>
      </div>

      <LogoUploadDialog
        open={logoDialogOpen}
        onOpenChange={setLogoDialogOpen}
        currentLogo={logoUrl}
        onUpload={handleLogoUpload}
      />
    </form>
  )
}

