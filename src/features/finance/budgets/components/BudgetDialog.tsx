import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { budgetService } from '@/services/finance/budgetService'
import { departmentService } from '@/services/departmentService'
import { projectService } from '@/services/projects/projectService'
import { categoryService } from '@/services/finance/categoryService'
import { useQuery } from '@tanstack/react-query'
import { CreateBudgetDTO, UpdateBudgetDTO, Budget } from '@/types/finance'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'
import { useExchangeRate } from '@/hooks/useExchangeRate'

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: Budget
  onSuccess: () => void
}

export function BudgetDialog({ open, onOpenChange, budget, onSuccess }: BudgetDialogProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<Partial<CreateBudgetDTO>>({
    name: '',
    year: new Date().getFullYear(),
    period: 'yearly',
    scope: 'department',
    scopeId: '',
    amount: 0,
    currency: 'TRY',
    startDate: '',
    endDate: '',
  })

  const isEditing = !!budget

  const selectedFacility = useAuthStore(state => state.selectedFacility)

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        year: budget.year,
        period: budget.period,
        scope: budget.scope,
        scopeId: budget.scopeId,
        amount: budget.amount,
        currency: budget.currency,
        startDate: budget.startDate,
        endDate: budget.endDate,
      })
    } else {
      const currentYear = new Date().getFullYear()
      setFormData({
        name: '',
        year: currentYear,
        period: 'yearly',
        scope: 'department',
        scopeId: '',
        amount: 0,
        currency: 'TRY',
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
      })
    }
  }, [budget, open])

  const handlePeriodChange = (period: Budget['period']) => {
    const year = formData.year || new Date().getFullYear()
    let startDate = ''
    let endDate = ''

    if (period === 'yearly') {
      startDate = `${year}-01-01`
      endDate = `${year}-12-31`
    } else if (period === 'quarterly') {
      startDate = `${year}-01-01`
      endDate = `${year}-03-31`
    } else {
      startDate = `${year}-01-01`
      const lastDay = new Date(year, 1, 0).getDate()
      endDate = `${year}-01-${lastDay}`
    }

    setFormData({ ...formData, period, startDate, endDate })
  }

  // Exchange rate hook
  const { data: exchangeRate, isLoading: rateLoading } = useExchangeRate(
    formData.currency || 'TRY',
    'TRY'
  )

  // Calculate TRY amount
  const amountInTry = useMemo(() => {
    if (!formData.amount) return 0
    if (formData.currency === 'TRY') return formData.amount
    return formData.amount * (exchangeRate || 1)
  }, [formData.amount, formData.currency, exchangeRate])

  const handleSubmit = async () => {
    if (!selectedFacility?.id) {
      toast.error(t('Lütfen bir tesis/şube seçin'))
      return
    }

    if (!formData.name || !formData.scopeId || !formData.amount || formData.amount <= 0) {
      toast.error(t('Lütfen tüm zorunlu alanları doldurun'))
      return
    }

    // Döviz seçildiğinde TRY tutarını ana tutar olarak gönder
    const isForeignCurrency = formData.currency !== 'TRY' && exchangeRate && exchangeRate > 1
    const finalAmount = isForeignCurrency ? amountInTry : formData.amount

    try {
      if (isEditing && budget) {
        const dto: UpdateBudgetDTO = {
          id: budget.id,
          ...formData,
          amount: finalAmount,
          currency: 'TRY', // Her zaman TRY olarak kaydet
        }
        await budgetService.updateBudget(dto)
        toast.success(t('Bütçe güncellendi'))
      } else {
        const dto: CreateBudgetDTO = {
          ...formData,
          amount: finalAmount,
          currency: 'TRY', // Her zaman TRY olarak kaydet
          status: 'pending',
          facilityId: selectedFacility.id
        } as CreateBudgetDTO
        await budgetService.createBudget(dto)
        toast.success(t('Bütçe onaya gönderildi'))
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Budget creation error:', error)
      toast.error(t('Bir hata oluştu') + ': ' + (error.message || t('Bilinmeyen hata')))
    }
  }

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', selectedFacility?.id],
    queryFn: () => departmentService.getDepartments({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', selectedFacility?.id],
    queryFn: () => projectService.getProjects(selectedFacility?.id),
    enabled: !!selectedFacility?.id
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', selectedFacility?.id],
    queryFn: () => categoryService.getCategories({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id
  })

  const scopeOptions = formData.scope === 'department'
    ? departments
    : formData.scope === 'project'
      ? projects.filter(p => p.status !== 'completed') // Tamamlanmış projeleri hariç tut
      : categories

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('Bütçe Düzenle') : t('Yeni Bütçe Oluştur')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('Bütçe bilgilerini güncelleyin') : t('Yeni bir bütçe planı oluşturun')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('Bütçe Adı')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("Bütçe adı")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">{t('Yıl')} *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => {
                  const year = parseInt(e.target.value)
                  handlePeriodChange(formData.period || 'yearly')
                  setFormData({ ...formData, year })
                }}
                min={2020}
                max={2030}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">{t('Dönem')} *</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => handlePeriodChange(value as Budget['period'])}
              >
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yearly">{t('Yıllık')}</SelectItem>
                  <SelectItem value="quarterly">{t('Çeyreklik')}</SelectItem>
                  <SelectItem value="monthly">{t('Aylık')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scope">{t('Kapsam')} *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) => setFormData({ ...formData, scope: value as Budget['scope'], scopeId: '' })}
              >
                <SelectTrigger id="scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="department">{t('Departman')}</SelectItem>
                  <SelectItem value="project">{t('Proje')}</SelectItem>
                  <SelectItem value="category">{t('Kategori')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scopeId">{formData.scope === 'department' ? t('Departman') : formData.scope === 'project' ? t('Proje') : t('Kategori')} *</Label>
              <Select
                value={formData.scopeId}
                onValueChange={(value) => setFormData({ ...formData, scopeId: value })}
              >
                <SelectTrigger id="scopeId">
                  <SelectValue placeholder={t("Seçiniz")} />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('Tutar')} *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('Para Birimi')} *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value as any })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TRY Karşılığı - Döviz seçildiğinde göster */}
          {formData.currency !== 'TRY' && formData.amount > 0 && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">{t('Güncel Kur')}</p>
                  <p className="text-lg font-semibold text-blue-800">
                    1 {formData.currency} = {rateLoading ? '...' : exchangeRate?.toFixed(4)} TRY
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">{t('TL Karşılığı')}</p>
                  <p className="text-xl font-bold text-blue-800">
                    {rateLoading ? '...' : new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY'
                    }).format(amountInTry)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2">
                {t('Bütçe TL cinsinden kaydedilecek')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('Başlangıç Tarihi')} *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">{t('Bitiş Tarihi')} *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('İptal')}
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? t('Güncelle') : t('Oluştur')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
