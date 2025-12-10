import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartBar,
  Users,
  FolderOpen,
  Gift,
  HandHeart,
  SquaresFour,
  Download
} from '@phosphor-icons/react'
import { OverviewTab } from './components/OverviewTab'
import { reportService } from '@/services/reportService'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { DashboardOverview } from './components/DashboardOverview'
import { FinanceSummary } from './components/FinanceSummary'
import { HRSummary } from './components/HRSummary'
import { ProjectsSummary } from './components/ProjectsSummary'
import { QurbanSummary } from './components/QurbanSummary'
import { DonationSummary } from './components/DonationSummary'
import { Skeleton } from '@/components/ui/skeleton'
import { exportService } from '@/services/exportService'
import { toast } from 'sonner'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'
import { addDays, startOfMonth, endOfMonth } from 'date-fns'

export function ReportCenterPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [activeTab, setActiveTab] = useState('overview')

  // Date Range State (Default to this month)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })

  const queryClient = useQueryClient()

  // Real-time updates
  useEffect(() => {
    if (!selectedFacility?.id) return

    const channel = supabase
      .channel('report-center-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `facility_id=eq.${selectedFacility.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
          filter: `facility_id=eq.${selectedFacility.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `facility_id=eq.${selectedFacility.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qurban_donations',
          filter: `facility_id=eq.${selectedFacility.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qurban_campaigns',
          filter: `facility_id=eq.${selectedFacility.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'distribution_records',
          filter: `facility_id=eq.${selectedFacility.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedFacility?.id, queryClient])

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', selectedFacility?.id, dateRange],
    queryFn: () => reportService.getDashboardSummary(selectedFacility?.id!, dateRange as any), // Cast for now if types mismatch
    enabled: !!selectedFacility?.id
  })

  const handleExportExcel = () => {
    if (!summary || !selectedFacility) return
    try {
      // Flatten summary data for export
      const exportData = [
        { category: 'FİNANS', label: 'Toplam Gelir', value: summary.finance.totalIncome, type: 'currency' },
        { category: 'FİNANS', label: 'Toplam Gider', value: summary.finance.totalExpense, type: 'currency' },
        { category: 'FİNANS', label: 'Net Durum', value: summary.finance.netIncome, type: 'currency' },
        { category: 'İK', label: 'Toplam Personel', value: summary.hr.totalEmployees, type: 'number' },
        { category: 'İK', label: 'Aylık Maaş Yükü', value: summary.hr.monthlyPayroll, type: 'currency' },
        { category: 'PROJELER', label: 'Toplam Proje', value: summary.projects.totalProjects, type: 'number' },
        { category: 'PROJELER', label: 'Toplam Bütçe', value: summary.projects.totalBudget, type: 'currency' },
        { category: 'KURBAN', label: 'Toplam Hisse', value: summary.qurban.totalShares, type: 'number' },
        { category: 'KURBAN', label: 'Toplam Bağış', value: summary.qurban.totalDonations, type: 'currency' },
      ]

      exportService.toExcel(
        exportData,
        [
          { header: 'Kategori', key: 'category' },
          { header: 'Başlık', key: 'label' },
          { header: 'Değer', key: 'value', format: 'currency' }, // Using currency format broadly, will be ignored for non-currency numbers in simple implementation or handled if logic refined
        ],
        {
          filename: `Rapor_Merkezi_${new Date().toISOString().split('T')[0]}`,
          title: 'Rapor Merkezi Özeti',
          facilityName: selectedFacility.name,
          userName: useAuthStore.getState().user?.name,
          dateRange: dateRange && dateRange.from && dateRange.to ? { start: dateRange.from, end: dateRange.to } : undefined
        }
      )
      toast.success('Excel raporu oluşturuldu')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Rapor oluşturulurken bir hata oluştu')
    }
  }

  const handleExportPDF = () => {
    if (!summary || !selectedFacility) return
    try {
      const exportData = [
        { category: 'FİNANS', label: 'Toplam Gelir', value: summary.finance.totalIncome },
        { category: 'FİNANS', label: 'Toplam Gider', value: summary.finance.totalExpense },
        { category: 'FİNANS', label: 'Net Durum', value: summary.finance.netIncome },
        { category: 'İK', label: 'Toplam Personel', value: summary.hr.totalEmployees },
        { category: 'İK', label: 'Aylık Maaş Yükü', value: summary.hr.monthlyPayroll },
        { category: 'PROJELER', label: 'Toplam Proje', value: summary.projects.totalProjects },
        { category: 'PROJELER', label: 'Toplam Bütçe', value: summary.projects.totalBudget },
        { category: 'KURBAN', label: 'Toplam Hisse', value: summary.qurban.totalShares },
        { category: 'KURBAN', label: 'Toplam Bağış', value: summary.qurban.totalDonations },
      ]

      exportService.toPDF(
        exportData,
        [
          { header: 'Kategori', key: 'category' },
          { header: 'Başlık', key: 'label' },
          { header: 'Değer', key: 'value', format: 'currency' },
        ],
        {
          filename: `Rapor_Merkezi_${new Date().toISOString().split('T')[0]}`,
          title: 'Rapor Merkezi Özeti',
          facilityName: selectedFacility.name,
          userName: useAuthStore.getState().user?.name,
          dateRange: dateRange && dateRange.from && dateRange.to ? { start: dateRange.from, end: dateRange.to } : undefined
        }
      )
      toast.success('PDF raporu oluşturuldu')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Rapor oluşturulurken bir hata oluştu')
    }
  }

  if (!selectedFacility) {
    return <div>Lütfen bir şube seçiniz.</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapor Merkezi</h1>
          <p className="text-muted-foreground">
            Tesis genelindeki tüm finansal, operasyonel ve idari verilerin özeti.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <DateRangePicker
            date={dateRange}
            setDate={setDateRange}
            className="w-[260px]"
          />
          <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={!summary}>
            <Download size={18} />
            Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportPDF} disabled={!summary}>
            <Download size={18} />
            PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-8">
          <TabsTrigger value="overview" className="gap-2">
            <SquaresFour size={16} />
            <span className="hidden sm:inline">Genel Bakış</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2">
            <ChartBar size={16} />
            <span className="hidden sm:inline">Finans</span>
          </TabsTrigger>
          <TabsTrigger value="hr" className="gap-2">
            <Users size={16} />
            <span className="hidden sm:inline">İK</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderOpen size={16} />
            <span className="hidden sm:inline">Projeler</span>
          </TabsTrigger>
          <TabsTrigger value="qurban" className="gap-2">
            <Gift size={16} />
            <span className="hidden sm:inline">Kurban</span>
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-2">
            <HandHeart size={16} />
            <span className="hidden sm:inline">Bağışlar</span>
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : summary ? (
          <>
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview summary={summary} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinanceSummary summary={summary.finance} />
                <div className="space-y-6">
                  <HRSummary summary={summary.hr} />
                  <ProjectsSummary summary={summary.projects} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="finance">
              <FinanceSummary summary={summary.finance} />
            </TabsContent>

            <TabsContent value="hr">
              <HRSummary summary={summary.hr} />
            </TabsContent>

            <TabsContent value="projects">
              <ProjectsSummary summary={summary.projects} />
            </TabsContent>

            <TabsContent value="qurban">
              <QurbanSummary summary={summary.qurban} />
            </TabsContent>

            <TabsContent value="donations">
              <DonationSummary summary={summary.donations} />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  )
}
