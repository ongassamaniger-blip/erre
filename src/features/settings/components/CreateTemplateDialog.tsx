import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { PrintTemplateCode } from '@/types/printTemplates'

const templateSchema = z.object({
  code: z.string().min(1, 'Kod zorunludur'),
  nameTr: z.string().min(1, 'Türkçe isim zorunludur'),
  nameEn: z.string().optional(),
  pageOrientation: z.enum(['portrait', 'landscape']),
  showLogo: z.boolean(),
  logoPosition: z.enum(['left', 'center', 'right']),
  showPageNumber: z.boolean(),
})

type TemplateFormData = z.infer<typeof templateSchema>

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (template: any) => void
  facilityId: string
}

const availableCodes: { value: string; label: string; category: string }[] = [
  { value: 'finance.invoice', label: 'Fatura', category: 'Finans' },
  { value: 'finance.receipt', label: 'Makbuz', category: 'Finans' },
  { value: 'finance.expense', label: 'Gider Belgesi', category: 'Finans' },
  { value: 'hr.contract', label: 'İş Sözleşmesi', category: 'İnsan Kaynakları' },
  { value: 'hr.certificate', label: 'Sertifika', category: 'İnsan Kaynakları' },
  { value: 'qurban.receipt', label: 'Kurban Makbuzu', category: 'Kurban' },
  { value: 'projects.report', label: 'Proje Raporu', category: 'Projeler' },
  { value: 'general.document', label: 'Genel Belge', category: 'Genel' },
]

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
  facilityId,
}: CreateTemplateDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      code: '',
      nameTr: '',
      nameEn: '',
      pageOrientation: 'portrait',
      showLogo: true,
      logoPosition: 'left',
      showPageNumber: true,
    },
  })

  const onSubmit = (data: TemplateFormData) => {
    // Yeni template oluştur
    const newTemplate = {
      id: `template-${Date.now()}`,
      code: data.code as PrintTemplateCode,
      name: {
        tr: data.nameTr,
        en: data.nameEn || data.nameTr,
        fr: data.nameTr,
        ar: data.nameTr,
      },
      tenantScope: 'TENANT' as const,
      tenantId: facilityId,
      headerFields: [],
      bodyFields: [],
      footerFields: [],
      signatureFields: [],
      pageOrientation: data.pageOrientation,
      showLogo: data.showLogo,
      logoPosition: data.logoPosition,
      showPageNumber: data.showPageNumber,
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user',
    }

    onSuccess(newTemplate)
    reset()
    onOpenChange(false)
    toast.success('Yeni şablon oluşturuldu')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yeni Şablon Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir yazdırma şablonu oluşturun ve özelleştirin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Şablon Kodu *</Label>
            <Select
              value={watch('code')}
              onValueChange={(value) => {
                setValue('code', value)
                const selected = availableCodes.find(c => c.value === value)
                if (selected) {
                  setValue('nameTr', selected.label)
                }
              }}
            >
              <SelectTrigger id="code">
                <SelectValue placeholder="Şablon kodu seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  availableCodes.reduce((acc, code) => {
                    if (!acc[code.category]) acc[code.category] = []
                    acc[code.category].push(code)
                    return acc
                  }, {} as Record<string, typeof availableCodes>)
                ).map(([category, codes]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {codes.map(code => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label} ({code.value})
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameTr">Türkçe İsim *</Label>
              <Input id="nameTr" {...register('nameTr')} placeholder="Şablon adı" />
              {errors.nameTr && (
                <p className="text-sm text-destructive">{errors.nameTr.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameEn">İngilizce İsim</Label>
              <Input id="nameEn" {...register('nameEn')} placeholder="Template name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sayfa Yönlendirmesi</Label>
            <RadioGroup
              value={watch('pageOrientation')}
              onValueChange={(value) => setValue('pageOrientation', value as any)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait">Dikey</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape">Yatay</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Logo Ayarları</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor="showLogo">Logo göster</Label>
              <Switch
                id="showLogo"
                checked={watch('showLogo')}
                onCheckedChange={(checked) => setValue('showLogo', checked)}
              />
            </div>
            {watch('showLogo') && (
              <Select
                value={watch('logoPosition')}
                onValueChange={(value) => setValue('logoPosition', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Sol</SelectItem>
                  <SelectItem value="center">Orta</SelectItem>
                  <SelectItem value="right">Sağ</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showPageNumber">Sayfa numarası göster</Label>
            <Switch
              id="showPageNumber"
              checked={watch('showPageNumber')}
              onCheckedChange={(checked) => setValue('showPageNumber', checked)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" className="gap-2">
              <Plus size={16} />
              Oluştur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

