import type {
  ReportType,
  ReportParameter,
  ReportResult,
  CategoryReportRow,
  DashboardSummary
} from '@/types'
import { transactionService } from '@/services/finance/transactionService'
import { budgetService } from '@/services/finance/budgetService'
import { projectService } from '@/services/projects/projectService'
import { categoryService } from '@/services/finance/categoryService'
import { employeeService } from '@/services/hr/employeeService'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export const reportService = {
  getReportTypes(): ReportType[] {
    return [
      {
        id: 'income-expense',
        name: 'Gelir-Gider Raporu',
        description: 'Dönemsel gelir ve gider karşılaştırması, kategori bazlı detaylı analiz',
        category: 'financial',
        icon: 'ChartBar'
      },
      {
        id: 'cash-flow',
        name: 'Nakit Akış Raporu',
        description: 'Nakit giriş-çıkış analizi ve tahminleme',
        category: 'financial',
        icon: 'TrendUp'
      },
      {
        id: 'budget-realization',
        name: 'Bütçe Gerçekleşme Raporu',
        description: 'Planlanan bütçe ile gerçekleşen harcamaların karşılaştırması',
        category: 'budget',
        icon: 'Target'
      },
      {
        id: 'category-analysis',
        name: 'Kategori Bazlı Analiz',
        description: 'Harcamaların kategorilere göre detaylı dağılımı',
        category: 'category',
        icon: 'PieChart'
      },
      {
        id: 'vendor-analysis',
        name: 'Tedarikçi Analizi',
        description: 'Tedarikçi bazında harcama ve performans analizi',
        category: 'financial',
        icon: 'Users'
      },
      {
        id: 'project-financial',
        name: 'Proje Finansal Raporu',
        description: 'Proje bazında bütçe kullanımı ve maliyet analizi',
        category: 'financial',
        icon: 'FolderOpen'
      }
    ]
  },

  async generateReport(
    reportType: string,
    parameters: ReportParameter
  ): Promise<ReportResult> {
    switch (reportType) {
      case 'income-expense':
        return await this.generateIncomeExpenseReport(parameters)
      case 'cash-flow':
        return await this.generateCashFlowReport(parameters)
      case 'budget-realization':
        return await this.generateBudgetRealizationReport(parameters)
      case 'category-analysis':
        return await this.generateCategoryAnalysisReport(parameters)
      case 'vendor-analysis':
        return await this.generateVendorAnalysisReport(parameters)
      case 'project-financial':
        return await this.generateProjectFinancialReport(parameters)
      default:
        return await this.generateIncomeExpenseReport(parameters)
    }
  },

  async generateIncomeExpenseReport(parameters: ReportParameter): Promise<ReportResult> {
    // Gerçek transaction verilerini çek
    const transactions = await transactionService.getAllTransactions({
      facilityId: parameters.facilityId,
      startDate: parameters.startDate.toISOString().split('T')[0],
      endDate: parameters.endDate.toISOString().split('T')[0],
    })

    // Önceki dönem verilerini çek (karşılaştırma için)
    let previousPeriodTransactions: typeof transactions = []
    if (parameters.compareStartDate && parameters.compareEndDate) {
      previousPeriodTransactions = await transactionService.getAllTransactions({
        facilityId: parameters.facilityId,
        startDate: parameters.compareStartDate.toISOString().split('T')[0],
        endDate: parameters.compareEndDate.toISOString().split('T')[0],
      })
    }

    // Gruplandırma için tarih aralıkları oluştur
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

    let labels: string[] = []
    let income: number[] = []
    let expense: number[] = []

    if (parameters.groupBy === 'month') {
      // Aylık gruplandırma
      const monthMap = new Map<string, { income: number, expense: number }>()

      transactions.forEach(txn => {
        const date = new Date(txn.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { income: 0, expense: 0 })
        }

        const data = monthMap.get(monthKey)!
        if (txn.type === 'income') {
          data.income += txn.amountInBaseCurrency
        } else if (txn.type === 'expense') {
          data.expense += txn.amountInBaseCurrency
        }
      })

      // Sıralı olarak array'e çevir
      const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      labels = sortedMonths.map(([key]) => {
        const [year, month] = key.split('-')
        return months[parseInt(month) - 1]
      })
      income = sortedMonths.map(([, data]) => data.income)
      expense = sortedMonths.map(([, data]) => data.expense)
    } else if (parameters.groupBy === 'day') {
      // Günlük gruplandırma (son 30 gün veya belirtilen aralık)
      const dayMap = new Map<string, { income: number, expense: number }>()

      transactions.forEach(txn => {
        const dayKey = txn.date

        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, { income: 0, expense: 0 })
        }

        const data = dayMap.get(dayKey)!
        if (txn.type === 'income') {
          data.income += txn.amountInBaseCurrency
        } else if (txn.type === 'expense') {
          data.expense += txn.amountInBaseCurrency
        }
      })

      const sortedDays = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      labels = sortedDays.map(([date]) => {
        const d = new Date(date)
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
      })
      income = sortedDays.map(([, data]) => data.income)
      expense = sortedDays.map(([, data]) => data.expense)
    } else {
      // Varsayılan olarak aylık
      const monthMap = new Map<string, { income: number, expense: number }>()

      transactions.forEach(txn => {
        const date = new Date(txn.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { income: 0, expense: 0 })
        }

        const data = monthMap.get(monthKey)!
        if (txn.type === 'income') {
          data.income += txn.amountInBaseCurrency
        } else if (txn.type === 'expense') {
          data.expense += txn.amountInBaseCurrency
        }
      })

      const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      labels = sortedMonths.map(([key]) => {
        const [year, month] = key.split('-')
        return months[parseInt(month) - 1]
      })
      income = sortedMonths.map(([, data]) => data.income)
      expense = sortedMonths.map(([, data]) => data.expense)
    }

    // Toplamları hesapla
    const totalIncome = income.reduce((a, b) => a + b, 0)
    const totalExpense = expense.reduce((a, b) => a + b, 0)
    const net = totalIncome - totalExpense

    // Önceki dönem toplamları
    const prevTotalIncome = previousPeriodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amountInBaseCurrency, 0)
    const prevTotalExpense = previousPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountInBaseCurrency, 0)

    // Değişim yüzdeleri
    const incomeChange = prevTotalIncome > 0
      ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100
      : undefined
    const expenseChange = prevTotalExpense > 0
      ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100
      : undefined

    // Kategori bazlı analiz
    const categoryMap = new Map<string, { income: number, expense: number, name: string }>()

    // Tüm kategorileri çek ve map'i başlat
    const allCategories = await categoryService.getCategories({ facilityId: parameters.facilityId })
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { income: 0, expense: 0, name: cat.name })
    })

    transactions.forEach(txn => {
      const catId = txn.categoryId
      // Eğer kategori silinmişse veya map'te yoksa (örn: global kategori) ismini transaction'dan al veya ekle
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          income: 0,
          expense: 0,
          name: txn.categoryName || 'Diğer'
        })
      }

      const data = categoryMap.get(catId)!
      if (txn.type === 'income') {
        data.income += txn.amountInBaseCurrency
      } else if (txn.type === 'expense') {
        data.expense += txn.amountInBaseCurrency
      }
    })

    // Kategori satırlarını oluştur
    const categories: CategoryReportRow[] = Array.from(categoryMap.entries())
      .map(([catId, data]) => {
        const net = data.income - data.expense
        const total = totalIncome + totalExpense
        const percentage = total > 0 ? ((data.income + data.expense) / total) * 100 : 0

        return {
          category: data.name,
          income: data.income,
          expense: data.expense,
          net,
          percentage,
        }
      })
      .filter(row => row.income !== 0 || row.expense !== 0 ||
        ['Genel Merkez Bütçe Aktarımı', 'Diğer Gelirler', 'Diğer Giderler'].includes(row.category)) // Sadece işlem olanları veya özel istenenleri göster
      .sort((a, b) => Math.abs(b.income + b.expense) - Math.abs(a.income + a.expense))

    return {
      summary: {
        totalIncome,
        totalExpense,
        net,
        incomeChange,
        expenseChange,
      },
      chartData: {
        labels,
        income,
        expense,
      },
      tableData: categories,
    }
  },

  async generateCashFlowReport(parameters: ReportParameter): Promise<ReportResult> {
    // Nakit akış raporu için transaction verilerini kullan
    // Şimdilik income-expense raporu ile aynı mantığı kullanıyoruz ama gelecekte farklılaşabilir
    return this.generateIncomeExpenseReport(parameters)
  },

  async generateBudgetRealizationReport(parameters: ReportParameter): Promise<ReportResult> {
    // Bütçe verilerini çek
    const budgets = await budgetService.getAllBudgets({
      facilityId: parameters.facilityId,
    })

    // Transaction verilerini çek
    const transactions = await transactionService.getAllTransactions({
      facilityId: parameters.facilityId,
      startDate: parameters.startDate.toISOString().split('T')[0],
      endDate: parameters.endDate.toISOString().split('T')[0],
    })

    // Kategorileri çek (scopeId eşleşmesi için)
    const allCategories = await categoryService.getCategories({ facilityId: parameters.facilityId })

    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

    // Bütçe ve gerçekleşen harcamaları hesapla
    const budgeted = budgets.reduce((sum, b) => sum + b.amount, 0)
    const actual = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amountInBaseCurrency, 0)

    const variance = actual - budgeted
    const variancePercentage = budgeted > 0 ? (variance / budgeted) * 100 : 0

    // Aylık dağılım
    const monthMap = new Map<string, { budgeted: number, actual: number }>()

    budgets.forEach(budget => {
      const date = new Date(budget.startDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { budgeted: 0, actual: 0 })
      }

      const data = monthMap.get(monthKey)!
      data.budgeted += budget.amount
    })

    transactions
      .filter(t => t.type === 'expense')
      .forEach(txn => {
        const date = new Date(txn.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { budgeted: 0, actual: 0 })
        }

        const data = monthMap.get(monthKey)!
        data.actual += txn.amountInBaseCurrency
      })

    const sortedMonths = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    const labels = sortedMonths.map(([key]) => {
      const [year, month] = key.split('-')
      return months[parseInt(month) - 1]
    })
    const budgetedAmounts = sortedMonths.map(([, data]) => data.budgeted)
    const actualAmounts = sortedMonths.map(([, data]) => data.actual)

    // Kategori bazlı tablo
    const categoryMap = new Map<string, { budgeted: number, actual: number, name: string }>()

    budgets.forEach(budget => {
      if (budget.scope === 'category' && budget.scopeId) {
        const cat = allCategories.find(c => c.id === budget.scopeId)
        if (cat) {
          if (!categoryMap.has(budget.scopeId)) {
            categoryMap.set(budget.scopeId, { budgeted: 0, actual: 0, name: cat.name })
          }
          const data = categoryMap.get(budget.scopeId)!
          data.budgeted += budget.amount
        }
      }
    })

    transactions
      .filter(t => t.type === 'expense')
      .forEach(txn => {
        if (categoryMap.has(txn.categoryId)) {
          const data = categoryMap.get(txn.categoryId)!
          data.actual += txn.amountInBaseCurrency
        }
      })

    const tableData: CategoryReportRow[] = Array.from(categoryMap.values())
      .map(data => {
        const net = data.actual - data.budgeted
        const percentage = data.budgeted > 0 ? (data.actual / data.budgeted) * 100 : 0

        return {
          category: data.name,
          income: data.budgeted,
          expense: data.actual,
          net,
          percentage,
          previousPeriodDiff: percentage - 100, // Bütçeden sapma
        }
      })
      .sort((a, b) => Math.abs(b.expense) - Math.abs(a.expense))

    return {
      summary: {
        totalIncome: budgeted,
        totalExpense: actual,
        net: variance,
        incomeChange: variancePercentage,
        expenseChange: 0,
      },
      chartData: {
        labels,
        income: budgetedAmounts,
        expense: actualAmounts,
      },
      tableData,
    }
  },

  async generateCategoryAnalysisReport(parameters: ReportParameter): Promise<ReportResult> {
    // Transaction verilerini çek
    const transactions = await transactionService.getAllTransactions({
      facilityId: parameters.facilityId,
      startDate: parameters.startDate.toISOString().split('T')[0],
      endDate: parameters.endDate.toISOString().split('T')[0],
    })

    // Sadece giderleri filtrele
    const expenses = transactions.filter(t => t.type === 'expense')
    const totalExpense = expenses.reduce((sum, t) => sum + t.amountInBaseCurrency, 0)

    // Kategori bazlı analiz
    const categoryMap = new Map<string, { expense: number, name: string }>()

    expenses.forEach(txn => {
      const catId = txn.categoryId
      const catName = txn.categoryName || 'Bilinmeyen'

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { expense: 0, name: catName })
      }

      const data = categoryMap.get(catId)!
      data.expense += txn.amountInBaseCurrency
    })

    const categories = Array.from(categoryMap.values())
      .map(data => ({
        category: data.name,
        income: 0,
        expense: data.expense,
        net: -data.expense,
        percentage: totalExpense > 0 ? (data.expense / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.expense - a.expense)

    return {
      summary: {
        totalIncome: 0,
        totalExpense,
        net: -totalExpense,
        incomeChange: 0,
        expenseChange: 0,
      },
      chartData: {
        labels: categories.map(c => c.category),
        income: [],
        expense: categories.map(c => c.expense),
      },
      tableData: categories,
    }
  },

  async generateVendorAnalysisReport(parameters: ReportParameter): Promise<ReportResult> {
    // Transaction verilerini çek
    const transactions = await transactionService.getAllTransactions({
      facilityId: parameters.facilityId,
      startDate: parameters.startDate.toISOString().split('T')[0],
      endDate: parameters.endDate.toISOString().split('T')[0],
    })

    // Sadece giderleri ve vendor'ları filtrele
    const expenses = transactions.filter(t => t.type === 'expense' && t.vendorCustomerId)
    const totalExpense = expenses.reduce((sum, t) => sum + t.amountInBaseCurrency, 0)

    // Vendor bazlı analiz
    const vendorMap = new Map<string, { expense: number, name: string }>()

    expenses.forEach(txn => {
      const vendorId = txn.vendorCustomerId!
      const vendorName = txn.vendorCustomerName || 'Bilinmeyen'

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, { expense: 0, name: vendorName })
      }

      const data = vendorMap.get(vendorId)!
      data.expense += txn.amountInBaseCurrency
    })

    const vendors = Array.from(vendorMap.values())
      .map(data => ({
        category: data.name,
        income: 0,
        expense: data.expense,
        net: -data.expense,
        percentage: totalExpense > 0 ? (data.expense / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.expense - a.expense)

    return {
      summary: {
        totalIncome: 0,
        totalExpense,
        net: -totalExpense,
        incomeChange: 0,
        expenseChange: 0,
      },
      chartData: {
        labels: vendors.map(v => v.category),
        income: [],
        expense: vendors.map(v => v.expense),
      },
      tableData: vendors,
    }
  },

  async generateProjectFinancialReport(parameters: ReportParameter): Promise<ReportResult> {
    // Proje verilerini çek
    const projects = await projectService.getProjects(parameters.facilityId)

    // Transaction verilerini çek
    const transactions = await transactionService.getAllTransactions({
      facilityId: parameters.facilityId,
      startDate: parameters.startDate.toISOString().split('T')[0],
      endDate: parameters.endDate.toISOString().split('T')[0],
    })

    // Proje bazlı analiz
    const projectMap = new Map<string, { income: number, expense: number, name: string }>()

    // Projeleri map'e ekle
    projects.forEach(proj => {
      projectMap.set(proj.id, { income: 0, expense: 0, name: proj.name })
    })

    // Transactionları projelere dağıt
    transactions.forEach(txn => {
      if (txn.projectId && projectMap.has(txn.projectId)) {
        const data = projectMap.get(txn.projectId)!
        if (txn.type === 'income') {
          data.income += txn.amountInBaseCurrency
        } else if (txn.type === 'expense') {
          data.expense += txn.amountInBaseCurrency
        }
      }
    })

    const projectData = Array.from(projectMap.values())
      .map(data => ({
        category: data.name,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
        percentage: 0, // Projeler için yüzde hesaplaması farklı olabilir
      }))
      .sort((a, b) => b.income - a.income)

    const totalIncome = projectData.reduce((sum, p) => sum + p.income, 0)
    const totalExpense = projectData.reduce((sum, p) => sum + p.expense, 0)

    return {
      summary: {
        totalIncome,
        totalExpense,
        net: totalIncome - totalExpense,
        incomeChange: 0,
        expenseChange: 0,
      },
      chartData: {
        labels: projectData.map(p => p.category),
        income: projectData.map(p => p.income),
        expense: projectData.map(p => p.expense),
      },
      tableData: projectData,
    }
  },

  async getDashboardSummary(facilityId: string, dateRange?: { from: Date; to: Date }): Promise<DashboardSummary> {
    try {
      // RPC returning incorrect data, using fallback directly
      // TODO: Fix RPC function to correctly calculate activeProjects
      return this.getDashboardSummaryFallback(facilityId)

      /* Disabled RPC - was returning incorrect project counts
      // 1. Try to get summary from RPC first for performance
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_summary', {
        p_facility_id: facilityId,
        p_start_date: dateRange?.from?.toISOString(),
        p_end_date: dateRange?.to?.toISOString()
      })
      
      if (!rpcError && rpcData) {
        // We still need to calculate trends (monthly changes) as the RPC currently only returns totals
        // For now, we can fetch just the necessary data for trends or expand the RPC later.
        // To keep it robust, let's mix RPC totals with client-side trend calculation for now,
        // but significantly reduce the data fetched if possible.
      
        // Actually, to fully utilize RPC, we should move trend calc there too.
        // But for this step, let's use the RPC values for the main cards and keep the existing logic 
        // for charts/trends but maybe optimized?
      
        // Let's stick to the existing logic for trends to ensure we don't break charts,
        // but use RPC for the absolute totals to ensure consistency with the DB.
      
        // Re-using existing logic for trends but overriding totals with RPC data
      
        // Helper to get date ranges
        const now = new Date()
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      
        // Helper to calculate trend
        const getTrend = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0
          return ((current - previous) / previous) * 100
        }
      
        // ... (Existing trend logic needs to be preserved or re-implemented)
        // Since we want to optimize, let's just return the RPC data and mock trends for now 
        // OR fetch minimal data for trends.
      
        // For the purpose of this task (Optimization), let's assume we want to rely on RPC.
        // But the UI expects trends.
      
        // Let's return the RPC data structure mapped to DashboardSummary
        // and default trends to 0 until we update RPC to handle them.
      
        return {
          finance: {
            totalIncome: rpcData.finance.totalIncome,
            totalExpense: rpcData.finance.totalExpense,
            netIncome: rpcData.finance.netIncome,
            incomeChange: 0, // TODO: Add to RPC
            expenseChange: 0, // TODO: Add to RPC
            monthlyTrend: [], // TODO: Add to RPC or separate endpoint
            pendingTransactions: 0, // TODO: Add to RPC
            categoryExpenses: [], // TODO: Add to RPC
            categoryIncomes: [] // TODO: Add to RPC
          },
          hr: {
            totalEmployees: rpcData.hr.totalEmployees,
            activeEmployees: rpcData.hr.activeEmployees,
            leaveCount: rpcData.hr.leaveCount,
            totalSalaries: 0, // TODO: Add to RPC
            employeeChange: 0, // TODO: Add to RPC
            employeeDetails: [] // Keep empty or fetch separately if needed
          },
          projects: {
            totalProjects: rpcData.projects.totalProjects,
            activeProjects: rpcData.projects.activeProjects,
            completedProjects: rpcData.projects.completedProjects,
            totalBudget: rpcData.projects.totalBudget,
            totalSpent: rpcData.projects.totalSpent,
            projectChange: 0 // TODO: Add to RPC
          },
          qurban: {
            totalShares: rpcData.qurban.totalShares,
            totalDonations: rpcData.qurban.totalDonations,
            slaughteredCount: rpcData.qurban.slaughteredCount,
            distributedCount: rpcData.qurban.distributedCount,
            shareChange: 0, // TODO: Add to RPC
            donationChange: 0 // TODO: Add to RPC
          },
          donations: {
            totalAmount: rpcData.qurban.totalDonations,
            donorCount: 0, // TODO: Add to RPC
            monthlyTrend: [],
                amountChange: 0
              }
            }
          }
      
          // Fallback to existing slow logic if RPC fails
          console.warn('RPC failed, falling back to client-side calculation', rpcError)
          return this.getDashboardSummaryFallback(facilityId)
          Disabled RPC ends here */

    } catch (error) {
      console.error('Get dashboard summary error:', error)
      throw error
    }
  },

  // Renamed original function to fallback
  async getDashboardSummaryFallback(facilityId: string): Promise<DashboardSummary> {
    // Helper to get date ranges
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Helper to calculate trend
    const getTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    // 1. Finance Summary
    const stats = await transactionService.getStatistics({ facilityId })

    // Get 6 months of data for the trend chart
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const trendEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const transactions = await transactionService.getAllTransactions({
      facilityId,
      startDate: format(sixMonthsAgo, 'yyyy-MM-dd'),
      endDate: format(trendEndDate, 'yyyy-MM-dd')
    })

    // Calculate Monthly Trend
    const monthlyTrend: { name: string; income: number; expense: number }[] = []
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthIndex = d.getMonth()
      const monthName = months[monthIndex]

      const monthTransactions = transactions.filter(t => {
        const td = new Date(t.date)
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
      })

      monthlyTrend.push({
        name: monthName,
        income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amountInBaseCurrency || 0), 0),
        expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amountInBaseCurrency || 0), 0)
      })
    }

    // 2. HR Summary
    const employees = await employeeService.getEmployees({ facilityId })

    // Fetch approved leave requests to calculate absenteeism
    const { data: leaveRequests } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('status', 'approved')

    const employeeDetails = employees.map(emp => {
      const empLeaves = leaveRequests?.filter(l => l.employee_id === emp.id) || []
      const totalLeaveDays = empLeaves.reduce((sum, l) => sum + (l.total_days || 0), 0)

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || '-',
        position: emp.position || '-',
        status: emp.status,
        joinDate: emp.hireDate || emp.createdAt,
        leaveDays: totalLeaveDays,
        salary: emp.salary?.amount || 0
      }
    })

    // Current Month Stats
    const activeEmployees = employees.filter(e => e.status === 'active')
    const totalSalaries = activeEmployees.reduce((sum, e) => sum + (e.salary?.amount || 0), 0)
    const leaveCount = employees.filter(e => e.status === 'on-leave').length

    // Previous Month Stats (Approximation based on created_at)
    // We assume employees created before prevMonthEnd were active last month (ignoring deletions/status changes for now)
    const prevActiveEmployees = employees.filter(e =>
      new Date(e.hireDate || e.createdAt || new Date()).getTime() <= prevMonthEnd.getTime() &&
      e.status === 'active'
    )
    const employeeChange = getTrend(activeEmployees.length, prevActiveEmployees.length)

    // 3. Projects Summary
    const projects = await projectService.getProjects(facilityId)

    const activeProjects = projects.filter(p => p.status === 'active')
    const completedProjects = projects.filter(p => p.status === 'completed')
    const totalProjectBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalProjectSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0)

    // Previous Month Projects (Approximation)
    const prevProjects = projects.filter(p => new Date(p.startDate).getTime() <= prevMonthEnd.getTime())
    const projectChange = getTrend(projects.length, prevProjects.length)

    // 4. Qurban Summary
    // Fetch all donations for calculation
    const { data: allDonations } = await supabase
      .from('qurban_donations')
      .select('*')
      .eq('facility_id', facilityId)

    const qurbanDonations = allDonations || []

    // Fetch campaigns for slaughtered count
    const { data: allCampaigns } = await supabase
      .from('qurban_campaigns')
      .select('*')
      .eq('facility_id', facilityId)

    // Fetch distributions for distributed count
    const { data: allDistributions } = await supabase
      .from('distribution_records')
      .select('*')
      .eq('facility_id', facilityId)

    // Cumulative Stats (All Time / Year to Date)
    // For now, we'll take all time to ensure "past data" is shown as requested.
    // In a real app, we might want to filter by the active "Season" or Year.

    // Only count PAID donations for shares and amounts
    const paidDonations = qurbanDonations.filter(d => d.payment_status === 'paid')

    // Total Shares: All paid donations' share_count (not just large cattle)
    const totalShares = paidDonations
      .reduce((sum, d) => sum + (d.share_count || 0), 0)

    // Total donation amount (TL equivalent) - only paid donations
    const totalDonationAmount = paidDonations
      .reduce((sum, d) => sum + (d.amount_in_try || d.amount || 0), 0)

    // Slaughtered count: From campaigns - shows completed_animals vs target_animals
    const slaughteredCount = (allCampaigns || [])
      .reduce((sum, c) => sum + (c.completed_animals || 0), 0)

    // Target animals (for reference - could be displayed as "X / Y kesilen")
    const targetAnimals = (allCampaigns || [])
      .reduce((sum, c) => sum + (c.target_animals || 0), 0)

    const distributedCount = (allDistributions || [])
      .reduce((sum, d) => sum + (d.package_count || 0), 0) // Assuming package_count tracks distributed units

    // Trends (Month over Month) - Only count PAID donations
    const currentMonthDonations = qurbanDonations.filter(d => {
      const date = new Date(d.created_at)
      return date >= currentMonthStart && date <= currentMonthEnd && d.payment_status === 'paid'
    })

    const prevMonthDonations = qurbanDonations.filter(d => {
      const date = new Date(d.created_at)
      return date >= prevMonthStart && date <= prevMonthEnd && d.payment_status === 'paid'
    })

    // Only count paid donations for shares
    const currentMonthShares = currentMonthDonations
      .reduce((sum, d) => sum + (d.share_count || 0), 0)

    const prevMonthShares = prevMonthDonations
      .reduce((sum, d) => sum + (d.share_count || 0), 0)

    // Use TRY equivalent for amounts
    const currentMonthAmount = currentMonthDonations.reduce((sum, d) => sum + (d.amount_in_try || d.amount || 0), 0)
    const prevMonthAmount = prevMonthDonations.reduce((sum, d) => sum + (d.amount_in_try || d.amount || 0), 0)

    const shareChange = getTrend(currentMonthShares, prevMonthShares)
    const donationChange = getTrend(currentMonthAmount, prevMonthAmount)

    // 5. Donations Summary (Using Qurban Data as requested)

    return {
      finance: {
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        netIncome: stats.netAmount,
        incomeChange: stats.incomeTrend,
        expenseChange: stats.expenseTrend,
        monthlyTrend
      },
      hr: {
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        leaveCount,
        totalSalaries,
        employeeChange,
        employeeDetails
      },
      projects: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalBudget: totalProjectBudget,
        totalSpent: totalProjectSpent,
        projectChange
      },
      qurban: {
        totalShares, // Cumulative
        totalDonations: totalDonationAmount, // Cumulative
        slaughteredCount, // Cumulative from campaigns
        distributedCount, // Cumulative from distribution records
        shareChange, // Monthly trend
        donationChange // Monthly trend
      },
      donations: {
        totalAmount: totalDonationAmount,
        donorCount: qurbanDonations.length,
        monthlyTrend: [],
        amountChange: donationChange
      }
    }
  }
}
