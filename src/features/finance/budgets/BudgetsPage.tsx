import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BudgetFilters, Budget } from '@/types/finance'
import { budgetService } from '@/services/finance/budgetService'
import { transactionService } from '@/services/finance/transactionService'
import { BudgetCard } from './components/BudgetCard'
import { BudgetDetailModal } from './components/BudgetDetailModal'
import { BudgetDialog } from './components/BudgetDialog'
import { GridSkeleton } from '@/components/common/skeletons'
import { FunnelSimple, Plus } from '@phosphor-icons/react'
import { departmentService } from '@/services/departmentService'
import { useTranslation } from '@/hooks/useTranslation'

export function BudgetsPage() {
  const { t } = useTranslation()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [filters, setFilters] = useState<BudgetFilters>({})
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const queryClient = useQueryClient()

  // FacilityId'yi filtreye ekle
  useEffect(() => {
    if (selectedFacility?.id) {
      setFilters(prev => ({ ...prev, facilityId: selectedFacility.id }))
    }
  }, [selectedFacility?.id])

  const { data, isLoading } = useQuery({
    queryKey: ['budgets', filters, page, pageSize],
    queryFn: () => budgetService.getBudgets({
      ...filters,
      statuses: filters.status ? undefined : ['active', 'completed', 'exceeded']
    }, { page, pageSize }),
    enabled: !!selectedFacility?.id,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', selectedFacility?.id],
    queryFn: () => departmentService.getDepartments({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const { data: stats } = useQuery({
    queryKey: ['finance-stats', selectedFacility?.id],
    queryFn: () => transactionService.getStatistics({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const handleFilterChange = (key: keyof BudgetFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }))
    setPage(1)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('Bütçeler')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Bütçe planlamalarını görüntüleyin ve takip edin')}
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingBudget(null)
              setDialogOpen(true)
            }}
          >
            <Plus size={20} className="mr-2" />
            {t('Yeni Bütçe')}
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('GM Bütçesi')}</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                      minimumFractionDigits: 0,
                    }).format(stats?.budgetFromHQ || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('Genel Merkezden Aktarılan')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('Harcanan')}</p>
                  <p className="text-2xl font-bold text-red-600">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                      minimumFractionDigits: 0,
                    }).format(
                      data?.data?.reduce((sum, b) => sum + b.amount, 0) || 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('Proje/Departman Bütçeleri')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('Kalan')}</p>
                  <p className={`text-2xl font-bold ${((stats?.budgetFromHQ || 0) - (data?.data?.reduce((sum, b) => sum + b.amount, 0) || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                      minimumFractionDigits: 0,
                    }).format(
                      (stats?.budgetFromHQ || 0) - (data?.data?.reduce((sum, b) => sum + b.amount, 0) || 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('GM Bütçesi - Harcanan')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelSimple size={20} />
            <h3 className="font-semibold">{t('Filtreler')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('Yıl')}</Label>
              <Select
                value={filters.year?.toString() || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('year', value === 'all' ? undefined : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Tümü")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Tümü')}</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('Dönem')}</Label>
              <Select
                value={filters.period || 'all'}
                onValueChange={(value) => handleFilterChange('period', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Tümü")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Tümü')}</SelectItem>
                  <SelectItem value="yearly">{t('Yıllık')}</SelectItem>
                  <SelectItem value="quarterly">{t('Çeyreklik')}</SelectItem>
                  <SelectItem value="monthly">{t('Aylık')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('Departman')}</Label>
              <Select
                value={filters.departmentId || 'all'}
                onValueChange={(value) => handleFilterChange('departmentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Tümü")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Tümü')}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('Durum')}</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Tümü")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Tümü')}</SelectItem>
                  <SelectItem value="active">{t('Aktif')}</SelectItem>
                  <SelectItem value="completed">{t('Tamamlandı')}</SelectItem>
                  <SelectItem value="exceeded">{t('Aşıldı')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <GridSkeleton count={pageSize} columns={3} />
      ) : data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onViewDetail={() => setSelectedBudgetId(budget.id)}
              onEdit={() => {
                setEditingBudget(budget)
                setDialogOpen(true)
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('Bütçe bulunamadı')}
          </CardContent>
        </Card>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            {t('Önceki')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('Sayfa')} {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.totalPages}
          >
            {t('Sonraki')}
          </Button>
        </div>
      )}

      {selectedBudgetId && (
        <BudgetDetailModal
          budgetId={selectedBudgetId}
          open={!!selectedBudgetId}
          onClose={() => setSelectedBudgetId(null)}
          onEdit={(budget) => {
            setEditingBudget(budget)
            setSelectedBudgetId(null)
            setDialogOpen(true)
          }}
        />
      )}

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingBudget(null)
          }
        }}
        budget={editingBudget || undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['budgets'] })
          queryClient.invalidateQueries({ queryKey: ['budget'] })
          queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
          setEditingBudget(null)
        }}
      />
    </div>
  )
}
