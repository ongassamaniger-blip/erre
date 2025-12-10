import {
  Budget,
  BudgetFilters,
  PaginatedResponse,
  PaginationParams,
  BudgetSpending,
  Transaction,
  CreateBudgetDTO,
  UpdateBudgetDTO
} from '@/types/finance'
import { supabase } from '@/lib/supabase'

import { projectService } from '@/services/projects/projectService'

// Helper to map DB result to Budget type
const mapToBudget = (data: any): Budget => {
  let scope: Budget['scope'] = 'department'
  let scopeId = data.department_id
  let scopeName = data.departments?.name

  if (data.project_id) {
    scope = 'project'
    scopeId = data.project_id
    scopeName = data.projects?.name
  } else if (data.category_id) {
    scope = 'category'
    scopeId = data.category_id
    scopeName = 'Category' // Need to fetch category name if not joined
  }

  return {
    id: data.id,
    code: data.id.substring(0, 8), // Generate a code if not in DB
    name: data.name,
    year: data.year,
    period: data.period,
    periodLabel: data.period === 'yearly' ? 'Yıllık' : data.period === 'quarterly' ? 'Çeyreklik' : 'Aylık',
    scope,
    scopeId,
    scopeName: scopeName || 'Unknown',
    amount: data.total_amount, // Map total_amount to amount
    spent: data.spent_amount || 0,
    remaining: data.total_amount - (data.spent_amount || 0),
    usagePercentage: data.total_amount > 0 ? ((data.spent_amount || 0) / data.total_amount) * 100 : 0,
    status: data.status,
    currency: data.currency,
    startDate: data.start_date,
    endDate: data.end_date,
    facilityId: data.facility_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

export const budgetService = {
  async getBudgets(
    filters?: BudgetFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Budget>> {
    try {
      let query = supabase
        .from('budgets')
        .select('*, departments(name), projects(name)', { count: 'exact' })

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId)
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId)
      }
      if (filters?.year) {
        query = query.eq('year', filters.year)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
      }

      const page = pagination?.page || 1
      const pageSize = pagination?.pageSize || 10
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to).order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      const budgets = (data || []).map(mapToBudget)

      return {
        data: budgets,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    } catch (error) {
      console.error('Get budgets error:', error)
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
    }
  },

  async getAllBudgets(filters?: BudgetFilters): Promise<Budget[]> {
    try {
      let query = supabase
        .from('budgets')
        .select('*, departments(name), projects(name)')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId)
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId)
      }
      if (filters?.year) {
        query = query.eq('year', filters.year)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(mapToBudget)
    } catch (error) {
      console.error('Get all budgets error:', error)
      return []
    }
  },

  async getBudgetById(id: string): Promise<Budget | null> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, departments(name), projects(name)')
        .eq('id', id)
        .single()

      if (error) throw error
      return mapToBudget(data)
    } catch (error) {
      console.error('Get budget error:', error)
      return null
    }
  },

  async getBudgetSpending(budgetId: string): Promise<BudgetSpending[]> {
    try {
      // Get transactions for this budget (linked via department or project)
      const budget = await this.getBudgetById(budgetId)
      if (!budget) return []

      let query = supabase.from('transactions').select('amount, category_id, categories(name)')
        .eq('type', 'expense')
        .eq('status', 'approved')

      if (budget.scope === 'department') {
        query = query.eq('department_id', budget.scopeId)
      } else if (budget.scope === 'project') {
        query = query.eq('project_id', budget.scopeId)
      } else {
        return []
      }

      const { data, error } = await query

      if (error) throw error

      // Aggregate spending by date for trend chart
      const dailySpending = new Map<string, number>()

      data?.forEach((t: any) => {
        const date = t.date.split('T')[0] // Use YYYY-MM-DD
        dailySpending.set(date, (dailySpending.get(date) || 0) + Number(t.amount))
      })

      // Convert to array and sort by date
      const sortedDates = Array.from(dailySpending.keys()).sort()

      const spending: BudgetSpending[] = []
      let cumulative = 0

      sortedDates.forEach(date => {
        const amount = dailySpending.get(date) || 0
        cumulative += amount
        spending.push({
          date,
          amount,
          cumulative,
          percentage: (cumulative / budget.amount) * 100
        })
      })

      return spending
    } catch (error) {
      console.error('Get budget spending error:', error)
      return []
    }
  },

  async getBudgetTransactions(budgetId: string): Promise<Transaction[]> {
    try {
      const budget = await this.getBudgetById(budgetId)
      if (!budget) return []

      let query = supabase.from('transactions').select('*')
        .eq('type', 'expense')

      if (budget.scope === 'department') {
        query = query.eq('department_id', budget.scopeId)
      } else if (budget.scope === 'project') {
        query = query.eq('project_id', budget.scopeId)
      } else {
        return []
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get budget transactions error:', error)
      return []
    }
  },

  async createBudget(budgetData: CreateBudgetDTO): Promise<Budget> {
    try {
      const dbData: any = {
        name: budgetData.name,
        year: budgetData.year,
        period: budgetData.period,
        start_date: budgetData.startDate,
        end_date: budgetData.endDate,
        total_amount: budgetData.amount,
        currency: budgetData.currency,
        status: budgetData.status || 'draft',
        department_id: budgetData.scope === 'department' ? budgetData.scopeId : null,
        project_id: budgetData.scope === 'project' ? budgetData.scopeId : null,
        category_id: budgetData.scope === 'category' ? budgetData.scopeId : null,
        facility_id: budgetData.facilityId
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert(dbData)
        .select('*, departments(name), projects(name)')
        .single()

      if (error) throw error
      return mapToBudget(data)
    } catch (error) {
      console.error('Create budget error:', error)
      throw error
    }
  },

  async updateBudget(budgetData: UpdateBudgetDTO): Promise<Budget> {
    try {
      const { id, ...updates } = budgetData
      const dbUpdates: any = {}

      if (updates.name) dbUpdates.name = updates.name
      if (updates.year) dbUpdates.year = updates.year
      if (updates.period) dbUpdates.period = updates.period
      if (updates.startDate) dbUpdates.start_date = updates.startDate
      if (updates.endDate) dbUpdates.end_date = updates.endDate
      if (updates.amount) dbUpdates.total_amount = updates.amount
      if (updates.currency) dbUpdates.currency = updates.currency
      if ((updates as any).status) dbUpdates.status = (updates as any).status

      if (updates.scope && updates.scopeId) {
        dbUpdates.department_id = updates.scope === 'department' ? updates.scopeId : null
        dbUpdates.project_id = updates.scope === 'project' ? updates.scopeId : null
        dbUpdates.category_id = updates.scope === 'category' ? updates.scopeId : null
      }

      const { data, error } = await supabase
        .from('budgets')
        .update(dbUpdates)
        .eq('id', id)
        .select('*, departments(name), projects(name)')
        .single()

      if (error) throw error
      return mapToBudget(data)
    } catch (error) {
      console.error('Update budget error:', error)
      throw error
    }
  },

  async deleteBudget(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete budget error:', error)
      throw error
    }
  },

  async approveBudget(id: string): Promise<void> {
    try {
      // 1. Get the budget to be approved
      const budget = await this.getBudgetById(id)
      if (!budget) throw new Error('Budget not found')

      // 2. Check for existing active budget for the same scope and year
      let query = supabase
        .from('budgets')
        .select('*')
        .eq('year', budget.year)
        .eq('status', 'active')
        .eq('facility_id', budget.facilityId)
        .neq('id', id) // Exclude self

      if (budget.scope === 'department') {
        query = query.eq('department_id', budget.scopeId)
      } else if (budget.scope === 'project') {
        query = query.eq('project_id', budget.scopeId)
      } else if (budget.scope === 'category') {
        query = query.eq('category_id', budget.scopeId)
      }

      const { data: existingBudgets, error: searchError } = await query

      if (searchError) throw searchError

      const existingBudget = existingBudgets && existingBudgets.length > 0 ? existingBudgets[0] : null

      if (existingBudget) {
        // MERGE LOGIC
        const newTotalAmount = existingBudget.total_amount + budget.amount

        // Update existing budget
        const { error: updateExistingError } = await supabase
          .from('budgets')
          .update({ total_amount: newTotalAmount })
          .eq('id', existingBudget.id)

        if (updateExistingError) throw updateExistingError

        // Mark current budget as merged/archived
        // We use 'cancelled' status but maybe add a note or use a specific status if available.
        // For now, let's use 'cancelled' to hide it from active list, but it's technically merged.
        // Ideally we should have a 'merged' status. Let's check if we can use it.
        // If not, 'cancelled' is safe fallback to hide it.
        const { error: updateCurrentError } = await supabase
          .from('budgets')
          .update({
            status: 'cancelled', // Using cancelled as "merged/archived"
            name: `${budget.name} (Birleştirildi -> ${existingBudget.name})`
          })
          .eq('id', id)

        if (updateCurrentError) throw updateCurrentError

      } else {
        // ACTIVATE LOGIC
        const { error: updateError } = await supabase
          .from('budgets')
          .update({ status: 'active' })
          .eq('id', id)

        if (updateError) throw updateError
      }

      // 3. If project budget, update project total (Cumulative)
      if (budget.scope === 'project' && budget.scopeId) {
        // Get current project budget
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('budget')
          .eq('id', budget.scopeId)
          .single()

        if (projectError) throw projectError

        const currentBudget = project.budget || 0
        const newBudget = currentBudget + budget.amount

        // Update project
        const { error: updateProjectError } = await supabase
          .from('projects')
          .update({ budget: newBudget })
          .eq('id', budget.scopeId)

        if (updateProjectError) throw updateProjectError

        // Log activity
        await projectService.logActivity(
          budget.scopeId,
          'budget_updated',
          `Proje bütçesi güncellendi: +${budget.amount.toLocaleString('tr-TR')} ${budget.currency}`
        )
      }
    } catch (error) {
      console.error('Approve budget error:', error)
      throw error
    }
  },

  async rejectBudget(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('budgets')
        .update({ status: 'cancelled' }) // Use cancelled instead of rejected
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Reject budget error:', error)
      throw error
    }
  },

  async transferBudgetToProject(
    sourceBudgetId: string,
    projectId: string,
    amount: number,
    description?: string
  ): Promise<{ sourceBudget: Budget; projectBudget: Budget }> {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) throw new Error('User not authenticated')

      const { data, error } = await supabase.rpc('transfer_budget_to_project', {
        p_source_budget_id: sourceBudgetId,
        p_project_id: projectId,
        p_amount: amount,
        p_description: description || '',
        p_user_id: userId
      })

      if (error) throw error

      // Log activity (Client side logging for now, though RPC could do it too)
      await projectService.logActivity(
        projectId,
        'budget_updated',
        `Bütçe transferi: ${amount.toLocaleString('tr-TR')} birim aktarıldı. Açıklama: ${description || '-'}`
      )

      // Fetch updated budgets to return
      const sourceBudget = await this.getBudgetById(sourceBudgetId)
      const projectBudget = await this.getBudgetById(data.project_budget_id)

      if (!sourceBudget || !projectBudget) throw new Error('Failed to fetch updated budgets')

      return {
        sourceBudget,
        projectBudget
      }

    } catch (error) {
      console.error('Transfer budget error:', error)
      throw error
    }
  }
}
