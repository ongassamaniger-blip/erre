import { supabase } from '@/lib/supabase'
import type {
  BudgetTransfer,
  BudgetTransferRequest,
  BudgetTransferFilters,
} from '@/types/finance'
import { transactionService } from './transactionService'

export const budgetTransferService = {
  // Helper to get headquarters facility ID dynamically
  async getHeadquartersFacilityId(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id')
        .eq('is_headquarters', true)
        .single()

      if (error || !data) {
        console.warn('Headquarters facility not found, using fallback')
        return 'facility-000' // Fallback value
      }
      return data.id
    } catch {
      return 'facility-000' // Fallback value
    }
  },

  async createBudgetTransfer(
    request: BudgetTransferRequest & { exchangeRate?: number; amountInTry?: number },
    fromFacilityId?: string
  ): Promise<BudgetTransfer> {
    try {
      // Get headquarters facility ID if not provided
      const sourceFacilityId = fromFacilityId || await this.getHeadquartersFacilityId()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      // Calculate TRY amount if not provided
      const exchangeRate = request.exchangeRate || 1
      const amountInTry = request.amountInTry || (request.amount * exchangeRate)

      const transferData = {
        from_facility_id: sourceFacilityId,
        to_facility_id: request.toFacilityId,
        amount: request.amount, // Original amount in selected currency
        currency: request.currency,
        exchange_rate: exchangeRate, // Store the exchange rate used
        amount_in_try: amountInTry, // Store the TRY equivalent
        description: request.description,
        status: 'pending',
        transfer_date: request.transferDate || new Date().toISOString().split('T')[0],
        code: `BT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        created_by: userId
      }

      const { data, error } = await supabase
        .from('budget_transfers')
        .insert(transferData)
        .select()
        .single()

      if (error) throw error

      // Notify Approvers (Admins)
      try {
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'manager', 'headquarters'])

        if (admins && admins.length > 0) {
          // Show TRY equivalent in notification if foreign currency
          const amountText = request.currency !== 'TRY'
            ? `${request.amount} ${request.currency} (≈ ${amountInTry.toLocaleString('tr-TR')} TRY)`
            : `${request.amount} TRY`

          const notifications = admins.map(admin => ({
            user_id: admin.id,
            type: 'approval',
            title: 'Yeni Bütçe Aktarımı Talebi',
            message: `${amountText} tutarında yeni bir bütçe aktarımı onayı bekliyor.`,
            link: '/approvals',
            read: false,
            created_at: new Date().toISOString()
          }))

          await supabase.from('notifications').insert(notifications)
        }
      } catch (notifyError) {
        console.error('Notification error:', notifyError)
      }

      return this.mapToBudgetTransfer(data)
    } catch (error) {
      console.error('Create budget transfer error:', error)
      throw error
    }
  },

  async updateBudgetTransfer(
    id: string,
    updates: Partial<BudgetTransferRequest>
  ): Promise<BudgetTransfer> {
    try {
      const { data, error } = await supabase
        .from('budget_transfers')
        .update({
          to_facility_id: updates.toFacilityId,
          amount: updates.amount,
          currency: updates.currency,
          description: updates.description,
          transfer_date: updates.transferDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return this.mapToBudgetTransfer(data)
    } catch (error) {
      console.error('Update budget transfer error:', error)
      throw error
    }
  },

  async getBudgetTransfers(filters?: BudgetTransferFilters): Promise<BudgetTransfer[]> {
    try {
      let query = supabase.from('budget_transfers').select('*')

      if (filters?.fromFacilityId) {
        query = query.eq('from_facility_id', filters.fromFacilityId)
      }
      if (filters?.toFacilityId) {
        query = query.eq('to_facility_id', filters.toFacilityId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.dateFrom) {
        query = query.gte('transfer_date', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('transfer_date', filters.dateTo)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(this.mapToBudgetTransfer)
    } catch (error) {
      console.error('Get budget transfers error:', error)
      return []
    }
  },

  async getBudgetTransferById(id: string): Promise<BudgetTransfer | null> {
    try {
      const { data, error } = await supabase
        .from('budget_transfers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return this.mapToBudgetTransfer(data)
    } catch (error) {
      console.error('Get budget transfer error:', error)
      return null
    }
  },

  async approveBudgetTransfer(id: string, approvedBy: string): Promise<BudgetTransfer> {
    try {
      // 1. Get transfer details (with exchange rate info)
      const { data: transferData, error: fetchError } = await supabase
        .from('budget_transfers')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !transferData) throw new Error('Transfer not found')

      const transfer = this.mapToBudgetTransfer(transferData)
      const amountInTry = transferData.amount_in_try || transfer.amount
      const exchangeRate = transferData.exchange_rate || 1

      // 2. Find appropriate category (optional - don't block if not found)
      let categoryId: string | undefined
      try {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('type', 'income')
          .ilike('name', '%Bütçe%')
          .limit(1)
          .maybeSingle()

        categoryId = category?.id

        // Fallback to any income category
        if (!categoryId) {
          const { data: anyCategory } = await supabase
            .from('categories')
            .select('id')
            .eq('type', 'income')
            .limit(1)
            .maybeSingle()
          categoryId = anyCategory?.id
        }
      } catch (catError) {
        console.warn('Category lookup failed, proceeding without category:', catError)
      }

      // Don't throw - category is optional

      // 2.1 Find vendor/customer for the sending facility (to show as "Supplier")
      let vendorCustomerId = undefined
      if (transfer.fromFacilityId) {
        const { data: fromFacility } = await supabase
          .from('facilities')
          .select('name')
          .eq('id', transfer.fromFacilityId)
          .single()

        if (fromFacility?.name) {
          const { data: vendor } = await supabase
            .from('vendors_customers')
            .select('id')
            .ilike('name', fromFacility.name)
            .single()

          vendorCustomerId = vendor?.id
        }
      }

      // 3. Create transaction - ALWAYS use TRY amount for system consistency
      // Description includes original currency info for reference
      const description = transfer.currency !== 'TRY'
        ? `Genel Merkez Bütçe Aktarımı - ${transfer.code} (${transfer.amount} ${transfer.currency} @ ${exchangeRate.toFixed(4)})`
        : `Genel Merkez Bütçe Aktarımı - ${transfer.code}`

      await transactionService.createTransaction({
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        amount: amountInTry, // Use TRY amount for system consistency
        currency: 'TRY', // Always TRY for the transaction
        categoryId: categoryId as any, // Category is optional for budget transfers
        description,
        paymentMethod: 'bank_transfer',
        documents: [],
        status: 'approved',
        approvalStatus: 'approved',
        facilityId: transfer.toFacilityId,
        transactionNumber: transfer.code, // Use the transfer code as the transaction number
        vendorCustomerId: vendorCustomerId // Link to the sending facility if a vendor record exists
      })

      // 4. Update transfer status to completed
      const { data, error } = await supabase
        .from('budget_transfers')
        .update({
          status: 'completed', // Directly to completed
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Notify Requester
      try {
        if (data.created_by) {
          await supabase.from('notifications').insert({
            user_id: data.created_by,
            type: 'approved',
            title: 'Bütçe Aktarımı Onaylandı',
            message: `${transfer.code} kodlu bütçe aktarımı talebiniz onaylandı.`,
            link: '/finance/budget-transfers', // Adjust link
            read: false,
            created_at: new Date().toISOString()
          })
        }
      } catch (notifyError) {
        console.error('Notification error:', notifyError)
      }

      return this.mapToBudgetTransfer(data)
    } catch (error) {
      console.error('Approve budget transfer error:', error)
      throw error
    }
  },

  async rejectBudgetTransfer(id: string, reason?: string, rejectedBy?: string): Promise<BudgetTransfer> {
    try {
      let finalRejectedBy = rejectedBy
      if (!finalRejectedBy) {
        const { data: userData } = await supabase.auth.getUser()
        finalRejectedBy = userData.user?.id
      }

      if (!finalRejectedBy) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('budget_transfers')
        .update({
          status: 'rejected',
          rejected_by: finalRejectedBy,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Notify Requester
      try {
        if (data.created_by) {
          await supabase.from('notifications').insert({
            user_id: data.created_by,
            type: 'rejected',
            title: 'Bütçe Aktarımı Reddedildi',
            message: `${data.code} kodlu bütçe aktarımı talebiniz reddedildi. Sebep: ${reason || 'Belirtilmedi'}`,
            link: '/finance/budget-transfers',
            read: false,
            created_at: new Date().toISOString()
          })
        }
      } catch (notifyError) {
        console.error('Notification error:', notifyError)
      }

      return this.mapToBudgetTransfer(data)
    } catch (error) {
      console.error('Reject budget transfer error:', error)
      throw error
    }
  },

  async getTotalTransferredAmount(toFacilityId: string, status?: BudgetTransfer['status']): Promise<number> {
    try {
      let query = supabase.from('budget_transfers').select('amount')
        .eq('to_facility_id', toFacilityId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []).reduce((sum, t) => sum + Number(t.amount), 0)
    } catch (error) {
      console.error('Get total transferred amount error:', error)
      return 0
    }
  },

  mapToBudgetTransfer(data: any): BudgetTransfer {
    return {
      id: data.id,
      code: data.code,
      fromFacilityId: data.from_facility_id,
      toFacilityId: data.to_facility_id,
      amount: data.amount,
      currency: data.currency,
      exchangeRate: data.exchange_rate || 1,
      amountInTry: data.amount_in_try || data.amount,
      description: data.description,
      status: data.status,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      rejectedBy: data.rejected_by,
      rejectedAt: data.rejected_at,
      rejectionReason: data.rejection_reason,
      completedAt: data.completed_at,
      transferDate: data.transfer_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by
    }
  }
}
