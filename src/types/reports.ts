export interface ReportType {
  id: string
  name: string
  description: string
  category: 'financial' | 'budget' | 'category' | 'custom'
  icon: string
}

export interface ReportParameter {
  startDate: Date
  endDate: Date
  compareStartDate?: Date
  compareEndDate?: Date
  filters: {
    categories?: string[]
    departments?: string[]
    projects?: string[]
    vendors?: string[]
  }
  groupBy: 'day' | 'week' | 'month' | 'year'
  visualization: 'table' | 'chart' | 'both'
  facilityId?: string // Şube ID'si
}

export interface ReportResult {
  summary: {
    totalIncome: number
    totalExpense: number
    net: number
    incomeChange?: number
    expenseChange?: number
  }
  chartData: {
    labels: string[]
    income: number[]
    expense: number[]
  }
  tableData: CategoryReportRow[]
}

export interface CategoryReportRow {
  category: string
  subcategory?: string
  income: number
  expense: number
  net: number
  percentage: number
  previousPeriodDiff?: number
  children?: CategoryReportRow[]
}

export interface ScheduledReport {
  id: string
  name: string
  reportType: string
  parameters: ReportParameter
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  recipients: string[]
  format: 'pdf' | 'excel'
  isActive: boolean
  lastSent?: string
  nextScheduled?: string
  createdAt: string
  createdBy: string
  facilityId?: string // Şube ID'si
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  parameters: Partial<ReportParameter>
  isDefault: boolean
  createdBy?: string
}

export interface DashboardSummary {
  finance: {
    totalIncome: number
    totalExpense: number
    netIncome: number
    incomeChange: number
    expenseChange: number
    monthlyTrend: { name: string; income: number; expense: number }[]
    pendingTransactions: number
    categoryExpenses: { category: string; amount: number; percentage: number; change: number }[]
    categoryIncomes: { category: string; amount: number; percentage: number; change: number }[]
  }
  hr: {
    totalEmployees: number
    activeEmployees: number
    leaveCount: number
    totalSalaries: number
    employeeChange: number
    employeeDetails: {
      id: string
      name: string
      department: string
      position: string
      status: string
      joinDate: string
      leaveDays: number
      salary: number
    }[]
  }
  projects: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalBudget: number
    totalSpent: number
    projectChange: number
  }
  qurban: {
    totalShares: number
    totalDonations: number
    slaughteredCount: number
    distributedCount: number
    shareChange: number
    donationChange: number
  }
  donations: {
    totalAmount: number
    donorCount: number
    monthlyTrend: { name: string; amount: number }[]
    amountChange: number
  }
}
