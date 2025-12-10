import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ReportResult, ReportParameter } from '@/types'

export function exportReportToExcel(
  reportResult: ReportResult,
  reportName: string,
  parameters: ReportParameter
): void {
  const workbook = XLSX.utils.book_new()

  // Özet sayfası
  const summaryData = [
    ['Rapor Özeti'],
    [''],
    ['Toplam Gelir', reportResult.summary.totalIncome],
    ['Toplam Gider', reportResult.summary.totalExpense],
    ['Net', reportResult.summary.net],
    [''],
    ['Gelir Değişimi (%)', reportResult.summary.incomeChange || 0],
    ['Gider Değişimi (%)', reportResult.summary.expenseChange || 0],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet')

  // Grafik verileri sayfası
  const chartData = [
    ['Dönem', 'Gelir', 'Gider'],
    ...reportResult.chartData.labels.map((label, index) => [
      label,
      reportResult.chartData.income[index] || 0,
      reportResult.chartData.expense[index] || 0,
    ]),
  ]

  const chartSheet = XLSX.utils.aoa_to_sheet(chartData)
  XLSX.utils.book_append_sheet(workbook, chartSheet, 'Grafik Verileri')

  // Detay tablosu sayfası
  const tableData = [
    ['Kategori', 'Gelir', 'Gider', 'Net', 'Oran (%)', 'Değişim (%)'],
    ...reportResult.tableData.map(row => [
      row.category,
      row.income,
      row.expense,
      row.net,
      row.percentage.toFixed(2),
      row.previousPeriodDiff !== undefined ? row.previousPeriodDiff.toFixed(2) : '-',
    ]),
  ]

  const tableSheet = XLSX.utils.aoa_to_sheet(tableData)
  XLSX.utils.book_append_sheet(workbook, tableSheet, 'Detay Tablosu')

  // Dosya adı
  const fileName = `${reportName}-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export function exportReportToPDF(
  reportResult: ReportResult,
  reportName: string,
  parameters: ReportParameter
): void {
  const doc = new jsPDF('l', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // Başlık
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(reportName, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Tarih aralığı
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dateRange = `${parameters.startDate.toLocaleDateString('tr-TR')} - ${parameters.endDate.toLocaleDateString('tr-TR')}`
  doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Özet bilgileri
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Özet', 14, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const summaryLines = [
    `Toplam Gelir: ${formatCurrency(reportResult.summary.totalIncome)}`,
    `Toplam Gider: ${formatCurrency(reportResult.summary.totalExpense)}`,
    `Net: ${formatCurrency(reportResult.summary.net)}`,
  ]

  summaryLines.forEach(line => {
    doc.text(line, 14, yPos)
    yPos += 6
  })

  yPos += 5

  // Detay tablosu
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Kategori Detayları', 14, yPos)
  yPos += 8

  const tableData = reportResult.tableData.map(row => [
    row.category,
    formatCurrency(row.income),
    formatCurrency(row.expense),
    formatCurrency(row.net),
    `${row.percentage.toFixed(2)}%`,
    row.previousPeriodDiff !== undefined ? `${row.previousPeriodDiff.toFixed(2)}%` : '-',
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Kategori', 'Gelir', 'Gider', 'Net', 'Oran', 'Değişim']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  })

  // Dosya adı
  const fileName = `${reportName}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount)
}



// ... existing code ...

export function exportDashboardSummaryToExcel(
  summary: any, // Using any for now to avoid strict type checks on partial updates
  facilityName: string
): void {
  const workbook = XLSX.utils.book_new()

  // 1. Genel Özet Sayfası
  const overviewData = [
    ['Tesis Genel Raporu', facilityName],
    ['Tarih', new Date().toLocaleDateString('tr-TR')],
    [''],
    ['FİNANS'],
    ['Toplam Gelir', summary.finance.totalIncome],
    ['Toplam Gider', summary.finance.totalExpense],
    ['Net Durum', summary.finance.netIncome],
    ['Bekleyen İşlemler', summary.finance.pendingTransactions],
    [''],
    ['İNSAN KAYNAKLARI'],
    ['Toplam Personel', summary.hr.totalEmployees],
    ['Aktif Personel', summary.hr.activeEmployees],
    ['İzindeki Personel', summary.hr.leaveCount],
    ['Aylık Maaş Yükü', summary.hr.monthlyPayroll],
    [''],
    ['PROJELER'],
    ['Toplam Proje', summary.projects.totalProjects],
    ['Aktif Proje', summary.projects.activeProjects],
    ['Tamamlanan', summary.projects.completedProjects],
    ['Toplam Bütçe', summary.projects.totalBudget],
    ['Harcanan', summary.projects.totalSpent],
    ['Geciken Görevler', summary.projects.overdueTasks],
    [''],
    ['KURBAN & BAĞIŞ'],
    ['Toplam Hisse', summary.qurban.totalShares],
    ['Toplam Bağış Tutarı', summary.qurban.totalDonations],
    ['Bağışçı Sayısı', summary.qurban.totalDonors],
    ['Kesilen Kurban', summary.qurban.slaughteredCount],
    ['Dağıtılan Paket', summary.qurban.distributedCount],
  ]

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData)
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Genel Özet')

  // 2. Finans Detay (Trend)
  if (summary.finance.monthlyTrend && summary.finance.monthlyTrend.length > 0) {
    const financeData = [
      ['Ay', 'Gelir', 'Gider'],
      ...summary.finance.monthlyTrend.map((t: any) => [t.name, t.income, t.expense])
    ]
    const financeSheet = XLSX.utils.aoa_to_sheet(financeData)
    XLSX.utils.book_append_sheet(workbook, financeSheet, 'Finansal Trend')
  }

  // 3. Personel Listesi (Varsa)
  if (summary.hr.employeeDetails && summary.hr.employeeDetails.length > 0) {
    const hrData = [
      ['Ad Soyad', 'Departman', 'Pozisyon', 'Durum'],
      ...summary.hr.employeeDetails.map((e: any) => [e.name, e.department, e.position, e.status])
    ]
    const hrSheet = XLSX.utils.aoa_to_sheet(hrData)
    XLSX.utils.book_append_sheet(workbook, hrSheet, 'Personel Listesi')
  }

  // Dosya adı
  const fileName = `Tesis_Ozet_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
