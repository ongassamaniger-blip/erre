import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types/hr'
import { DEFAULT_JOB_TITLES, type LocalJobTitle } from '@/constants/defaults'

// Lokal pozisyon isimlerini al
function getLocalPositionNames(): string[] {
  return DEFAULT_JOB_TITLES.map(j => j.name)
}

export interface EmployeeFilters {
  search?: string
  department?: string
  position?: string
  employmentType?: string
  status?: string
  facilityId?: string // Şube ID'si
}

export const employeeService = {
  async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    try {
      let query = supabase.from('employees').select('*')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }

      if (filters?.search) {
        const search = filters.search.toLowerCase()
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,code.ilike.%${search}%`)
      }

      if (filters?.department) {
        query = query.eq('department', filters.department)
      }

      if (filters?.position) {
        query = query.eq('position', filters.position)
      }

      if (filters?.employmentType) {
        query = query.eq('employment_type', filters.employmentType)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(fromDbEmployee)
    } catch (error) {
      console.error('Get employees error:', error)
      return []
    }
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return fromDbEmployee(data)
    } catch (error) {
      console.error('Get employee error:', error)
      return null
    }
  },

  async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    try {
      const dbData = toDbEmployee(employee)
      const { data, error } = await supabase
        .from('employees')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return fromDbEmployee(data)
    } catch (error) {
      console.error('Create employee error:', error)
      throw error
    }
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      const dbData = toDbEmployee(updates)
      const { data, error } = await supabase
        .from('employees')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return fromDbEmployee(data)
    } catch (error) {
      console.error('Update employee error:', error)
      throw error
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete employee error:', error)
      throw error
    }
  },

  async getPositions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('position')

      if (error) {
        console.warn('Get positions error, using local defaults:', error)
        return getLocalPositionNames()
      }

      const positions = new Set((data || []).map(item => item.position).filter(Boolean))

      // DB'de pozisyon yoksa lokal varsayılanları kullan
      if (positions.size === 0) {
        console.log('No positions in DB, using local defaults')
        return getLocalPositionNames()
      }

      return Array.from(positions)
    } catch (error) {
      console.error('Get positions error, using local defaults:', error)
      return getLocalPositionNames()
    }
  },

  /**
   * Lokal varsayılan pozisyonları döndür
   */
  getLocalPositions(): LocalJobTitle[] {
    return DEFAULT_JOB_TITLES
  },
}

// Helper functions for data mapping
const toDbEmployee = (employee: Partial<Employee>) => {
  const dbData: any = { ...employee }

  if (employee.firstName) dbData.first_name = employee.firstName
  if (employee.lastName) dbData.last_name = employee.lastName
  if (employee.nationalId) dbData.national_id = employee.nationalId
  if (employee.dateOfBirth) dbData.date_of_birth = employee.dateOfBirth
  if (employee.maritalStatus) dbData.marital_status = employee.maritalStatus
  if (employee.emergencyContact) dbData.emergency_contact = employee.emergencyContact
  if (employee.employmentType) dbData.employment_type = employee.employmentType
  if (employee.hireDate) dbData.hire_date = employee.hireDate
  if (employee.probationEndDate) dbData.probation_end_date = employee.probationEndDate
  if (employee.contractStartDate) dbData.contract_start_date = employee.contractStartDate
  if (employee.contractEndDate) dbData.contract_end_date = employee.contractEndDate
  if (employee.managerId) dbData.manager_id = employee.managerId
  if (employee.workingHours) dbData.working_hours = employee.workingHours
  if (employee.leaveEntitlements) dbData.leave_entitlements = employee.leaveEntitlements
  if (employee.facilityId) dbData.facility_id = employee.facilityId
  if (employee.iban) dbData.iban = employee.iban
  if (employee.bankName) dbData.bank_name = employee.bankName

  delete dbData.firstName
  delete dbData.lastName
  delete dbData.nationalId
  delete dbData.dateOfBirth
  delete dbData.maritalStatus
  delete dbData.emergencyContact
  delete dbData.employmentType
  delete dbData.hireDate
  delete dbData.probationEndDate
  delete dbData.contractStartDate
  delete dbData.contractEndDate
  delete dbData.managerId
  delete dbData.workingHours
  delete dbData.leaveEntitlements
  delete dbData.facilityId
  delete dbData.bankName

  return dbData
}

const fromDbEmployee = (dbData: any): Employee => {
  return {
    ...dbData,
    firstName: dbData.first_name,
    lastName: dbData.last_name,
    nationalId: dbData.national_id,
    dateOfBirth: dbData.date_of_birth,
    maritalStatus: dbData.marital_status,
    emergencyContact: dbData.emergency_contact,
    employmentType: dbData.employment_type,
    hireDate: dbData.hire_date,
    probationEndDate: dbData.probation_end_date,
    contractStartDate: dbData.contract_start_date,
    contractEndDate: dbData.contract_end_date,
    managerId: dbData.manager_id,
    workingHours: dbData.working_hours,
    leaveEntitlements: dbData.leave_entitlements || [],
    facilityId: dbData.facility_id,
    iban: dbData.iban,
    bankName: dbData.bank_name,
    documents: dbData.documents || [],
    salary: dbData.salary || { amount: 0, currency: 'TRY', frequency: 'monthly' },
  }
}
