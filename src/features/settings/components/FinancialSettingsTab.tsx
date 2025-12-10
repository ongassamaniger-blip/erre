import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FloppyDisk, CurrencyDollar } from '@phosphor-icons/react'
import type { BranchSettings } from '@/types/branchSettings'
import { CurrencyManagementDialog } from './CurrencyManagementDialog'

const financialSchema = z.object({
  defaultCurrency: z.string().min(1, 'Para birimi zorunludur'),
  fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/, 'Format: MM-DD'),
  fiscalYearEnd: z.string().regex(/^\d{2}-\d{2}$/, 'Format: MM-DD'),
  taxRate: z.number().min(0).max(100).optional(),
  invoicePrefix: z.string().optional(),
  invoiceNumberFormat: z.string().optional(),
})

type FinancialFormData = z.infer<typeof financialSchema>

interface FinancialSettingsTabProps {
  settings: BranchSettings
  onUpdate: (data: Partial<FinancialFormData>) => void
}

interface Currency {
  code: string
  name: string
  symbol: string
  isDefault: boolean
}

export function FinancialSettingsTab({ settings, onUpdate }: FinancialSettingsTabProps) {
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    // Mevcut para birimlerini yükle veya varsayılanları oluştur
    const defaultCurrencies: Currency[] = [
      { code: 'TRY', name: 'Türk Lirası', symbol: '₺', isDefault: true },
      { code: 'USD', name: 'Amerikan Doları', symbol: '$', isDefault: false },
      { code: 'EUR', name: 'Euro', symbol: '€', isDefault: false },
      { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£', isDefault: false },
    ]
    // Eğer settings'te currencies varsa onu kullan
    return (settings.financial as any).currencies || defaultCurrencies
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      defaultCurrency: settings.financial.defaultCurrency,
      fiscalYearStart: settings.financial.fiscalYearStart,
      fiscalYearEnd: settings.financial.fiscalYearEnd,
      taxRate: settings.financial.taxRate,
      invoicePrefix: settings.financial.invoicePrefix || '',
      invoiceNumberFormat: settings.financial.invoiceNumberFormat || '',
    },
  })

  useEffect(() => {
    const defaultCurrency = currencies.find(c => c.isDefault)
    if (defaultCurrency) {
      setValue('defaultCurrency', defaultCurrency.code)
    }
  }, [currencies, setValue])

  const handleCurrencyUpdate = (updatedCurrencies: Currency[]) => {
    setCurrencies(updatedCurrencies)
    const defaultCurrency = updatedCurrencies.find(c => c.isDefault)
    if (defaultCurrency) {
      setValue('defaultCurrency', defaultCurrency.code, { shouldDirty: true })
      onUpdate({
        defaultCurrency: defaultCurrency.code,
        currencies: updatedCurrencies as any,
      } as any)
    }
  }

  const onSubmit = (data: FinancialFormData) => {
    onUpdate({ ...data, currencies: currencies as any } as any)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Para Birimi Ayarları</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrencyDialogOpen(true)}
              className="gap-2"
            >
              <CurrencyDollar size={16} />
              Para Birimlerini Yönet
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Varsayılan Para Birimi *</Label>
            <Select
              value={watch('defaultCurrency')}
              onValueChange={(value) => setValue('defaultCurrency', value, { shouldDirty: true })}
            >
              <SelectTrigger id="defaultCurrency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.defaultCurrency && (
              <p className="text-sm text-destructive">{errors.defaultCurrency.message}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Mali Yıl Ayarları</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fiscalYearStart">Mali Yıl Başlangıcı *</Label>
              <Input
                id="fiscalYearStart"
                {...register('fiscalYearStart')}
                placeholder="01-01"
                pattern="\d{2}-\d{2}"
              />
              {errors.fiscalYearStart && (
                <p className="text-sm text-destructive">{errors.fiscalYearStart.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Format: MM-DD (Örn: 01-01)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalYearEnd">Mali Yıl Bitişi *</Label>
              <Input
                id="fiscalYearEnd"
                {...register('fiscalYearEnd')}
                placeholder="12-31"
                pattern="\d{2}-\d{2}"
              />
              {errors.fiscalYearEnd && (
                <p className="text-sm text-destructive">{errors.fiscalYearEnd.message}</p>
              )}
              <p className="text-xs text-muted-foreground">Format: MM-DD (Örn: 12-31)</p>
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

      <CurrencyManagementDialog
        open={currencyDialogOpen}
        onOpenChange={setCurrencyDialogOpen}
        currencies={currencies}
        onUpdate={handleCurrencyUpdate}
      />
    </form>
  )
}

