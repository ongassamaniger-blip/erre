import type { ApprovalRequest, ApprovalStats, ApprovalModule, ApprovalPriority } from '@/types'
import { transactionService } from './finance/transactionService'
import { budgetService } from './finance/budgetService'
import { vendorsCustomersService } from './finance/vendorsCustomersService'
import { campaignService } from './qurban/qurbanService'
import { budgetTransferService } from './finance/budgetTransferService'
import { supabase } from '@/lib/supabase'

export const approvalService = {
  async getApprovals(filters?: {
    module?: string
    status?: string
    priority?: string
    startDate?: string
    endDate?: string
    facilityId?: string
  }): Promise<ApprovalRequest[]> {
    try {
      let allApprovals: ApprovalRequest[] = []

      // 1. Fetch Transactions (Finance Module)
      if (!filters?.module || filters.module === 'all' || filters.module === 'finance') {
        const transactionFilters: any = {
          status: filters?.status === 'all' ? undefined : (filters?.status as any || 'pending'),
          facilityId: filters?.facilityId
        }

        const response = await transactionService.getTransactions(transactionFilters, { page: 1, pageSize: 100 })
        const transactions = response.data

        const financeApprovals: ApprovalRequest[] = transactions.map(t => {
          // Use TRY amount for display, with original currency as secondary info
          const amountInTry = t.amountInBaseCurrency || t.amount
          const exchangeRate = t.exchangeRate || 1

          // Build description with original currency info
          const description = t.currency !== 'TRY' && t.exchangeRate && t.exchangeRate > 1
            ? `${t.description || ''} (${t.amount} ${t.currency} @ ${exchangeRate.toFixed(2)})`
            : t.description || ''

          return {
            id: t.id,
            module: 'finance' as ApprovalModule,
            type: t.type === 'income' ? 'Gelir' : t.type === 'expense' ? 'Gider' : 'Virman',
            title: t.title || 'İsimsiz İşlem',
            description,
            amount: amountInTry, // Always show TRY amount
            currency: 'TRY', // Always TRY for display
            exchangeRate: exchangeRate,
            amountInTry: amountInTry,
            requestedBy: {
              id: t.createdBy || 'unknown',
              name: t.createdBy || 'Kullanıcı',
              avatar: undefined
            },
            requestedAt: t.date,
            status: t.status as any,
            priority: 'medium' as ApprovalPriority,
            metadata: { ...t, originalAmount: t.amount, originalCurrency: t.currency },
            facilityId: t.facilityId,
            relatedEntityId: t.id,
            history: []
          }
        })
        allApprovals = [...allApprovals, ...financeApprovals]

        // Fetch Budgets
        const budgetFilters: any = {
          status: filters?.status === 'all' ? undefined : (filters?.status || 'pending'),
          facilityId: filters?.facilityId
        }
        const budgetResponse = await budgetService.getBudgets(budgetFilters, { page: 1, pageSize: 100 })
        const budgets = budgetResponse.data

        const budgetApprovals: ApprovalRequest[] = budgets.map(b => ({
          id: b.id,
          module: 'finance' as ApprovalModule,
          type: 'Bütçe',
          title: b.name,
          description: `${b.year} yılı ${b.period === 'yearly' ? 'Yıllık' : b.period} bütçesi`,
          amount: b.amount,
          currency: b.currency,
          requestedBy: {
            id: 'unknown',
            name: 'Sistem',
            avatar: undefined
          },
          requestedAt: b.createdAt || new Date().toISOString(),
          status: b.status === 'draft' ? 'pending' : b.status as any,
          priority: 'high' as ApprovalPriority,
          metadata: { ...b, isBudget: true },
          facilityId: b.facilityId,
          relatedEntityId: b.id,
          deadline: b.startDate,
          history: []
        }))
        allApprovals = [...allApprovals, ...budgetApprovals]

        // Fetch Pending Vendors/Customers
        const vcFilters: any = {
          status: filters?.status === 'all' ? undefined : (filters?.status as any || 'pending'),
          facilityId: filters?.facilityId
        }

        const targetStatus = filters?.status === 'all' ? undefined : (filters?.status || 'pending');
        const vcFiltersToUse = { ...vcFilters };
        if (targetStatus) {
          vcFiltersToUse.status = targetStatus as any;
        } else {
          delete vcFiltersToUse.status;
        }

        const pendingVCs = await vendorsCustomersService.getVendorsCustomers(vcFiltersToUse);

        const vcApprovals: ApprovalRequest[] = pendingVCs.map(vc => ({
          id: vc.id,
          module: 'finance' as ApprovalModule,
          type: vc.type === 'vendor' ? 'Tedarikçi Kaydı' : 'Müşteri Kaydı',
          title: vc.name,
          description: `${vc.type === 'vendor' ? 'Yeni tedarikçi' : 'Yeni müşteri'} kaydı onayı`,
          amount: 0,
          currency: 'TRY',
          requestedBy: {
            id: 'unknown',
            name: 'Kullanıcı',
            avatar: undefined
          },
          requestedAt: new Date().toISOString(),
          status: vc.status as any,
          priority: 'medium' as ApprovalPriority,
          metadata: { ...vc, isVendorCustomer: true },
          facilityId: vc.facility_id,
          relatedEntityId: vc.id,
          history: []
        }));
        allApprovals = [...allApprovals, ...vcApprovals];

        // Fetch Pending Budget Transfers
        const btFilters: any = {
          status: filters?.status === 'all' ? undefined : (filters?.status as any || 'pending'),
        }

        const transfers = await budgetTransferService.getBudgetTransfers(btFilters)

        const btApprovals: ApprovalRequest[] = transfers.map(t => {
          // TRY tutarını hesapla
          const amountInTry = t.amountInTry || t.amount
          const exchangeRate = t.exchangeRate || 1

          // Açıklamada TRY tutarını göster
          const description = t.currency !== 'TRY'
            ? `${amountInTry.toLocaleString('tr-TR')} TRY (${t.amount} ${t.currency} @ ${exchangeRate.toFixed(2)})`
            : `${t.amount.toLocaleString('tr-TR')} TRY bütçe aktarımı`

          return {
            id: t.id,
            module: 'finance' as ApprovalModule,
            type: 'budget_transfer',
            title: 'Bütçe Aktarımı',
            description,
            amount: amountInTry, // TRY tutarını kullan
            currency: 'TRY', // Her zaman TRY göster
            exchangeRate: exchangeRate,
            amountInTry: amountInTry,
            requestedBy: {
              id: 'unknown',
              name: 'Genel Merkez',
              avatar: undefined
            },
            requestedAt: t.createdAt || new Date().toISOString(),
            status: t.status as any,
            priority: 'high' as ApprovalPriority,
            metadata: { ...t, isBudgetTransfer: true, originalAmount: t.amount, originalCurrency: t.currency },
            facilityId: t.fromFacilityId,
            relatedEntityId: t.id,
            history: []
          }
        })
        allApprovals = [...allApprovals, ...btApprovals]
      }

      // Fetch Pending Qurban Campaigns
      if (!filters?.module || filters?.module === 'all' || filters?.module === 'qurban') {
        let targetStatus = filters?.status

        if (targetStatus === 'pending') {
          targetStatus = 'pending_approval'
        }

        const campaignFilters: any = {
          status: (targetStatus === 'all' || targetStatus === undefined) ? undefined : targetStatus,
          facilityId: filters?.facilityId
        }

        if (campaignFilters.status === 'pending_approval' || !campaignFilters.status) {
          const fetchFilters = { ...campaignFilters }
          if (campaignFilters.status === 'pending_approval') {
            fetchFilters.status = 'pending_approval'
          }

          const campaigns = await campaignService.getCampaigns(fetchFilters)

          const campaignApprovals: ApprovalRequest[] = campaigns.map(c => ({
            id: c.id,
            module: 'qurban' as ApprovalModule,
            type: 'Kurban Kampanyası',
            title: c.name,
            description: `${c.year} yılı kurban kampanyası onayı`,
            amount: c.targetAmount,
            currency: c.currency,
            requestedBy: {
              id: 'unknown',
              name: 'Kullanıcı',
              avatar: undefined
            },
            requestedAt: new Date().toISOString(),
            status: c.status === 'pending_approval' ? 'pending' : (c.status === 'active' ? 'approved' : c.status) as any,
            priority: 'medium' as ApprovalPriority,
            metadata: { ...c, isCampaign: true },
            facilityId: c.facilityId,
            relatedEntityId: c.id,
            history: []
          }))
          allApprovals = [...allApprovals, ...campaignApprovals]
        }
      }

      // Client-side filtering
      if (filters?.startDate) {
        allApprovals = allApprovals.filter(a => new Date(a.requestedAt) >= new Date(filters.startDate!))
      }
      if (filters?.endDate) {
        allApprovals = allApprovals.filter(a => new Date(a.requestedAt) <= new Date(filters.endDate!))
      }
      if (filters?.priority && filters.priority !== 'all') {
        allApprovals = allApprovals.filter(a => a.priority === filters.priority)
      }

      return allApprovals.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    } catch (error) {
      console.error('Get approvals error:', error)
      return []
    }
  },

  async getApprovalById(id: string): Promise<ApprovalRequest | null> {
    try {
      // Try transaction
      const transaction = await transactionService.getTransactionById(id)
      if (transaction) {
        return {
          id: transaction.id,
          module: 'finance',
          type: transaction.type === 'income' ? 'Gelir' : transaction.type === 'expense' ? 'Gider' : 'Virman',
          title: transaction.title,
          description: transaction.description,
          amount: transaction.amount,
          currency: transaction.currency,
          requestedBy: {
            id: transaction.createdBy,
            name: transaction.createdBy,
            avatar: undefined
          },
          requestedAt: transaction.date,
          status: transaction.status as any,
          priority: 'medium',
          metadata: { ...transaction },
          facilityId: transaction.facilityId,
          relatedEntityId: transaction.id,
          history: []
        }
      }

      // Try budget
      const budget = await budgetService.getBudgetById(id)
      if (budget) {
        return {
          id: budget.id,
          module: 'finance',
          type: 'Bütçe',
          title: budget.name,
          description: `${budget.year} yılı bütçesi`,
          amount: budget.amount,
          currency: budget.currency,
          requestedBy: {
            id: 'unknown',
            name: 'Sistem',
            avatar: undefined
          },
          requestedAt: budget.createdAt || new Date().toISOString(),
          status: budget.status === 'draft' ? 'pending' : budget.status as any,
          priority: 'high',
          metadata: { ...budget, isBudget: true },
          facilityId: budget.facilityId,
          relatedEntityId: budget.id,
          deadline: budget.startDate,
          history: []
        }
      }

      // Try Vendor/Customer
      const vc = await vendorsCustomersService.getVendorCustomerById(id)
      if (vc) {
        return {
          id: vc.id,
          module: 'finance',
          type: vc.type === 'vendor' ? 'Tedarikçi Kaydı' : 'Müşteri Kaydı',
          title: vc.name,
          description: `${vc.type === 'vendor' ? 'Yeni tedarikçi' : 'Yeni müşteri'} kaydı onayı`,
          amount: 0,
          currency: 'TRY',
          requestedBy: {
            id: 'unknown',
            name: 'Kullanıcı',
            avatar: undefined
          },
          requestedAt: new Date().toISOString(),
          status: vc.status as any,
          priority: 'medium',
          metadata: { ...vc, isVendorCustomer: true },
          facilityId: vc.facility_id,
          relatedEntityId: vc.id,
          history: []
        }
      }

      // Try Qurban Campaign
      const campaign = await campaignService.getCampaignById(id)
      if (campaign) {
        return {
          id: campaign.id,
          module: 'qurban',
          type: 'Kurban Kampanyası',
          title: campaign.name,
          description: `${campaign.year} yılı kurban kampanyası onayı`,
          amount: campaign.targetAmount,
          currency: campaign.currency,
          requestedBy: {
            id: 'unknown',
            name: 'Kullanıcı',
            avatar: undefined
          },
          requestedAt: new Date().toISOString(),
          status: campaign.status === 'pending_approval' ? 'pending' : campaign.status as any,
          priority: 'high',
          metadata: { ...campaign, isCampaign: true },
          facilityId: campaign.facilityId,
          relatedEntityId: campaign.id,
          history: []
        }
      }

      // Try Budget Transfer
      const transfer = await budgetTransferService.getBudgetTransferById(id)
      if (transfer) {
        return {
          id: transfer.id,
          module: 'finance',
          type: 'Bütçe Aktarımı',
          title: 'Bütçe Aktarımı',
          description: `${transfer.amount} ${transfer.currency} tutarında bütçe aktarımı`,
          amount: transfer.amount,
          currency: transfer.currency,
          requestedBy: {
            id: 'unknown',
            name: 'Genel Merkez',
            avatar: undefined
          },
          requestedAt: transfer.createdAt || new Date().toISOString(),
          status: transfer.status as any,
          priority: 'high',
          metadata: { ...transfer, isBudgetTransfer: true },
          facilityId: transfer.fromFacilityId,
          relatedEntityId: transfer.id,
          history: []
        }
      }

    } catch (e) {
      // Not found
    }
    return null
  },

  async getStats(facilityId?: string): Promise<ApprovalStats> {
    try {
      // Transactions
      let pendingTrans = supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      let approvedTrans = supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'approved')
      let rejectedTrans = supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'rejected')

      // Budgets (draft = pending)
      let pendingBudgets = supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      let approvedBudgets = supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('status', 'active')
      let rejectedBudgets = supabase.from('budgets').select('*', { count: 'exact', head: true }).eq('status', 'cancelled')

      // Vendors/Customers
      let pendingVC = supabase.from('vendors_customers').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      let approvedVC = supabase.from('vendors_customers').select('*', { count: 'exact', head: true }).eq('status', 'approved')
      let rejectedVC = supabase.from('vendors_customers').select('*', { count: 'exact', head: true }).eq('status', 'rejected')

      // Qurban Campaigns
      let pendingCampaigns = supabase.from('qurban_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval')
      let approvedCampaigns = supabase.from('qurban_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active')
      let rejectedCampaigns = supabase.from('qurban_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'rejected')

      // Budget Transfers
      let pendingBT = supabase.from('budget_transfers').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      let approvedBT = supabase.from('budget_transfers').select('*', { count: 'exact', head: true }).eq('status', 'completed')
      let rejectedBT = supabase.from('budget_transfers').select('*', { count: 'exact', head: true }).eq('status', 'rejected')

      if (facilityId) {
        pendingTrans = pendingTrans.eq('facility_id', facilityId)
        approvedTrans = approvedTrans.eq('facility_id', facilityId)
        rejectedTrans = rejectedTrans.eq('facility_id', facilityId)
        pendingBudgets = pendingBudgets.eq('facility_id', facilityId)
        approvedBudgets = approvedBudgets.eq('facility_id', facilityId)
        rejectedBudgets = rejectedBudgets.eq('facility_id', facilityId)
        pendingVC = pendingVC.eq('facility_id', facilityId)
        approvedVC = approvedVC.eq('facility_id', facilityId)
        rejectedVC = rejectedVC.eq('facility_id', facilityId)
        pendingCampaigns = pendingCampaigns.eq('facility_id', facilityId)
        approvedCampaigns = approvedCampaigns.eq('facility_id', facilityId)
        rejectedCampaigns = rejectedCampaigns.eq('facility_id', facilityId)
      }

      const [pT, aT, rT, pB, aB, rB, pVC, aVC, rVC, pC, aC, rC, pBT, aBT, rBT] = await Promise.all([
        pendingTrans, approvedTrans, rejectedTrans,
        pendingBudgets, approvedBudgets, rejectedBudgets,
        pendingVC, approvedVC, rejectedVC,
        pendingCampaigns, approvedCampaigns, rejectedCampaigns,
        pendingBT, approvedBT, rejectedBT
      ])

      return {
        pending: (pT.count || 0) + (pB.count || 0) + (pVC.count || 0) + (pC.count || 0) + (pBT.count || 0),
        approved: (aT.count || 0) + (aB.count || 0) + (aVC.count || 0) + (aC.count || 0) + (aBT.count || 0),
        rejected: (rT.count || 0) + (rB.count || 0) + (rVC.count || 0) + (rC.count || 0) + (rBT.count || 0),
        urgent: 0
      }
    } catch (error) {
      console.error('Get stats error:', error)
      return { pending: 0, approved: 0, rejected: 0, urgent: 0 }
    }
  },

  async approveRequest(id: string, comment?: string): Promise<void> {
    try {
      const budget = await budgetService.getBudgetById(id)
      if (budget) {
        await budgetService.approveBudget(id)
        return
      }
    } catch (e) { }

    try {
      const vc = await vendorsCustomersService.getVendorCustomerById(id)
      if (vc) {
        await vendorsCustomersService.approveVendorCustomer(id)
        return
      }
    } catch (e) { }

    try {
      const campaign = await campaignService.getCampaignById(id)
      if (campaign) {
        await campaignService.approveCampaign(id)
        return
      }
    } catch (e) { }

    try {
      const transfer = await budgetTransferService.getBudgetTransferById(id)
      if (transfer) {
        const { data: { user } } = await supabase.auth.getUser()
        await budgetTransferService.approveBudgetTransfer(id, user?.id || 'system')
        return
      }
    } catch (e) { }

    await transactionService.approveTransaction(id, comment || '')
  },

  async rejectRequest(id: string, comment: string): Promise<void> {
    try {
      const budget = await budgetService.getBudgetById(id)
      if (budget) {
        await budgetService.rejectBudget(id)
        return
      }
    } catch (e) { }

    try {
      const vc = await vendorsCustomersService.getVendorCustomerById(id)
      if (vc) {
        await vendorsCustomersService.rejectVendorCustomer(id)
        return
      }
    } catch (e) { }

    try {
      const campaign = await campaignService.getCampaignById(id)
      if (campaign) {
        await campaignService.rejectCampaign(id)
        return
      }
    } catch (e) { }

    try {
      const transfer = await budgetTransferService.getBudgetTransferById(id)
      if (transfer) {
        const { data: { user } } = await supabase.auth.getUser()
        await budgetTransferService.rejectBudgetTransfer(id, comment, user?.id || 'system')
        return
      }
    } catch (e) { }

    await transactionService.rejectTransaction(id, comment)
  },

  async bulkApprove(ids: string[], comment?: string): Promise<void> {
    await Promise.all(ids.map(id => this.approveRequest(id, comment)))
  },

  async bulkReject(ids: string[], comment: string): Promise<void> {
    await Promise.all(ids.map(id => this.rejectRequest(id, comment)))
  }
}
