import { supabase } from '@/lib/supabase'
import type { ChartAccount } from '@/types/finance'

function buildAccountTree(accounts: ChartAccount[]): ChartAccount[] {
  const accountMap = new Map<string, ChartAccount>()
  const rootAccounts: ChartAccount[] = []

  // Create map and initialize children array
  accounts.forEach(acc => {
    accountMap.set(acc.id, { ...acc, children: [] })
  })

  // Build tree
  accounts.forEach(acc => {
    const account = accountMap.get(acc.id)!
    if (acc.parentId) {
      const parent = accountMap.get(acc.parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(account)
      }
    } else {
      rootAccounts.push(account)
    }
  })

  return rootAccounts
}

export const chartOfAccountsService = {
  async getAccounts(facilityId?: string): Promise<ChartAccount[]> {
    try {
      let query = supabase.from('chart_of_accounts').select('*')

      if (facilityId) {
        query = query.eq('facility_id', facilityId)
      }

      const { data, error } = await query.order('code', { ascending: true })

      if (error) throw error

      // Convert snake_case to camelCase if needed, but Supabase returns as is.
      // We need to map DB fields to ChartAccount interface if they differ.
      // Assuming DB fields match interface or we map them.
      // DB: parent_id, facility_id, is_active
      // Interface: parentId, facilityId, isActive

      const accounts = (data || []).map((acc: any) => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parentId: acc.parent_id,
        level: acc.level,
        isActive: acc.is_active,
        balance: acc.balance,
        currency: acc.currency,
        description: acc.description,
        facilityId: acc.facility_id
      })) as ChartAccount[]

      return buildAccountTree(accounts)
    } catch (error) {
      console.error('Get accounts error:', error)
      return []
    }
  },

  async getAccountById(id: string): Promise<ChartAccount | undefined> {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return {
        id: data.id,
        code: data.code,
        name: data.name,
        type: data.type,
        parentId: data.parent_id,
        level: data.level,
        isActive: data.is_active,
        balance: data.balance,
        currency: data.currency,
        description: data.description,
        facilityId: data.facility_id
      } as ChartAccount
    } catch (error) {
      console.error('Get account error:', error)
      return undefined
    }
  },

  async createAccount(data: Partial<ChartAccount>): Promise<ChartAccount> {
    try {
      // Validate code uniqueness
      if (data.code) {
        const { data: existing } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('code', data.code)
          .eq('facility_id', data.facilityId)
          .single()

        if (existing) {
          throw new Error('Bu hesap kodu zaten kullanılıyor')
        }
      }

      const dbData = {
        code: data.code,
        name: data.name,
        type: data.type,
        parent_id: data.parentId,
        level: data.level,
        is_active: data.isActive,
        // balance: data.balance, // Removed as it's not in DB
        currency: data.currency,
        description: data.description,
        facility_id: data.facilityId
      }

      const { data: newAccount, error } = await supabase
        .from('chart_of_accounts')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      return {
        id: newAccount.id,
        code: newAccount.code,
        name: newAccount.name,
        type: newAccount.type,
        parentId: newAccount.parent_id,
        level: newAccount.level,
        isActive: newAccount.is_active,
        balance: 0, // Default to 0 as we don't store it
        currency: newAccount.currency,
        description: newAccount.description,
        facilityId: newAccount.facility_id
      } as ChartAccount
    } catch (error) {
      console.error('Create account error:', error)
      throw error
    }
  },

  async updateAccount(id: string, data: Partial<ChartAccount>): Promise<ChartAccount> {
    try {
      // Validate code uniqueness if changed
      if (data.code) {
        const { data: existing } = await supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('code', data.code)
          .eq('facility_id', data.facilityId) // Assuming facilityId is passed or we should fetch it
          .neq('id', id)
          .single()

        if (existing) {
          throw new Error('Bu hesap kodu başka bir hesap tarafından kullanılıyor')
        }
      }

      const dbUpdates: any = {}
      if (data.code !== undefined) dbUpdates.code = data.code
      if (data.name !== undefined) dbUpdates.name = data.name
      if (data.type !== undefined) dbUpdates.type = data.type
      if (data.parentId !== undefined) dbUpdates.parent_id = data.parentId
      if (data.level !== undefined) dbUpdates.level = data.level
      if (data.isActive !== undefined) dbUpdates.is_active = data.isActive
      // if (data.balance !== undefined) dbUpdates.balance = data.balance // Removed
      if (data.currency !== undefined) dbUpdates.currency = data.currency
      if (data.description !== undefined) dbUpdates.description = data.description
      // facility_id usually doesn't change

      const { data: updatedAccount, error } = await supabase
        .from('chart_of_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        id: updatedAccount.id,
        code: updatedAccount.code,
        name: updatedAccount.name,
        type: updatedAccount.type,
        parentId: updatedAccount.parent_id,
        level: updatedAccount.level,
        isActive: updatedAccount.is_active,
        balance: updatedAccount.balance,
        currency: updatedAccount.currency,
        description: updatedAccount.description,
        facilityId: updatedAccount.facility_id
      } as ChartAccount
    } catch (error) {
      console.error('Update account error:', error)
      throw error
    }
  },

  async deleteAccount(id: string): Promise<void> {
    try {
      // Check for children
      const { count } = await supabase
        .from('chart_of_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', id)

      if (count && count > 0) {
        throw new Error('Cannot delete account with children')
      }

      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete account error:', error)
      throw error
    }
  },

  async getAllAccountsFlat(facilityId?: string): Promise<ChartAccount[]> {
    try {
      let query = supabase.from('chart_of_accounts').select('*')

      if (facilityId) {
        query = query.eq('facility_id', facilityId)
      }

      const { data, error } = await query.order('code', { ascending: true })

      if (error) throw error

      return (data || []).map((acc: any) => ({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parentId: acc.parent_id,
        level: acc.level,
        isActive: acc.is_active,
        balance: acc.balance,
        currency: acc.currency,
        description: acc.description,
        facilityId: acc.facility_id
      })) as ChartAccount[]
    } catch (error) {
      console.error('Get flat accounts error:', error)
      return []
    }
  }
}
