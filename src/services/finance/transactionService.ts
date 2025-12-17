import {
  Transaction,
  TransactionFilters,
  PaginationParams,
  PaginatedResponse,
  CreateTransactionDTO,
  UpdateTransactionDTO
} from '@/types/finance'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export const transactionService = {
  // Helper to map DB result to Transaction type
  mapToTransaction(data: any): Transaction {
    return {
      id: data.id,
      code: data.transaction_number,
      type: data.type,
      date: data.date,
      amount: data.amount,
      currency: data.currency,
      exchangeRate: data.exchange_rate,
      amountInBaseCurrency: data.amount_in_try,
      categoryId: data.category_id,
      categoryName: data.categories?.name,
      title: data.description, // Map description to title for display
      description: data.description,
      vendorCustomerId: data.vendor_customer_id,
      vendorCustomerName: data.vendors_customers?.name,
      projectId: data.project_id,
      projectName: data.projects?.name,
      departmentId: data.department_id,
      departmentName: data.departments?.name,
      paymentMethod: data.payment_method,
      status: data.status,
      documents: data.documents || [],
      notes: data.notes,
      facilityId: data.facility_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      approvalSteps: data.approval_steps,
      activityLog: data.activity_log,
      categories: data.categories,
      vendors_customers: data.vendors_customers,
      departments: data.departments,
      projects: data.projects
    }
  },

  // Get transactions with filters and pagination
  async getTransactions(
    filters?: TransactionFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      let query = supabase
        .from('transactions')
        .select('*, categories(name), vendors_customers(name), departments(name), projects(name)', { count: 'exact' })

      // Apply filters
      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.approvalStatus) {
        query = query.eq('approval_status', filters.approvalStatus)
      }
      if (filters?.vendorCustomerId) {
        query = query.eq('vendor_customer_id', filters.vendorCustomerId)
      }
      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId)
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId)
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate)
      }
      if (filters?.minAmount) {
        query = query.gte('amount', filters.minAmount)
      }
      if (filters?.maxAmount) {
        query = query.lte('amount', filters.maxAmount)
      }
      if (filters?.search) {
        query = query.or(`description.ilike.%${filters.search}%,transaction_number.ilike.%${filters.search}%`)
      }

      // Pagination
      const page = pagination?.page || 1
      const pageSize = pagination?.pageSize || 10
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      query = query.range(from, to).order('date', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: (data as any[] || []).map(this.mapToTransaction),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    } catch (error) {
      console.error('Get transactions error:', error)
      return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
    }
  },

  // Get all transactions without pagination (with safety limit)
  async getAllTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*, categories(name), vendors_customers(name), departments(name), projects(name)')
        .limit(10000) // Safety limit to prevent memory issues

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error
      return (data as any[] || []).map(this.mapToTransaction)
    } catch (error) {
      console.error('Get all transactions error:', error)
      return []
    }
  },

  // Get single transaction
  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name), vendors_customers(name), departments(name), projects(name)')
        .eq('id', id)
        .single()

      if (error) throw error
      return this.mapToTransaction(data)
    } catch (error) {
      console.error('Get transaction error:', error)
      return null
    }
  },

  // Get multiple transactions by IDs
  async getTransactionsByIds(ids: string[]): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name), vendors_customers(name), departments(name), projects(name)')
        .in('id', ids)

      if (error) throw error
      return (data as any[] || []).map(this.mapToTransaction)
    } catch (error) {
      console.error('Get transactions by IDs error:', error)
      return []
    }
  },

  // Upload documents
  async uploadDocuments(files: File[]): Promise<any[]> {
    const uploadedDocs: any[] = []

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)

        uploadedDocs.push({
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        })
      } catch (error) {
        console.error('File upload error:', error)
        // Continue with other files or throw based on requirements
      }
    }

    return uploadedDocs
  },

  // Create transaction
  async createTransaction(transactionData: CreateTransactionDTO): Promise<Transaction> {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      // Upload documents if any
      let documents: any[] = []
      if (transactionData.documents && transactionData.documents.length > 0) {
        documents = await transactionService.uploadDocuments(transactionData.documents)
      }

      const {
        documents: _,
        approvalStatus,
        categoryId,
        facilityId,
        vendorCustomerId,
        departmentId,
        projectId,
        transactionNumber,
        paymentMethod,
        receiptUrl,
        title, // Destructure title to exclude it from rest
        exchangeRate,
        amountInBaseCurrency,
        ...rest
      } = transactionData

      // Currency validation and auto-calculation
      let finalExchangeRate = exchangeRate
      let finalAmountInTry = amountInBaseCurrency

      if (transactionData.currency && transactionData.currency !== 'TRY') {
        // For non-TRY currencies, ensure we have exchange rate and TRY equivalent
        if (!finalExchangeRate || finalExchangeRate <= 0) {
          // If no exchange rate provided, log warning - ideally should fetch from API
          console.warn(`No valid exchange rate provided for ${transactionData.currency} transaction. Amount will be stored as-is.`)
          finalExchangeRate = 1
        }

        // Always recalculate TRY amount if exchangeRate > 1 and amountInTry seems wrong
        // (e.g., amountInTry was 0 or equals amount which doesn't make sense for foreign currency)
        if (!finalAmountInTry || finalAmountInTry <= 0 || (finalExchangeRate > 1 && finalAmountInTry <= transactionData.amount)) {
          // Calculate TRY equivalent
          finalAmountInTry = transactionData.amount * finalExchangeRate
          console.log(`Calculated TRY amount: ${transactionData.amount} ${transactionData.currency} × ${finalExchangeRate} = ${finalAmountInTry} TRY`)
        }
      } else {
        // For TRY transactions, amount_in_try equals amount
        finalExchangeRate = 1
        finalAmountInTry = transactionData.amount
      }

      // Helper to clean UUIDs - also filters out local default IDs that don't exist in DB
      const cleanId = (id?: string | null) => {
        if (!id) return null
        if (typeof id === 'string' && id.trim() === '') return null
        // Filter out local default UUIDs (they start with specific prefixes like a1b2c3d4-, b1b2c3d4-, etc.)
        if (typeof id === 'string' && /^[a-i]1b2c3d4-/.test(id)) return null
        return id
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...rest,
          category_id: cleanId(categoryId),
          facility_id: facilityId,
          vendor_customer_id: cleanId(vendorCustomerId),
          department_id: cleanId(departmentId),
          project_id: cleanId(projectId),
          transaction_number: transactionNumber ? transactionNumber : `TR-${Date.now()}`,
          payment_method: paymentMethod,
          receipt_url: receiptUrl,
          description: title ? `${title} - ${transactionData.description}` : transactionData.description,
          documents: documents,
          created_by: userId,
          approval_status: approvalStatus || 'pending',
          status: transactionData.status || 'draft',
          exchange_rate: finalExchangeRate,
          amount_in_try: finalAmountInTry
        })
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Create transaction error:', error)
      throw error
    }
  },

  // Update transaction
  async updateTransaction(transactionData: UpdateTransactionDTO): Promise<Transaction> {
    try {
      const {
        id,
        documents: newFiles,
        categoryId,
        facilityId,
        vendorCustomerId,
        departmentId,
        projectId,
        transactionNumber,
        paymentMethod,
        receiptUrl,
        title, // Destructure title to exclude it from updates
        exchangeRate,
        amountInBaseCurrency,
        ...updates
      } = transactionData

      // Handle new documents if any
      let documents: any[] = []
      if (newFiles && newFiles.length > 0) {
        const uploadedDocs = await transactionService.uploadDocuments(newFiles as File[])

        // Fetch existing documents to append
        const { data: existingTx } = await supabase
          .from('transactions')
          .select('documents')
          .eq('id', id)
          .single()

        const existingDocs = existingTx?.documents || []
        documents = [...existingDocs, ...uploadedDocs]
      }

      // Helper to clean UUIDs - also filters out local default IDs that don't exist in DB
      const cleanId = (id?: string | null) => {
        if (!id) return null
        if (typeof id === 'string' && id.trim() === '') return null
        // Filter out local default UUIDs (they start with specific prefixes like a1b2c3d4-, b1b2c3d4-, etc.)
        if (typeof id === 'string' && /^[a-i]1b2c3d4-/.test(id)) return null
        return id
      }

      const updateData: any = {
        ...updates,
        category_id: cleanId(categoryId),
        facility_id: facilityId,
        vendor_customer_id: cleanId(vendorCustomerId),
        department_id: cleanId(departmentId),
        project_id: cleanId(projectId),
        transaction_number: transactionNumber,
        payment_method: paymentMethod,
        receipt_url: receiptUrl,
        updated_at: new Date().toISOString(),
        exchange_rate: exchangeRate,
        amount_in_try: amountInBaseCurrency
      }

      if (documents.length > 0) {
        updateData.documents = documents
      }

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key])

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Update transaction error:', error)
      throw error
    }
  },

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    try {
      // Simple delete - only for rejected transactions
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Delete transaction error:', error)
        throw error
      }
    } catch (error) {
      console.error('Delete transaction error:', error)
      throw error
    }
  },

  // Bulk actions
  async bulkApprove(ids: string[]): Promise<void> {
    try {
      // Process each transaction individually to trigger side effects
      // This is less efficient but ensures consistency with single approve logic
      await Promise.all(ids.map(id => this.approveTransaction(id, 'Toplu Onay')))
    } catch (error) {
      console.error('Bulk approve error:', error)
      throw error
    }
  },

  async bulkReject(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map(id => this.rejectTransaction(id, 'Toplu Red')))
    } catch (error) {
      console.error('Bulk reject error:', error)
      throw error
    }
  },

  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map(id => this.deleteTransaction(id)))
    } catch (error) {
      console.error('Bulk delete error:', error)
      throw error
    }
  },

  // Single approve/reject
  async approveTransaction(id: string, note: string): Promise<Transaction> {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      // 1. Get the transaction first to check for project link
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // 2. Update transaction status
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'approved',
          approval_status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          notes: note
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error

      // 3. Handle Project Updates
      if (transaction.project_id && transaction.status !== 'approved') {
        const { projectService } = await import('@/services/projects/projectService')

        // Update Financials
        if (transaction.type === 'expense') {
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('spent')
            .eq('id', transaction.project_id)
            .single()

          if (!projectError && project) {
            const currentSpent = project.spent || 0
            const newSpent = currentSpent + transaction.amount

            await supabase
              .from('projects')
              .update({ spent: newSpent })
              .eq('id', transaction.project_id)
          }
        } else if (transaction.type === 'income') {
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('collected')
            .eq('id', transaction.project_id)
            .single()

          if (!projectError && project) {
            const currentCollected = project.collected || 0
            const newCollected = currentCollected + transaction.amount

            await supabase
              .from('projects')
              .update({ collected: newCollected })
              .eq('id', transaction.project_id)
          }
        }

        // Copy Documents if Amount > 10,000 TL
        if (transaction.amount > 10000 && transaction.documents && transaction.documents.length > 0) {
          const projectDocs = transaction.documents.map((doc: any) => ({
            project_id: transaction.project_id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            upload_date: new Date().toISOString(),
            uploaded_by: userId,
            category: 'contracts', // Default category for financial docs
            url: doc.url
          }))

          const { error: docError } = await supabase
            .from('project_documents')
            .insert(projectDocs)

          if (docError) {
            console.error('Failed to copy documents to project:', docError)
            // Non-blocking error
          }
        }

        // Log Activity
        await projectService.logActivity(
          transaction.project_id,
          'status_changed', // Using existing enum value
          `İşlem Onaylandı: ${transaction.amount} ${transaction.currency} - ${transaction.description || 'İsimsiz İşlem'}`
        )
      }

      return data
    } catch (error) {
      console.error('Approve transaction error:', error)
      throw error
    }
  },

  async rejectTransaction(id: string, note: string): Promise<Transaction> {
    try {
      // Get transaction for project link
      const { data: transaction } = await supabase
        .from('transactions')
        .select('project_id, amount, currency, description')
        .eq('id', id)
        .single()

      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          approval_status: 'rejected',
          notes: note
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error

      // Log Activity for Rejection
      if (transaction?.project_id) {
        const { projectService } = await import('@/services/projects/projectService')
        await projectService.logActivity(
          transaction.project_id,
          'status_changed',
          `İşlem Reddedildi: ${transaction.amount} ${transaction.currency} - ${transaction.description || 'İsimsiz İşlem'}. Sebep: ${note}`
        )
      }

      return data
    } catch (error) {
      console.error('Reject transaction error:', error)
      throw error
    }
  },

  // Get statistics
  async getStatistics(filters?: TransactionFilters): Promise<{
    totalIncome: number
    totalExpense: number
    budgetFromHQ: number
    netAmount: number
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    draftCount: number
    incomeTrend: number
    expenseTrend: number
  }> {
    try {
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

      // Base query for all time stats
      let query = supabase.from('transactions').select('type, amount, amount_in_try, status, date, description')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        totalIncome: 0,
        totalExpense: 0,
        budgetFromHQ: 0,
        netAmount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        draftCount: 0,
        incomeTrend: 0,
        expenseTrend: 0
      }

      let currentMonthIncome = 0
      let currentMonthExpense = 0
      let prevMonthIncome = 0
      let prevMonthExpense = 0

      data?.forEach(t => {
        // Use amount_in_try if available, otherwise fallback to amount (though backfill should prevent this)
        const amount = Number(t.amount_in_try || t.amount)

        // Count all statuses for status counts
        if (t.status === 'pending') stats.pendingCount++
        if (t.status === 'approved') stats.approvedCount++
        if (t.status === 'rejected') stats.rejectedCount++
        if (t.status === 'draft') stats.draftCount++

        // Only count APPROVED transactions for financial totals (exclude draft, pending, rejected)
        if (t.status === 'approved') {
          if (t.type === 'income') {
            // Separate budget transfers from HQ
            if (t.description?.includes('Genel Merkez Bütçe Aktarımı') || t.description?.includes('Bütçe Aktarımı')) {
              stats.budgetFromHQ += amount
            } else {
              stats.totalIncome += amount
            }
          }
          if (t.type === 'expense') {
            stats.totalExpense += amount
          }

          // Trend stats - only approved transactions, excluding budget transfers
          if (t.date >= currentMonthStart && t.date <= currentMonthEnd) {
            if (t.type === 'income' && !t.description?.includes('Bütçe Aktarımı')) currentMonthIncome += amount
            if (t.type === 'expense') currentMonthExpense += amount
          } else if (t.date >= prevMonthStart && t.date <= prevMonthEnd) {
            if (t.type === 'income' && !t.description?.includes('Bütçe Aktarımı')) prevMonthIncome += amount
            if (t.type === 'expense') prevMonthExpense += amount
          }
        }
      })

      stats.netAmount = (stats.totalIncome + stats.budgetFromHQ) - stats.totalExpense

      // Calculate trends
      stats.incomeTrend = prevMonthIncome === 0
        ? (currentMonthIncome > 0 ? 100 : 0)
        : ((currentMonthIncome - prevMonthIncome) / prevMonthIncome) * 100

      stats.expenseTrend = prevMonthExpense === 0
        ? (currentMonthExpense > 0 ? 100 : 0)
        : ((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * 100

      return stats
    } catch (error) {
      console.error('Get statistics error:', error)
      return {
        totalIncome: 0,
        totalExpense: 0,
        budgetFromHQ: 0,
        netAmount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        draftCount: 0,
        incomeTrend: 0,
        expenseTrend: 0
      }
    }
  },

  // Get upcoming payments (pending expenses and payrolls)
  async getUpcomingPayments(facilityId?: string): Promise<any[]> {
    try {
      // 1. Get pending transactions
      let txQuery = supabase
        .from('transactions')
        .select('*, vendors_customers(name)')
        .eq('type', 'expense')
        .eq('status', 'pending')
        .order('date', { ascending: true })
        .limit(5)

      if (facilityId) {
        txQuery = txQuery.eq('facility_id', facilityId)
      }

      // 2. Get pending payrolls (excluding cancelled and inactive employees)
      let payrollQuery = supabase
        .from('payrolls')
        .select('*, employees!inner(first_name, last_name, status, email)')
        .neq('status', 'paid') // Fetch draft or approved (pending payment)
        .neq('status', 'cancelled') // Exclude cancelled payrolls
        .eq('employees.status', 'active') // Only active employees
        .not('employees.email', 'like', '%_deleted_%') // Exclude deleted employees
        .order('period', { ascending: true }) // Payrolls usually have period/payment_date
        .limit(5)

      if (facilityId) {
        payrollQuery = payrollQuery.eq('facility_id', facilityId)
      }

      const [txRes, payrollRes] = await Promise.all([txQuery, payrollQuery])

      if (txRes.error) throw txRes.error
      if (payrollRes.error) throw payrollRes.error

      // 3. Map payrolls to transaction-like structure
      const payrolls = (payrollRes.data || []).map(p => ({
        id: p.id,
        description: `Maaş Ödemesi - ${p.employees?.first_name} ${p.employees?.last_name}`,
        amount: p.net_salary,
        date: p.payment_date || p.period + '-15', // Fallback to 15th of period if no date
        status: 'pending',
        type: 'expense',
        vendors_customers: { name: `${p.employees?.first_name} ${p.employees?.last_name}` },
        isPayroll: true
      }))

      // 4. Combine and sort
      const combined = [...(txRes.data || []), ...payrolls]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)

      return combined
    } catch (error) {
      console.error('Get upcoming payments error:', error)
      return []
    }
  }
}
