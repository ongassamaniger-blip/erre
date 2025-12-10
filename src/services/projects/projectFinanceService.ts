import { supabase } from '@/lib/supabase'
import { transactionService } from '@/services/finance/transactionService'
import { projectService } from './projectService'
import { categoryService } from '@/services/finance/categoryService'
import { Currency } from '@/types/finance'

export interface ProjectTransaction {
  id: string
  projectId: string
  transactionId?: string // Kept for compatibility but same as id
  date: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  category: string
  description: string
  vendorCustomerName?: string
  vendorCustomerId?: string
  status: 'pending' | 'approved' | 'rejected' | 'draft'
  createdBy: string
  createdAt: string
}

export interface ProjectFinancialSummary {
  projectId: string
  totalBudget: number
  totalIncome: number
  totalExpense: number
  netAmount: number
  currency: string
  budgetUtilization: number // Yüzde
  remainingBudget: number
  byCategory: {
    category: string
    budgeted: number
    spent: number
    remaining: number
  }[]
  monthlyBreakdown: {
    month: string
    income: number
    expense: number
    net: number
  }[]
}

export const projectFinanceService = {
  async getProjectTransactions(projectId: string, filters?: {
    type?: 'income' | 'expense'
    dateFrom?: string
    dateTo?: string
    category?: string
    status?: string
  }): Promise<ProjectTransaction[]> {
    try {
      // Query the main transactions table
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(name),
          vendor:vendors_customers(name)
        `)
        .eq('project_id', projectId)

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo)
      }

      // Note: Category filter on joined table might need different handling if complex, 
      // but for now assuming we filter by category name if possible or handle in memory if needed.
      // Supabase doesn't support filtering on joined tables easily in one go without !inner.
      // For simplicity, we'll fetch and map, then filter if category is strictly needed by name.
      // Or better, if filter.category is an ID, use category_id. 
      // The UI passes category NAME currently. Let's filter in memory for category to be safe and simple.

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error

      let transactions = (data || []).map(fromDbTransaction)

      if (filters?.category) {
        transactions = transactions.filter(t => t.category === filters.category)
      }

      return transactions
    } catch (error) {
      console.error('Get project transactions error:', error)
      return []
    }
  },

  async getProjectFinancialSummary(projectId: string, projectBudget?: number): Promise<ProjectFinancialSummary> {
    const transactions = await this.getProjectTransactions(projectId)

    const totalBudget = projectBudget || 0

    // Calculate totals based on APPROVED transactions
    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter(t => t.type === 'expense' && t.status === 'approved')
      .reduce((sum, t) => sum + t.amount, 0)

    const netAmount = totalIncome - totalExpense
    const budgetUtilization = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0
    const remainingBudget = totalBudget - totalExpense

    // Kategori bazlı özet (Sadece Giderler)
    const categoryMap = new Map<string, { budgeted: number; spent: number }>()
    transactions
      .filter(t => t.type === 'expense' && t.status === 'approved')
      .forEach(t => {
        const catName = t.category || 'Diğer'
        const existing = categoryMap.get(catName) || { budgeted: 0, spent: 0 }
        existing.spent += t.amount
        categoryMap.set(catName, existing)
      })

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      budgeted: data.budgeted || 0, // Budget per category is not tracked yet, defaulting to 0
      spent: data.spent,
      remaining: (data.budgeted || 0) - data.spent,
    }))

    // Aylık özet
    const monthlyMap = new Map<string, { income: number; expense: number }>()
    transactions
      .filter(t => t.status === 'approved')
      .forEach(t => {
        const month = t.date.slice(0, 7) // YYYY-MM
        const existing = monthlyMap.get(month) || { income: 0, expense: 0 }
        if (t.type === 'income') {
          existing.income += t.amount
        } else {
          existing.expense += t.amount
        }
        monthlyMap.set(month, existing)
      })

    const monthlyBreakdown = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      projectId,
      totalBudget,
      totalIncome,
      totalExpense,
      netAmount,
      currency: 'TRY',
      budgetUtilization,
      remainingBudget,
      byCategory,
      monthlyBreakdown,
    }
  },

  async createProjectTransaction(projectId: string, data: Partial<ProjectTransaction>): Promise<ProjectTransaction> {
    try {
      // Proje bilgisini al
      const project = await projectService.getProjectById(projectId)
      if (!project) {
        throw new Error('Proje bulunamadı')
      }

      // Kategori ID bul
      const categories = await categoryService.getCategories()
      const categoryId = categories.find(c => c.name === data.category)?.id || categories[0]?.id

      // Use the main transaction service
      const mainTransaction = await transactionService.createTransaction({
        type: data.type || 'expense',
        date: data.date || new Date().toISOString().split('T')[0],
        amount: data.amount || 0,
        currency: (data.currency as Currency) || 'TRY',
        categoryId: categoryId,
        title: data.description || `Proje: ${project.name}`,
        description: data.description || `${project.name} projesi için finansal işlem`,
        projectId,
        paymentMethod: 'bank_transfer',
        documents: [] as any,
        status: data.status || 'draft',
        facilityId: project.facilityId || '',
        vendorCustomerId: data.vendorCustomerId,
      })

      // Log activity via projectService (transactionService might already do this, but to be safe/explicit for project view)
      // Actually transactionService logs activity too, but let's ensure the message is what we want.
      // transactionService logs: "Yeni işlem oluşturuldu: [Title]"
      // We might want: "Finansal işlem oluşturuldu (Gelir: 1000 TRY)"
      // Let's rely on transactionService's logging to avoid duplicates, or check if we need custom logging.

      return fromDbTransaction({
        ...mainTransaction,
        category: { name: data.category || 'Diğer' }, // Mock for immediate return
        vendor: { name: data.vendorCustomerName }
      })
    } catch (error) {
      console.error('Create project transaction error:', error)
      throw error
    }
  },

  async updateProjectTransaction(id: string, data: Partial<ProjectTransaction>): Promise<ProjectTransaction> {
    try {
      // Use main transaction service
      const updated = await transactionService.updateTransaction({
        id,
        amount: data.amount,
        description: data.description,
        status: data.status as any,
        date: data.date,
        // Add other fields if transactionService supports them in update
      })

      return fromDbTransaction(updated)
    } catch (error) {
      console.error('Update project transaction error:', error)
      throw error
    }
  },

  async deleteProjectTransaction(id: string): Promise<void> {
    try {
      await transactionService.deleteTransaction(id)
    } catch (error) {
      console.error('Delete project transaction error:', error)
      throw error
    }
  },
}

// Helper to map DB transaction to ProjectTransaction
const fromDbTransaction = (dbData: any): ProjectTransaction => {
  return {
    id: dbData.id,
    projectId: dbData.project_id,
    transactionId: dbData.id,
    date: dbData.date,
    type: dbData.type,
    amount: dbData.amount,
    currency: dbData.currency,
    category: dbData.category?.name || 'Diğer',
    description: dbData.description || dbData.title,
    vendorCustomerName: dbData.vendor?.name,
    vendorCustomerId: dbData.vendor_customer_id,
    status: dbData.status,
    createdBy: dbData.created_by,
    createdAt: dbData.created_at,
  }
}
