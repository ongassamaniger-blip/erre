import { useQuery } from '@tanstack/react-query'
import { budgetService } from '@/services/finance/budgetService'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { PencilSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/hooks/useTranslation'

interface BudgetDetailModalProps {
  budgetId: string
  open: boolean
  onClose: () => void
  onEdit?: (budget: any) => void
}

export function BudgetDetailModal({ budgetId, open, onClose, onEdit }: BudgetDetailModalProps) {
  const { t } = useTranslation()
  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => budgetService.getBudgetById(budgetId),
    enabled: !!budgetId && open,
  })

  const { data: spending, isLoading: spendingLoading } = useQuery({
    queryKey: ['budgetSpending', budgetId],
    queryFn: () => budgetService.getBudgetSpending(budgetId),
    enabled: !!budgetId && open,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: budget?.currency || 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 80) return 'text-green-600'
    if (percentage < 95) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (budgetLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <Skeleton className="h-8 w-64" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!budget) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{budget.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{budget.code}</Badge>
                <Badge variant="outline">{budget.periodLabel}</Badge>
              </div>
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit(budget)
                  onClose()
                }}
              >
                <PencilSimple size={16} className="mr-2" />
                {t('Düzenle')}
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Özet')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{t('Kullanım Oranı')}</span>
                    <span
                      className={cn('text-2xl font-bold', getProgressColor(budget.usagePercentage))}
                    >
                      %{budget.usagePercentage.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={budget.usagePercentage} className="h-3" />
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">{t('Toplam Bütçe')}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(budget.amount)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">{t('Harcanan')}</div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(budget.spent)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">{t('Kalan')}</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(budget.remaining)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('Kapsam')}:</span>
                    <span className="ml-2 font-medium">
                      {budget.scope === 'department' && t('Departman')}
                      {budget.scope === 'project' && t('Proje')}
                      {budget.scope === 'category' && t('Kategori')}
                      {' - '}
                      {budget.scopeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('Durum')}:</span>
                    <span className="ml-2">
                      {budget.status === 'active' && (
                        <Badge className="bg-blue-500 hover:bg-blue-600">{t('Aktif')}</Badge>
                      )}
                      {budget.status === 'completed' && (
                        <Badge className="bg-gray-500 hover:bg-gray-600">{t('Tamamlandı')}</Badge>
                      )}
                      {budget.status === 'exceeded' && (
                        <Badge variant="destructive">{t('Aşıldı')}</Badge>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('Başlangıç')}:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(budget.startDate), 'dd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('Bitiş')}:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(budget.endDate), 'dd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {spending && spending.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('Harcama Trendi')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={spending}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          format(new Date(value), 'MMM', { locale: tr })
                        }
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          new Intl.NumberFormat('tr-TR', {
                            notation: 'compact',
                            compactDisplay: 'short',
                          }).format(value)
                        }
                      />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={(label) =>
                          format(new Date(label), 'MMMM yyyy', { locale: tr })
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name={t("Kümülatif Harcama")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t('İlgili İşlemler')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t('Bu bütçeye bağlı işlem kaydı bulunamadı')}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
