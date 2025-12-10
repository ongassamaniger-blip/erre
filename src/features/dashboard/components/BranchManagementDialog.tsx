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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { CurrencyDollar, Users, Cow, FolderOpen } from '@phosphor-icons/react'
import type { Facility, ModuleType } from '@/types'
import { facilityService } from '@/services/facilityService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

const facilitySchema = z.object({
  code: z.string().min(1, 'Kod zorunludur'),
  name: z.string().min(1, 'İsim zorunludur'),
  location: z.string().min(1, 'Konum zorunludur'),
  enabledModules: z.array(z.enum(['finance', 'hr', 'qurban', 'projects'])),
})

type FacilityFormData = z.infer<typeof facilitySchema>

interface BranchManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch?: Facility | null
  onSuccess: () => void
}

export function BranchManagementDialog({
  open,
  onOpenChange,
  branch,
  onSuccess,
}: BranchManagementDialogProps) {
  const [enabledModules, setEnabledModules] = useState<ModuleType[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FacilityFormData>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      code: '',
      name: '',
      location: '',
      enabledModules: [],
    },
  })

  useEffect(() => {
    if (branch) {
      reset({
        code: branch.code,
        name: branch.name,
        location: branch.location,
        enabledModules: branch.enabledModules || [],
      })
      setEnabledModules(branch.enabledModules || [])
    } else {
      // Default: HR module selected for new branches
      const defaultModules: ModuleType[] = ['hr']
      reset({
        code: '',
        name: '',
        location: '',
        enabledModules: defaultModules,
      })
      setEnabledModules(defaultModules)
    }
  }, [branch, reset])

  const handleModuleToggle = (module: ModuleType) => {
    const newModules = enabledModules.includes(module)
      ? enabledModules.filter(m => m !== module)
      : [...enabledModules, module]
    setEnabledModules(newModules)
    setValue('enabledModules', newModules)
  }

  const { selectedFacility } = useAuthStore()

  const onSubmit = async (data: FacilityFormData) => {
    try {
      if (branch) {
        await facilityService.updateFacility(branch.id, {
          ...data,
          enabledModules,
        })
        toast.success('Şube başarıyla güncellendi')
      } else {
        await facilityService.createFacility({
          ...data,
          type: 'branch',
          parentFacilityId: selectedFacility?.id, // Use actual HQ ID
          enabledModules,
        })
        toast.success('Şube başarıyla oluşturuldu')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Branch operation error:', error)
      toast.error(error.message || 'İşlem başarısız oldu')
    }
  }

  const moduleOptions: { value: ModuleType; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'finance', label: 'Finans Modülü', icon: CurrencyDollar },
    { value: 'hr', label: 'İnsan Kaynakları Modülü', icon: Users },
    { value: 'qurban', label: 'Kurban Modülü', icon: Cow },
    { value: 'projects', label: 'Projeler Modülü', icon: FolderOpen },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{branch ? 'Şube Düzenle' : 'Yeni Şube Oluştur'}</DialogTitle>
          <DialogDescription>
            {branch ? 'Şube bilgilerini güncelleyin' : 'Yeni bir şube oluşturun ve aktif modülleri seçin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Şube Kodu *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="Örn: IST01"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Şube Adı *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: İstanbul Şubesi"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
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

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Aktif Modüller</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Bu şubede aktif olacak modülleri seçin. Dashboard, Raporlar, Onay Merkezi ve Takvim her zaman aktiftir.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moduleOptions.map(option => {
                const Icon = option.icon
                const isEnabled = enabledModules.includes(option.value)

                return (
                  <div
                    key={option.value}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border transition-colors relative
                      ${isEnabled ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}
                    `}
                  >
                    <Checkbox
                      checked={isEnabled}
                      onCheckedChange={() => handleModuleToggle(option.value)}
                      id={`module-${option.value}`}
                    />
                    <Label
                      htmlFor={`module-${option.value}`}
                      className="flex items-center gap-2 cursor-pointer flex-1 absolute inset-0 pl-12"
                    >
                      <Icon size={20} className={isEnabled ? 'text-primary' : 'text-muted-foreground'} />
                      <span className={isEnabled ? 'font-medium' : ''}>{option.label}</span>
                    </Label>

                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">
                <strong>Not:</strong> Dashboard, Raporlar, Onay Merkezi ve Takvim modülleri tüm şubelerde otomatik olarak aktiftir.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">
              {branch ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

