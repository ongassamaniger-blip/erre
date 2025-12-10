import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FloppyDisk } from '@phosphor-icons/react'
import type { BranchSettings } from '@/types/branchSettings'
import { useCountries } from '@/hooks/useCountries'
import { useTranslation } from '@/hooks/useTranslation'
import { toast } from 'sonner'

const regionalSchema = z.object({
  country: z.string().min(1, 'Ülke zorunludur'),
  timezone: z.string().min(1, 'Zaman dilimi zorunludur'),
  dateFormat: z.string().default('DD/MM/YYYY'), // Hidden/Fixed
  timeFormat: z.string().default('24h'), // Hidden/Fixed
  language: z.string().min(1, 'Dil zorunludur'),
  firstDayOfWeek: z.number().default(1), // Hidden/Fixed
})

type RegionalFormData = z.infer<typeof regionalSchema>

interface RegionalSettingsTabProps {
  settings: BranchSettings
  onUpdate: (data: Partial<RegionalFormData>) => void
}

export function RegionalSettingsTab({ settings, onUpdate }: RegionalSettingsTabProps) {
  const { data: countries, isLoading: isCountriesLoading } = useCountries()
  const { language, setLanguage, t } = useTranslation()

  const {
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<RegionalFormData>({
    resolver: zodResolver(regionalSchema),
    defaultValues: {
      country: (settings.regional as any).country || 'TR', // Default to TR
      timezone: settings.regional.timezone,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: settings.regional.language,
      firstDayOfWeek: 1,
    },
  })

  const selectedCountryCode = watch('country')
  const selectedLanguage = watch('language')

  // When country changes, update timezone
  useEffect(() => {
    if (selectedCountryCode && countries) {
      const country = countries.find(c => c.cca2 === selectedCountryCode)
      if (country && country.timezones && country.timezones.length > 0) {
        // Some countries have multiple timezones, we pick the first one or try to find a "main" one
        // For simplicity, we pick the first one, but we could offer a second select if needed.
        // The API returns timezones like "UTC+03:00".
        // We might need to map these to IANA timezones (Europe/Istanbul) if possible, 
        // but restcountries only gives offsets mostly. 
        // However, for the clock display, we can use the offset.
        // Let's store the raw timezone string from the API for now.
        setValue('timezone', country.timezones[0], { shouldDirty: true })
      }
    }
  }, [selectedCountryCode, countries, setValue])

  // Handle language change
  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== language) {
      setLanguage(selectedLanguage as any)
    }
  }, [selectedLanguage, setLanguage, language])

  // Auto-save when values change
  useEffect(() => {
    const subscription = watch((value) => {
      if (value.country && value.timezone && value.language) {
        onUpdate(value as RegionalFormData)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, onUpdate])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('Zaman Dilimi ve Tarih')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">{t('Ülke')} *</Label>
              <Select
                value={watch('country')}
                onValueChange={(value) => setValue('country', value, { shouldDirty: true })}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder={isCountriesLoading ? t("Yükleniyor...") : t("Ülke Seçin")} />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map(country => (
                    <SelectItem key={country.cca2} value={country.cca2}>
                      {country.name.common}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t('Zaman Dilimi')}</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {watch('timezone')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('Ülke seçimine göre otomatik belirlenir.')}
              </p>
            </div>
          </div>

          {/* Hidden fields to maintain schema validity */}
          <input type="hidden" {...{ value: '24h' }} />
          <input type="hidden" {...{ value: 'DD/MM/YYYY' }} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">{t('Dil Ayarları')}</h3>
          <div className="space-y-2">
            <Label htmlFor="language">{t('Sistem Dili')} *</Label>
            <Select
              value={watch('language')}
              onValueChange={(value) => setValue('language', value, { shouldDirty: true })}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('Dil değişimi anlık olarak sağlanır.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



