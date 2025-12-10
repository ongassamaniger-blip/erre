import { TransactionFilters, TransactionType, TransactionStatus, Category } from '@/types/finance'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@phosphor-icons/react'
import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'

interface TransactionFilterPanelProps {
  filters: TransactionFilters
  onFilterChange: (filters: TransactionFilters) => void
  categories: Category[]
}

export function TransactionFilterPanel({ filters, onFilterChange, categories }: TransactionFilterPanelProps) {
  const { t } = useTranslation()
  const [dateFrom, setDateFrom] = useState(filters.startDate || '')
  const [dateTo, setDateTo] = useState(filters.endDate || '')
  const [minAmount, setMinAmount] = useState(filters.minAmount?.toString() || '')
  const [maxAmount, setMaxAmount] = useState(filters.maxAmount?.toString() || '')

  const quickDateRanges = [
    { label: t('Bugün'), value: 'today' },
    { label: t('Bu Hafta'), value: 'this_week' },
    { label: t('Bu Ay'), value: 'this_month' },
    { label: t('Bu Yıl'), value: 'this_year' },
  ]

  const handleQuickDate = (value: string) => {
    const today = new Date()
    let from = ''
    let to = today.toISOString().split('T')[0]

    switch (value) {
      case 'today':
        from = to
        break
      case 'this_week': {
        const monday = new Date(today)
        monday.setDate(today.getDate() - today.getDay() + 1)
        from = monday.toISOString().split('T')[0]
        break
      }
      case 'this_month':
        from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
        break
      case 'this_year':
        from = `${today.getFullYear()}-01-01`
        break
    }

    setDateFrom(from)
    setDateTo(to)
    onFilterChange({ ...filters, startDate: from, endDate: to })
  }

  const handleApply = () => {
    onFilterChange({
      ...filters,
      startDate: dateFrom || undefined,
      endDate: dateTo || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label>{t('Tarih Aralığı')}</Label>
        <div className="flex gap-2">
          {quickDateRanges.map((range) => (
            <Button
              key={range.value}
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(range.value)}
              className="text-xs"
            >
              {range.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              if (e.target.value) {
                onFilterChange({ ...filters, startDate: e.target.value })
              }
            }}
            placeholder={t("Başlangıç")}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              if (e.target.value) {
                onFilterChange({ ...filters, endDate: e.target.value })
              }
            }}
            placeholder={t("Bitiş")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('İşlem Tipi')}</Label>
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) =>
            onFilterChange({ ...filters, type: value === 'all' ? undefined : (value as TransactionType) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Tümü")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Tümü')}</SelectItem>
            <SelectItem value="income">{t('Gelir')}</SelectItem>
            <SelectItem value="expense">{t('Gider')}</SelectItem>
            <SelectItem value="transfer">{t('Virman')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('Kategori')}</Label>
        <Select
          value={filters.categoryId || 'all'}
          onValueChange={(value) =>
            onFilterChange({ ...filters, categoryId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Tümü")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Tümü')}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('Durum')}</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFilterChange({ ...filters, status: value === 'all' ? undefined : (value as TransactionStatus) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("Tümü")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Tümü')}</SelectItem>
            <SelectItem value="draft">{t('Taslak')}</SelectItem>
            <SelectItem value="pending">{t('Beklemede')}</SelectItem>
            <SelectItem value="approved">{t('Onaylandı')}</SelectItem>
            <SelectItem value="rejected">{t('Reddedildi')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('Tutar Aralığı')} (TRY)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            onBlur={handleApply}
            placeholder="Min"
          />
          <Input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            onBlur={handleApply}
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  )
}
