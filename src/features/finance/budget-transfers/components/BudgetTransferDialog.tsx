import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { BudgetTransfer, Currency } from '@/types/finance'
import { facilityService } from '@/services/facilityService'
import { Facility } from '@/types'
import { toast } from 'sonner'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { ArrowsLeftRight, Spinner } from '@phosphor-icons/react'

const formSchema = z.object({
  toFacilityId: z.string().min(1, 'Şube seçimi zorunludur'),
  amount: z.number().min(1, 'Tutar 0\'dan büyük olmalıdır'),
  currency: z.enum(['TRY', 'USD', 'EUR', 'SAR', 'GBP']),
  description: z.string().optional(),
  exchangeRate: z.number().optional(),
  amountInTry: z.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BudgetTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer?: BudgetTransfer
  onSubmit: (data: FormValues) => void
  isLoading?: boolean
}

export function BudgetTransferDialog({
  open,
  onOpenChange,
  transfer,
  onSubmit,
  isLoading,
}: BudgetTransferDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toFacilityId: '',
      amount: 0,
      currency: 'TRY',
      description: '',
    },
  })

  const [branches, setBranches] = useState<Facility[]>([])

  // Watch currency and amount for exchange rate calculation
  const watchCurrency = form.watch('currency')
  const watchAmount = form.watch('amount')

  // Fetch exchange rate from API (Frankfurter API)
  const { data: exchangeRate, isLoading: isRateLoading } = useExchangeRate(watchCurrency, 'TRY')

  // Calculate TRY equivalent
  const amountInTry = watchAmount && exchangeRate ? watchAmount * exchangeRate : watchAmount

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await facilityService.getBranches()
        setBranches(data)
      } catch (error) {
        console.error('Error fetching branches:', error)
        toast.error('Şubeler yüklenirken hata oluştu')
      }
    }
    fetchBranches()
  }, [])

  useEffect(() => {
    if (transfer) {
      form.reset({
        toFacilityId: transfer.toFacilityId,
        amount: transfer.amount,
        currency: transfer.currency,
        description: transfer.description || '',
      })
    } else {
      form.reset({
        toFacilityId: '',
        amount: 0,
        currency: 'TRY',
        description: '',
      })
    }
  }, [transfer, open, form])

  const handleSubmit = (values: FormValues) => {
    // Include exchange rate and TRY amount
    const rate = watchCurrency === 'TRY' ? 1 : (exchangeRate || 1)
    const tryAmount = watchCurrency === 'TRY' ? values.amount : (values.amount * rate)

    onSubmit({
      ...values,
      exchangeRate: rate,
      amountInTry: tryAmount,
    })
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transfer ? 'Bütçe Aktarımını Düzenle' : 'Yeni Bütçe Aktarımı'}
          </DialogTitle>
          <DialogDescription>
            Genel Merkez'den şubeye bütçe aktarım talebi oluşturun
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toFacilityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hedef Şube</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Şube seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tutar</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para Birimi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* TRY Karşılığı Gösterimi */}
            {watchCurrency !== 'TRY' && watchAmount > 0 && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <ArrowsLeftRight size={16} weight="bold" className="text-primary" />
                  <span>Döviz Kuru (Güncel API)</span>
                </div>
                {isRateLoading ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Spinner className="animate-spin" size={16} />
                    <span>Kur yükleniyor...</span>
                  </div>
                ) : exchangeRate ? (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      1 {watchCurrency} = <span className="font-semibold text-foreground">{exchangeRate.toFixed(4)} TRY</span>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ≈ {amountInTry?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sistemde bu tutar TRY olarak kaydedilecektir
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-destructive">Kur bilgisi alınamadı</div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Bütçe aktarımı açıklaması (opsiyonel)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Bu aktarımın amacı veya açıklaması
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Kaydediliyor...' : transfer ? 'Güncelle' : 'Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

