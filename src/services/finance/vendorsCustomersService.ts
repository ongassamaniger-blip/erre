import { supabase } from '@/lib/supabase'
import type { VendorCustomer } from '@/types/finance'

export interface VendorCustomerFilters {
  type?: 'vendor' | 'customer'
  search?: string
  facilityId?: string
  isActive?: boolean
  status?: 'pending' | 'approved' | 'rejected' | 'archived'
}

// Helper to map app model to DB model
const toDb = (data: Partial<VendorCustomer>) => {
  const {
    taxNumber,
    contactPerson,
    isActive,
    notes, // Destructure to exclude from rest
    ...rest
  } = data

  const dbData: any = { ...rest }
  if (taxNumber !== undefined) dbData.tax_number = taxNumber
  if (contactPerson !== undefined) dbData.contact_person = contactPerson
  // We do NOT map isActive to is_active because the column does not exist.
  // isActive state is derived from status = 'archived'
  // notes column does not exist, so we exclude it.

  return dbData
}

// Helper to map DB model to app model
const fromDb = (data: any): VendorCustomer => {
  if (!data) return data
  return {
    ...data,
    taxNumber: data.tax_number,
    contactPerson: data.contact_person,
    isActive: data.status !== 'archived', // Derived property
    // notes: data.notes // Column does not exist
  }
}

export const vendorsCustomersService = {
  async getVendorsCustomers(filters?: VendorCustomerFilters): Promise<VendorCustomer[]> {
    try {
      let query = supabase.from('vendors_customers').select('*')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }

      // Handle isActive filter using status
      if (filters?.isActive !== undefined) {
        if (filters.isActive) {
          // Active means NOT archived - show all non-archived (pending, approved, etc.)
          query = query.neq('status', 'archived')
        } else {
          // Inactive (Quarantine) means archived
          query = query.eq('status', 'archived')
        }
      } else if (filters?.status) {
        // Explicit status filter provided
        query = query.eq('status', filters.status)
      } else {
        // No isActive or status filter - default to showing approved only
        query = query.eq('status', 'approved')
      }

      if (filters?.search) {
        const search = filters.search.toLowerCase()
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,tax_number.ilike.%${search}%`)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) throw error
      return (data || []).map(fromDb)
    } catch (error) {
      console.error('Get vendors/customers error:', error)
      return []
    }
  },

  async getVendorCustomerById(id: string): Promise<VendorCustomer | undefined> {
    try {
      const { data, error } = await supabase
        .from('vendors_customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return fromDb(data)
    } catch (error) {
      console.error('Get vendor/customer error:', error)
      return undefined
    }
  },

  async createVendorCustomer(data: Partial<VendorCustomer>): Promise<VendorCustomer> {
    try {
      const dbData = toDb(data)
      // Do NOT set is_active

      const { data: newVC, error } = await supabase
        .from('vendors_customers')
        .insert({ ...dbData, status: 'pending' })
        .select()
        .single()

      if (error) throw error
      return fromDb(newVC)
    } catch (error) {
      console.error('Create vendor/customer error:', error)
      throw error
    }
  },

  async updateVendorCustomer(id: string, data: Partial<VendorCustomer>): Promise<VendorCustomer> {
    try {
      const dbData = toDb(data)
      const { data: updatedVC, error } = await supabase
        .from('vendors_customers')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return fromDb(updatedVC)
    } catch (error) {
      console.error('Update vendor/customer error:', error)
      throw error
    }
  },

  async deleteVendorCustomer(id: string): Promise<void> {
    try {
      // Soft delete (Quarantine) -> Set status to 'archived'
      // This is a quarantine/archive operation, not a permanent delete.
      // Financial transactions can still reference this record.
      const { error } = await supabase
        .from('vendors_customers')
        .update({ status: 'archived' })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete (archive) vendor/customer error:', error)
      throw error
    }
  },

  async restoreVendorCustomer(id: string): Promise<void> {
    try {
      // Restore -> Set status to 'approved' (or pending, but usually approved if it was active)
      const { error } = await supabase
        .from('vendors_customers')
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Restore vendor/customer error:', error)
      throw error
    }
  },

  async approveVendorCustomer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vendors_customers')
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Approve vendor/customer error:', error)
      throw error
    }
  },

  async rejectVendorCustomer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vendors_customers')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Reject vendor/customer error:', error)
      throw error
    }
  },

  async checkDuplicate(field: 'email' | 'phone', value: string, excludeId?: string): Promise<{ exists: boolean, source: string }> {
    try {
      // 1. Check vendors_customers
      let vcQuery = supabase
        .from('vendors_customers')
        .select('id')
        .eq(field, value)
        .neq('status', 'archived') // Check only non-archived

      if (excludeId) {
        vcQuery = vcQuery.neq('id', excludeId)
      }

      const { data: vcData } = await vcQuery.maybeSingle()
      if (vcData) return { exists: true, source: 'Sistemde kayıtlı (Tedarikçi/Müşteri)' }

      // 2. Check employees
      let empQuery = supabase
        .from('employees')
        .select('id')
        .eq(field, value)
        .eq('status', 'active')

      const { data: empData } = await empQuery.maybeSingle()
      if (empData) return { exists: true, source: 'Sistemde kayıtlı (Çalışan)' }

      return { exists: false, source: '' }
    } catch (error) {
      console.error(`Check ${field} duplicate error:`, error)
      return { exists: false, source: '' }
    }
  }
}
