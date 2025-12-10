import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CalendarBlank,
  Download,
  Printer,
  TrendUp,
  TrendDown,
  CaretDown,
  CaretRight
} from '@phosphor-icons/react'
import { reportService } from '@/services/reportService'
import type { ReportParameter, ReportResult, CategoryReportRow } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { exportReportToExcel, exportReportToPDF } from '@/utils/reportExport'

export function ReportGeneratePage() {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const selectedFacility = useAuthStore(state => state.selectedFacility)

  const reportTypes = reportService.getReportTypes()
  const reportType = reportTypes.find(r => r.id === reportId)

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ReportResult | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const [parameters, setParameters] = useState<ReportParameter>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    filters: {},
    groupBy: 'month',
    visualization: 'both',
    facilityId: selectedFacility?.id,
  })

  // Update facilityId when selectedFacility changes
  useEffect(() => {
    setParameters(prev => ({
      ...prev,
      facilityId: selectedFacility?.id
    }))
  }, [selectedFacility?.id])

  const quickRanges = [
    { label: 'Bu Ay', value: 'this-month' },
    { label: 'Geçen Ay', value: 'last-month' },
    { label: 'Bu Yıl', value: 'this-year' },
    { label: 'Geçen Yıl', value: 'last-year' },
  ]

  const handleQuickRange = (value: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (value) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = now
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = now
        break
      case 'last-year':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        return
    }

    setParameters(prev => ({ ...prev, startDate, endDate }))
  }

  const handleGenerateReport = async () => {
    if (!reportId) return

    setIsLoading(true)
    try {
      const data = await reportService.generateReport(reportId, {
        ...parameters,
        facilityId: selectedFacility?.id,
      })
      setResult(data)
      toast.success('Rapor başarıyla oluşturuldu')
    } catch (error) {
      toast.error('Rapor oluşturulurken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const toggleRow = (category: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedRows(newExpanded)
  }

  const renderCategoryRow = (row: CategoryReportRow, level: number = 0) => {
    const hasChildren = row.children && row.children.length > 0
    const isExpanded = expandedRows.has(row.category)

    return (
      <>
        <tr
          key={row.category}
          className={`hover:bg-accent/50 transition-colors ${level > 0 ? 'bg-muted/30' : ''}`}
        >
          <td className="p-3">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleRow(row.category)}
                  className="hover:bg-accent rounded p-1"
                >
                  {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                </button>
              )}
              <span className={level === 0 ? 'font-medium' : ''}>{row.category}</span>
            </div>
          </td>
          <td className="p-3 text-right text-green-600 font-medium">
            {row.income > 0 ? formatCurrency(row.income) : '-'}
          </td>
          <td className="p-3 text-right text-red-600 font-medium">
            {row.expense > 0 ? formatCurrency(row.expense) : '-'}
          </td>
          <td className={`p-3 text-right font-semibold ${row.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(row.net)}
          </td>
          <td className="p-3 text-right text-muted-foreground">
            {row.percentage.toFixed(1)}%
          </td>
          <td className="p-3 text-right">
            {row.previousPeriodDiff !== undefined && (
              <div className="flex items-center justify-end gap-1">
                {row.previousPeriodDiff >= 0 ? (
                  <>
                    <TrendUp size={14} weight="bold" className="text-green-600" />
                    <span className="text-green-600 text-sm font-medium">
                      +{row.previousPeriodDiff.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendDown size={14} weight="bold" className="text-red-600" />
                    <span className="text-red-600 text-sm font-medium">
                      {row.previousPeriodDiff.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            )}
          </td>
        </tr>
        {hasChildren && isExpanded && row.children!.map(child => renderCategoryRow(child, level + 1))}
      </>
    )
  }

  if (!reportType) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Rapor tipi bulunamadı</p>
            <Button className="mt-4" onClick={() => navigate('/reports/center')}>
              Rapor Merkezine Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports/center')}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight">{reportType.name}</h1>
            <p className="text-muted-foreground mt-1">{reportType.description}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapor Parametreleri</CardTitle>
          <CardDescription>Rapor oluşturmak için parametreleri ayarlayın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Başlangıç Tarihi</Label>
              <Input
                id="start-date"
                type="date"
                value={parameters.startDate.toISOString().split('T')[0]}
                onChange={(e) => setParameters(prev => ({
                  ...prev,
                  startDate: new Date(e.target.value)
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Bitiş Tarihi</Label>
              <Input
                id="end-date"
                type="date"
                value={parameters.endDate.toISOString().split('T')[0]}
                onChange={(e) => setParameters(prev => ({
                  ...prev,
                  endDate: new Date(e.target.value)
                }))}
              />
            </div>



            <div className="space-y-2">
              <Label htmlFor="visualization">Görselleştirme</Label>
              <Select
                value={parameters.visualization}
                onValueChange={(value: any) => setParameters(prev => ({ ...prev, visualization: value }))}
              >
                <SelectTrigger id="visualization">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Sadece Tablo</SelectItem>
                  <SelectItem value="chart">Sadece Grafik</SelectItem>
                  <SelectItem value="both">Her İkisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground self-center">Hızlı Seçim:</span>
            {quickRanges.map(range => (
              <Button
                key={range.value}
                variant="outline"
                size="sm"
                onClick={() => handleQuickRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              className="gap-2"
              onClick={handleGenerateReport}
              disabled={isLoading}
            >
              <CalendarBlank size={18} />
              {isLoading ? 'Oluşturuluyor...' : 'Raporu Oluştur'}
            </Button>
            {result && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    exportReportToExcel(result, reportType?.name || 'Rapor', parameters)
                    toast.success('Rapor Excel olarak indirildi')
                  }}
                >
                  <Download size={18} />
                  Excel İndir
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    exportReportToPDF(result, reportType?.name || 'Rapor', parameters)
                    toast.success('Rapor PDF olarak indirildi')
                  }}
                >
                  <Download size={18} />
                  PDF İndir
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    window.print()
                  }}
                >
                  <Printer size={18} />
                  Yazdır
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Toplam Gelir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(result.summary.totalIncome)}
                </div>
                {result.summary.incomeChange !== undefined && (
                  <div className="flex items-center gap-1 text-sm mt-2">
                    {result.summary.incomeChange >= 0 ? (
                      <>
                        <TrendUp size={14} weight="bold" className="text-green-600" />
                        <span className="text-green-600">+{result.summary.incomeChange}%</span>
                      </>
                    ) : (
                      <>
                        <TrendDown size={14} weight="bold" className="text-red-600" />
                        <span className="text-red-600">{result.summary.incomeChange}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">önceki döneme göre</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Toplam Gider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(result.summary.totalExpense)}
                </div>
                {result.summary.expenseChange !== undefined && (
                  <div className="flex items-center gap-1 text-sm mt-2">
                    {result.summary.expenseChange >= 0 ? (
                      <>
                        <TrendUp size={14} weight="bold" className="text-red-600" />
                        <span className="text-red-600">+{result.summary.expenseChange}%</span>
                      </>
                    ) : (
                      <>
                        <TrendDown size={14} weight="bold" className="text-green-600" />
                        <span className="text-green-600">{result.summary.expenseChange}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">önceki döneme göre</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Net (Gelir - Gider)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${result.summary.net >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(result.summary.net)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {result.summary.net >= 0 ? 'Fazla' : 'Açık'}
                </p>
              </CardContent>
            </Card>
          </div>

          {(parameters.visualization === 'chart' || parameters.visualization === 'both') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gelir/Gider Trendi</CardTitle>
                  <CardDescription>Dönemsel karşılaştırma</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      if (result) {
                        exportReportToExcel(result, reportType?.name || 'Rapor', parameters)
                        toast.success('Grafik verileri Excel olarak indirildi')
                      }
                    }}
                  >
                    <Download size={16} />
                    Excel İndir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      if (result) {
                        exportReportToPDF(result, reportType?.name || 'Rapor', parameters)
                        toast.success('Grafik verileri PDF olarak indirildi')
                      }
                    }}
                  >
                    <Download size={16} />
                    PDF İndir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} />
                    Yazdır
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={result.chartData.labels.map((label, i) => ({
                    name: label,
                    Gelir: result.chartData.income[i],
                    Gider: result.chartData.expense[i]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) =>
                      new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(value)
                    } />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(parameters.visualization === 'table' || parameters.visualization === 'both') && (
            <Card>
              <CardHeader>
                <CardTitle>Kategori Detayı</CardTitle>
                <CardDescription>Gelir ve giderlerin kategori bazlı dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-medium">Kategori</th>
                        <th className="p-3 text-right font-medium">Gelir</th>
                        <th className="p-3 text-right font-medium">Gider</th>
                        <th className="p-3 text-right font-medium">Net</th>
                        <th className="p-3 text-right font-medium">Oran</th>
                        <th className="p-3 text-right font-medium">Değişim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.tableData.map(row => renderCategoryRow(row))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
