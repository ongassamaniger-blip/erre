import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, FunnelSimple, X, MicrosoftExcelLogo } from '@phosphor-icons/react'
import { TransactionFilters } from '@/types/finance'
import { transactionService } from '@/services/finance/transactionService'
import { categoryService } from '@/services/finance/categoryService'
import { TransactionTable } from './components/TransactionTable'
import { TransactionFilterPanel } from './components/TransactionFilterPanel'
import { TransactionDrawer } from './components/TransactionDrawer'
import { motion, AnimatePresence } from 'framer-motion'
import { exportTransactionsToExcel } from '@/utils/excelExport'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

export function TransactionsPage() {
  const { t } = useTranslation()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(undefined)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Helper to invalidate dashboard queries
  const invalidateDashboardQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', selectedFacility?.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-chart-data', selectedFacility?.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tx', selectedFacility?.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-payments', selectedFacility?.id] })
  }

  // FacilityId'yi filtreye ekle
  useEffect(() => {
    if (selectedFacility?.id) {
      setFilters(prev => ({ ...prev, facilityId: selectedFacility.id }))
    }
  }, [selectedFacility?.id])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['transactions', filters, page, pageSize],
    queryFn: () => transactionService.getTransactions(filters, { page, pageSize }),
    enabled: !!selectedFacility?.id,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', selectedFacility?.id],
    queryFn: () => categoryService.getCategories({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const handleFilterChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters(selectedFacility?.id ? { facilityId: selectedFacility.id } : {})
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined)

  const handleExportToExcel = async () => {
    try {
      toast.loading(t('Excel dosyası hazırlanıyor...'), { id: 'excel-export' })
      const allTransactions = await transactionService.getAllTransactions(filters)

      if (allTransactions.length === 0) {
        toast.error(t('Dışa aktarılacak işlem bulunamadı'), { id: 'excel-export' })
        return
      }

      const filename = hasActiveFilters
        ? `islemler-filtreli-${new Date().toISOString().split('T')[0]}.xlsx`
        : `islemler-tumu-${new Date().toISOString().split('T')[0]}.xlsx`

      exportTransactionsToExcel(allTransactions, {
        filename,
        sheetName: t('İşlemler'),
      })

      toast.success(`${allTransactions.length} ${t("işlem Excel'e aktarıldı")}`, { id: 'excel-export' })
    } catch (error) {
      toast.error(t('Excel dosyası oluşturulurken hata oluştu'), { id: 'excel-export' })
    }
  }

  // Edit transaction event listener
  useEffect(() => {
    const handleEditTransaction = (event: CustomEvent) => {
      setEditingTransaction(event.detail)
      setDrawerOpen(true)
    }
    window.addEventListener('edit-transaction' as any, handleEditTransaction as EventListener)
    return () => {
      window.removeEventListener('edit-transaction' as any, handleEditTransaction as EventListener)
    }
  }, [])

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('İşlemler')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Tüm finansal işlemleri görüntüleyin ve yönetin')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              disabled={isLoading}
            >
              <MicrosoftExcelLogo size={16} className="mr-2" />
              {t("Excel'e Aktar")}
              {hasActiveFilters && (
                <span className="ml-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  F
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelSimple size={16} className="mr-2" />
              {t('Filtrele')}
              {hasActiveFilters && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {Object.values(filters).filter(v => v !== undefined).length}
                </span>
              )}
            </Button>
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus size={20} className="mr-2" />
              {t('Yeni İşlem')}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{t('Filtreler')}</h3>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      <X size={16} className="mr-2" />
                      {t('Temizle')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
              </div>
              <TransactionFilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories || []}
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <TransactionTable
          data={data?.data || []}
          total={data?.total || 0}
          page={page}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={setPage}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRefresh={refetch}
        />
      </Card>

      <TransactionDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setEditingTransaction(undefined)
        }}
        onSuccess={() => {
          refetch()
          invalidateDashboardQueries()
          setDrawerOpen(false)
          setEditingTransaction(undefined)
        }}
        transaction={editingTransaction}
      />
    </div>
  )
}
