import { Budget } from '@/types/finance'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Eye, PencilSimple } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

interface BudgetCardProps {
  budget: Budget
  onViewDetail: () => void
  onEdit?: () => void
}

export function BudgetCard({ budget, onViewDetail, onEdit }: BudgetCardProps) {
  const { t } = useTranslation()
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: budget.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getProgressColor = () => {
    if (budget.usagePercentage < 80) return 'bg-green-500'
    if (budget.usagePercentage < 95) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusBadge = () => {
    switch (budget.status) {
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{t('Aktif')}</Badge>
      case 'completed':
        return <Badge className="bg-gray-500 hover:bg-gray-600">{t('Tamamlandı')}</Badge>
      case 'exceeded':
        return <Badge variant="destructive">{t('Aşıldı')}</Badge>
    }
  }

  const getScopeLabel = () => {
    switch (budget.scope) {
      case 'department':
        return t('Departman')
      case 'project':
        return t('Proje')
      case 'category':
        return t('Kategori')
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-2">{budget.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{budget.periodLabel}</p>
            </div>
            {getStatusBadge()}
          </div>
          <Badge variant="outline" className="w-fit mt-2">
            {getScopeLabel()}: {budget.scopeName}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('Kullanım')}</span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  budget.usagePercentage < 80 && 'text-green-600',
                  budget.usagePercentage >= 80 && budget.usagePercentage < 95 && 'text-yellow-600',
                  budget.usagePercentage >= 95 && 'text-red-600'
                )}
              >
                %{budget.usagePercentage.toFixed(1)}
              </span>
            </div>
            <Progress value={budget.usagePercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('Bütçe')}</div>
              <div className="text-sm font-semibold">{formatCurrency(budget.amount)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('Harcanan')}</div>
              <div className="text-sm font-semibold text-red-600">
                {formatCurrency(budget.spent)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('Kalan')}</div>
              <div className="text-sm font-semibold text-green-600">
                {formatCurrency(budget.remaining)}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onViewDetail}>
              <Eye size={16} className="mr-2" />
              {t('Detay')}
            </Button>
            {onEdit && (
              <Button variant="outline" size="icon" onClick={onEdit} title={t("Düzenle")}>
                <PencilSimple size={16} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
