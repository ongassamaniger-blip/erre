import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useDashboardStore, WidgetId } from '@/store/dashboardStore'
import { transactionService } from '@/services/finance/transactionService'
import { employeeService } from '@/services/employeeService'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DashboardWidget } from './components/DashboardWidgets'
import { DashboardCustomizer } from './components/DashboardCustomizer'
import { CurrencyTicker } from './components/CurrencyTicker'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from '@/hooks/useTranslation'
import { subMonths, format } from 'date-fns'
import { tr } from 'date-fns/locale'

// Sortable Wrapper Component - Optimized for performance
function SortableWidget({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || undefined,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'shadow-lg scale-[1.02] cursor-grabbing' : 'cursor-grab hover:shadow-md'} rounded-xl transition-shadow`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { widgets, reorderWidgets } = useDashboardStore()

  // Redirect HQ users to HQ dashboard
  useEffect(() => {
    if (selectedFacility?.type === 'headquarters') {
      navigate('/headquarters/dashboard', { replace: true })
    }
  }, [selectedFacility, navigate])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const visibleWidgets = useMemo(() =>
    (widgets || []).filter(w => w.isVisible).sort((a, b) => a.order - b.order),
    [widgets]
  )

  const getWidgetSpan = (id: string) => {
    if (id.startsWith('chart-')) {
      return 'col-span-2 lg:col-span-2'
    }
    if (id.startsWith('list-')) {
      return 'col-span-2 lg:col-span-2'
    }
    return 'col-span-1'
  }

  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', selectedFacility?.id],
    queryFn: () => transactionService.getStatistics({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id
  })

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['dashboard-employees', selectedFacility?.id],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id, status: 'active' }),
    enabled: !!selectedFacility?.id
  })

  const { data: recentTransactions, isLoading: recentTxLoading } = useQuery({
    queryKey: ['dashboard-recent-tx', selectedFacility?.id],
    queryFn: () => transactionService.getTransactions({ facilityId: selectedFacility?.id }, { page: 1, pageSize: 5 }),
    enabled: !!selectedFacility?.id
  })

  const { data: upcomingPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard-payments', selectedFacility?.id],
    queryFn: () => transactionService.getUpcomingPayments(selectedFacility?.id),
    enabled: !!selectedFacility?.id
  })

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart-data', selectedFacility?.id],
    queryFn: async () => {
      const endDate = new Date()
      const startDate = subMonths(endDate, 11) // Last 12 months
      const txs = await transactionService.getAllTransactions({
        facilityId: selectedFacility?.id,
        startDate: startDate.toISOString()
      })
      return txs
    },
    enabled: !!selectedFacility?.id
  })

  // Process Chart Data
  const trendData = useMemo(() => {
    if (!chartData) return []
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), i)
      return {
        date: format(d, 'yyyy-MM'),
        name: format(d, 'MMMM', { locale: tr }),
        revenue: 0,
        expense: 0
      }
    }).reverse()

    chartData.forEach(tx => {
      // Only include approved transactions, exclude budget transfers from HQ
      if (tx.status !== 'approved') return
      if (tx.description?.includes('Bütçe Aktarımı') || tx.description?.includes('Genel Merkez Bütçe Aktarımı')) return

      const txMonth = format(new Date(tx.date), 'yyyy-MM')
      const monthData = months.find(m => m.date === txMonth)
      if (monthData) {
        if (tx.type === 'income') monthData.revenue += tx.amount
        if (tx.type === 'expense') monthData.expense += tx.amount
      }
    })

    return months
  }, [chartData])

  const categoryData = useMemo(() => {
    if (!chartData) return []

    // Include ALL approved expense transactions (not just current month)
    const expenseTxs = chartData.filter(tx =>
      tx.type === 'expense' &&
      tx.status === 'approved'
    )

    const categories: Record<string, number> = {}
    expenseTxs.forEach(tx => {
      const catName = tx.categories?.name || tx.categoryName || t('Diğer')
      categories[catName] = (categories[catName] || 0) + tx.amount
    })

    // Sort by amount descending and return top categories
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))
  }, [chartData, t])

  const widgetDataMap: Record<string, any> = {
    'stats-income': { totalIncome: stats?.totalIncome, incomeTrend: stats?.incomeTrend },
    'stats-budget-hq': { budgetFromHQ: stats?.budgetFromHQ },
    'stats-expense': { totalExpense: stats?.totalExpense, expenseTrend: stats?.expenseTrend },
    'stats-pending': { pendingCount: stats?.pendingCount },
    'stats-active-employees': employees?.length || 0,
    'chart-trend': { chartData: trendData, totalIncome: stats?.totalIncome || 0, totalExpense: stats?.totalExpense || 0 },
    'chart-category': categoryData,
    'list-transactions': recentTransactions?.data || [],
    'list-payments': upcomingPayments || []
  }

  const isLoading = statsLoading || employeesLoading || recentTxLoading || paymentsLoading || chartLoading

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id)
      const newIndex = widgets.findIndex((w) => w.id === over?.id)
      reorderWidgets(arrayMove(widgets, oldIndex, newIndex))
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 bg-slate-50/50 min-h-screen">
      <CurrencyTicker />
      <div className="flex flex-col gap-2">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('Panel')}</h1>
            <p className="text-sm text-slate-500">
              {selectedFacility?.name}
            </p>
          </div>
          <DashboardCustomizer />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleWidgets.map(w => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {visibleWidgets.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  id={widget.id}
                  className={getWidgetSpan(widget.id)}
                >
                  <DashboardWidget id={widget.id} data={widgetDataMap[widget.id]} />
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
