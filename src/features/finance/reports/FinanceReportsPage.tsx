import { useNavigate } from 'react-router-dom'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  ChartBar, 
  TrendUp, 
  Target, 
  ChartPie, 
  Users, 
  FolderOpen,
  ArrowRight 
} from '@phosphor-icons/react'
import { reportService } from '@/services/reportService'

export function FinanceReportsPage() {
  const navigate = useNavigate()
  const reportTypes = reportService.getReportTypes().filter(rt => 
    rt.category === 'financial' || rt.category === 'budget' || rt.category === 'category'
  )

  const handleReportClick = (reportId: string) => {
    navigate(`/reports/generate/${reportId}`)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Finans Raporları</h1>
          <p className="text-muted-foreground mt-1">
            Finansal raporlar ve analizler
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const iconMap: Record<string, any> = {
            ChartBar: ChartBar,
            TrendUp: TrendUp,
            Target: Target,
            PieChart: ChartPie,
            Users: Users,
            FolderOpen: FolderOpen,
          }
          const Icon = iconMap[report.icon] || FileText

          return (
            <Card 
              key={report.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleReportClick(report.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={24} weight="duotone" className="text-primary" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowRight size={16} />
                  </Button>
                </div>
                <CardTitle className="mt-4">{report.name}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapor Merkezi</CardTitle>
          <CardDescription>
            Tüm raporlara erişmek için rapor merkezini ziyaret edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/reports/center')} variant="outline">
            <FileText size={18} className="mr-2" />
            Rapor Merkezine Git
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
