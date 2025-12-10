import { useQuery } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CurrencyDollar,
  Receipt,
  ChartBar,
  Wallet,
  Users,
  ArrowRight,
  TrendUp,
  TrendDown,
  CheckCircle,
  Clock
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { transactionService } from '@/services/finance/transactionService'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { useAuthStore } from '@/store/authStore'
import { useCurrency } from '@/hooks/useCurrency'

export function FinancePage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const { format: formatCurrency } = useCurrency()

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['finance-statistics', selectedFacility?.id],
    queryFn: () => transactionService.getStatistics({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id
  })

  const modules = [
    {
      title: 'İşlemler',
      description: 'Gelir ve gider işlemlerini yönetin',
      icon: Receipt,
      link: '/finance/transactions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Bütçeler',
      description: 'Bütçe planlaması ve takibi',
      icon: ChartBar,
      link: '/finance/budgets',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },


    {
      title: 'Tedarikçiler & Müşteriler',
      description: 'Tedarikçi ve müşteri bilgileri',
      icon: Users,
      link: '/finance/vendors-customers',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Finans</h1>
          <p className="text-muted-foreground mt-1">
            Finansal işlemler ve raporlar
          </p>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(statistics.totalIncome)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendUp size={24} className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">GM Bütçesi</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(statistics.budgetFromHQ)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <CurrencyDollar size={24} className="text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Toplam Gider</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(statistics.totalExpense)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <TrendDown size={24} className="text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net Tutar</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    statistics.netAmount >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(statistics.netAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CurrencyDollar size={24} className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Onay Bekleyen</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {statistics.pendingCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Clock size={24} className="text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.link} to={module.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl ${module.bgColor} flex items-center justify-center`}>
                      <Icon size={24} weight="duotone" className={module.color} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
