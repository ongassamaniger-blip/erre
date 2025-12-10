import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FloppyDisk } from '@phosphor-icons/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BranchSettings } from '@/types/branchSettings'

// Yaygın ülke kodları
const COUNTRY_CODES = [
  { code: '+90', country: 'TR', label: 'Türkiye (+90)' },
  { code: '+1', country: 'US', label: 'ABD (+1)' },
  { code: '+44', country: 'UK', label: 'Birleşik Krallık (+44)' },
  { code: '+49', country: 'DE', label: 'Almanya (+49)' },
  { code: '+33', country: 'FR', label: 'Fransa (+33)' },
  { code: '+39', country: 'IT', label: 'İtalya (+39)' },
  { code: '+34', country: 'ES', label: 'İspanya (+34)' },
  { code: '+31', country: 'NL', label: 'Hollanda (+31)' },
  { code: '+32', country: 'BE', label: 'Belçika (+32)' },
  { code: '+41', country: 'CH', label: 'İsviçre (+41)' },
  { code: '+43', country: 'AT', label: 'Avusturya (+43)' },
  { code: '+994', country: 'AZ', label: 'Azerbaycan (+994)' },
  { code: '+971', country: 'AE', label: 'BAE (+971)' },
  { code: '+966', country: 'SA', label: 'Suudi Arabistan (+966)' },
  { code: '+974', country: 'QA', label: 'Katar (+974)' },
]

const contactSchema = z.object({
  countryCode: z.string(),
  localPhone: z.string()
    .min(1, 'Telefon numarası zorunludur')
    .regex(/^\d+$/, 'Sadece rakam giriniz'),
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  website: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
  address: z.object({
    street: z.string().min(1, 'Sokak/Cadde zorunludur'),
    city: z.string().min(1, 'Şehir zorunludur'),
    state: z.string().min(1, 'İl zorunludur'),
    zipCode: z.string().min(1, 'Posta kodu zorunludur'),
    country: z.string().min(1, 'Ülke zorunludur'),
  }),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactSettingsTabProps {
  settings: BranchSettings
  onUpdate: (data: Partial<BranchSettings['contact']>) => void
}

export function ContactSettingsTab({ settings, onUpdate }: ContactSettingsTabProps) {
  // Telefon numarasını ayrıştır
  const parsePhone = (fullPhone: string) => {
    if (!fullPhone) return { code: '+90', local: '' }

    // Eşleşen en uzun ülke kodunu bul
    const match = COUNTRY_CODES.find(c => fullPhone.startsWith(c.code))
    if (match) {
      return {
        code: match.code,
        local: fullPhone.slice(match.code.length).trim()
      }
    }
    return { code: '+90', local: fullPhone }
  }

  const initialPhone = parsePhone(settings.contact.phone)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      countryCode: initialPhone.code,
      localPhone: initialPhone.local,
      email: settings.contact.email,
      website: settings.contact.website || '',
      address: settings.contact.address,
    },
  })

  // Watch country code to update select value
  const selectedCountryCode = watch('countryCode')

  const onSubmit = (data: ContactFormData) => {
    // Telefon numarasını birleştir
    const fullPhone = `${data.countryCode}${data.localPhone}`

    onUpdate({
      phone: fullPhone,
      email: data.email,
      website: data.website,
      address: data.address,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">İletişim Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCountryCode}
                  onValueChange={(val) => setValue('countryCode', val, { shouldDirty: true })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Ülke Kodu" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="localPhone"
                  {...register('localPhone')}
                  placeholder="5551234567"
                  className="flex-1"
                />
              </div>
              {errors.localPhone && (
                <p className="text-sm text-destructive">{errors.localPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="info@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="website">Web Sitesi</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://www.example.com"
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Adres Bilgileri</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Sokak/Cadde *</Label>
              <Input
                id="street"
                {...register('address.street')}
                placeholder="Atatürk Caddesi No: 123"
              />
              {errors.address?.street && (
                <p className="text-sm text-destructive">{errors.address.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şehir *</Label>
                <Input
                  id="city"
                  {...register('address.city')}
                  placeholder="İstanbul"
                />
                {errors.address?.city && (
                  <p className="text-sm text-destructive">{errors.address.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">İl *</Label>
                <Input
                  id="state"
                  {...register('address.state')}
                  placeholder="İstanbul"
                />
                {errors.address?.state && (
                  <p className="text-sm text-destructive">{errors.address.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">Posta Kodu *</Label>
                <Input
                  id="zipCode"
                  {...register('address.zipCode')}
                  placeholder="34000"
                />
                {errors.address?.zipCode && (
                  <p className="text-sm text-destructive">{errors.address.zipCode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Ülke *</Label>
              <Input
                id="country"
                {...register('address.country')}
                placeholder="Türkiye"
              />
              {errors.address?.country && (
                <p className="text-sm text-destructive">{errors.address.country.message}</p>
              )}
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

