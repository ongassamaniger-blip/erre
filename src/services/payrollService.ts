import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types/hr'

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  period: string // YYYY-MM formatında
  baseSalary: number
  currency: string
  allowances: {
    name: string
    amount: number
  }[]
  deductions: {
    name: string
    amount: number
  }[]
  bonuses: {
    name: string
    amount: number
  }[]
  grossSalary: number
  totalDeductions: number
  netSalary: number
  status: 'draft' | 'approved' | 'paid' | 'cancelled'
  paymentDate?: string
  notes?: string
  signedByEmployee?: boolean
  signedDate?: string
  signedBy?: string
  facilityId: string // Şube ID'si
  iban?: string
  bankName?: string
  createdAt: string
  updatedAt: string
}

export interface PayrollFilters {
  employeeId?: string
  department?: string
  period?: string
  status?: PayrollRecord['status']
  facilityId?: string // Şube ID'si
  includeCancelled?: boolean
}

export const payrollService = {
  async getPayrollRecords(filters?: PayrollFilters): Promise<PayrollRecord[]> {
    try {
      // Use !inner join for department filter to enable database-level filtering
      const needsDepartmentFilter = !!filters?.department

      let query = supabase.from('payrolls').select(
        needsDepartmentFilter
          ? '*, employees!inner(first_name, last_name, code, department)'
          : '*, employees(first_name, last_name, code, department)'
      )

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }
      if (filters?.period) {
        query = query.eq('period', filters.period)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      } else if (!filters?.includeCancelled) {
        query = query.neq('status', 'cancelled')
      }

      // Department filter at database level using !inner join
      if (filters?.department) {
        query = query.eq('employees.department', filters.department)
      }

      const { data, error } = await query.order('period', { ascending: false })

      if (error) throw error

      const records: PayrollRecord[] = (data as any[] || []).map((d) => this.mapToPayrollRecord(d))

      return records
    } catch (error) {
      console.error('Get payroll records error:', error)
      return []
    }
  },

  async getPayrollById(id: string): Promise<PayrollRecord | undefined> {
    try {
      const { data, error } = await supabase
        .from('payrolls')
        .select('*, employees(first_name, last_name, code)')
        .eq('id', id)
        .single()

      if (error) throw error
      return this.mapToPayrollRecord(data)
    } catch (error) {
      console.error('Get payroll record error:', error)
      return undefined
    }
  },

  async createPayrollRecord(data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    try {
      // Calculate totals if not provided
      const baseSalary = data.baseSalary || 0
      const totalAllowances = (data.allowances || []).reduce((sum, a) => sum + a.amount, 0)
      const totalDeductions = (data.deductions || []).reduce((sum, d) => sum + d.amount, 0)
      const totalBonuses = (data.bonuses || []).reduce((sum, b) => sum + b.amount, 0)
      const grossSalary = baseSalary + totalAllowances + totalBonuses
      const netSalary = grossSalary - totalDeductions

      const dbData = {
        employee_id: data.employeeId,
        period: data.period,
        base_salary: baseSalary,
        currency: data.currency,
        allowances: data.allowances,
        deductions: data.deductions,
        bonuses: data.bonuses,
        gross_salary: grossSalary,
        total_deductions: totalDeductions,
        net_salary: netSalary,
        status: data.status || 'draft',
        payment_date: data.paymentDate,
        notes: data.notes,
        facility_id: data.facilityId,
        iban: data.iban,
        bank_name: data.bankName
      }

      const { data: newRecord, error } = await supabase
        .from('payrolls')
        .insert(dbData)
        .select('*, employees(first_name, last_name, code)')
        .single()

      if (error) throw error
      return this.mapToPayrollRecord(newRecord)
    } catch (error) {
      console.error('Create payroll record error:', error)
      throw error
    }
  },

  async updatePayrollRecord(id: string, data: Partial<PayrollRecord>): Promise<PayrollRecord> {
    try {
      // If financial data changes, recalculate
      // This is complex because we need existing data.
      // For simplicity, we assume the caller provides full data or we fetch it.
      // But usually update sends partial.
      // Let's fetch current first if needed.

      let dbUpdates: any = { ...data }

      // Map camelCase to snake_case
      if (data.baseSalary !== undefined) dbUpdates.base_salary = data.baseSalary
      if (data.grossSalary !== undefined) dbUpdates.gross_salary = data.grossSalary
      if (data.totalDeductions !== undefined) dbUpdates.total_deductions = data.totalDeductions
      if (data.netSalary !== undefined) dbUpdates.net_salary = data.netSalary
      if (data.paymentDate !== undefined) dbUpdates.payment_date = data.paymentDate
      if (data.signedByEmployee !== undefined) dbUpdates.signed_by_employee = data.signedByEmployee
      if (data.signedDate !== undefined) dbUpdates.signed_date = data.signedDate
      if (data.signedDate !== undefined) dbUpdates.signed_date = data.signedDate
      if (data.signedBy !== undefined) dbUpdates.signed_by = data.signedBy
      if (data.iban !== undefined) dbUpdates.iban = data.iban
      if (data.bankName !== undefined) dbUpdates.bank_name = data.bankName

      // Remove camelCase keys that are not columns
      delete dbUpdates.baseSalary
      delete dbUpdates.grossSalary
      delete dbUpdates.totalDeductions
      delete dbUpdates.netSalary
      delete dbUpdates.paymentDate
      delete dbUpdates.signedByEmployee
      delete dbUpdates.signedDate
      delete dbUpdates.signedBy
      delete dbUpdates.employeeName
      delete dbUpdates.employeeCode
      delete dbUpdates.iban
      delete dbUpdates.bankName
      delete dbUpdates.employeeId
      delete dbUpdates.facilityId
      delete dbUpdates.createdAt
      delete dbUpdates.updatedAt

      // Recalculation logic should ideally be here or in DB trigger.
      // We'll rely on frontend to send correct calculated values for now, or simple recalculation if arrays are passed.
      if (data.allowances || data.deductions || data.bonuses || data.baseSalary) {
        // We should probably fetch existing to merge, but let's assume the UI sends the full arrays if they change.
        // If baseSalary changes, we need to recalculate.
        // This is risky without fetching.
        // Let's fetch current record.
        const current = await this.getPayrollById(id)
        if (current) {
          const base = data.baseSalary ?? current.baseSalary
          const all = data.allowances ?? current.allowances
          const ded = data.deductions ?? current.deductions
          const bon = data.bonuses ?? current.bonuses

          const tAll = all.reduce((sum, a) => sum + a.amount, 0)
          const tDed = ded.reduce((sum, d) => sum + d.amount, 0)
          const tBon = bon.reduce((sum, b) => sum + b.amount, 0)

          dbUpdates.gross_salary = base + tAll + tBon
          dbUpdates.total_deductions = tDed
          dbUpdates.net_salary = dbUpdates.gross_salary - tDed
        }
      }

      const { data: updated, error } = await supabase
        .from('payrolls')
        .update(dbUpdates)
        .eq('id', id)
        .select('*, employees(first_name, last_name, code)')
        .single()

      if (error) throw error
      return this.mapToPayrollRecord(updated)
    } catch (error) {
      console.error('Update payroll record error:', error)
      throw error
    }
  },

  async deletePayrollRecord(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payrolls')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete payroll record error:', error)
      throw error
    }
  },

  async cancelPayroll(id: string): Promise<PayrollRecord> {
    return this.updatePayrollRecord(id, {
      status: 'cancelled'
    })
  },

  async markAsPaid(id: string, paymentDate?: string): Promise<PayrollRecord> {
    const record = await this.updatePayrollRecord(id, {
      status: 'paid',
      paymentDate: paymentDate || new Date().toISOString().split('T')[0]
    })

    // Create financial transaction
    await this.createPayrollTransaction(record)

    return record
  },

  async createPayrollTransaction(record: PayrollRecord) {
    try {
      // 0. Check for duplicate transaction first
      const { transactionService } = await import('@/services/finance/transactionService')
      const transactionCode = `PAY-${record.id.substring(0, 8).toUpperCase()}`

      const existing = await transactionService.getAllTransactions({ search: transactionCode })
      if (existing.length > 0) {
        console.log('Payroll transaction already exists for record:', record.id)
        return
      }

      // 1. Get or create 'Personel Giderleri' category using centralized helper
      const { categoryService } = await import('@/services/finance/categoryService')
      const categoryId = await categoryService.getOrCreateSystemCategory('Personel Giderleri', 'expense')

      if (!categoryId) {
        console.error('Failed to get or create Personel Giderleri category')
        return
      }

      // 2. Create transaction with unique transaction number
      await transactionService.createTransaction({
        type: 'expense',
        categoryId: categoryId,
        amount: record.netSalary,
        currency: record.currency as any,
        date: record.paymentDate || new Date().toISOString().split('T')[0],
        title: `Maaş Ödemesi - ${record.employeeName}`,
        description: `${record.period} dönemi maaş ödemesi`,
        facilityId: record.facilityId,
        status: 'approved',
        paymentMethod: 'bank_transfer',
        documents: [],
        transactionNumber: transactionCode, // Add unique transaction number
        vendorCustomerId: undefined
      })

    } catch (error) {
      console.error('Failed to create payroll transaction:', error)
      // Don't throw, just log. We don't want to fail the payroll update if transaction creation fails.
    }
  },

  async signByEmployee(id: string, employeeName: string): Promise<PayrollRecord> {
    return this.updatePayrollRecord(id, {
      signedByEmployee: true,
      signedDate: new Date().toISOString(),
      signedBy: employeeName
    })
  },

  async generateMonthlyPayrolls(period: string, facilityId?: string): Promise<PayrollRecord[]> {
    try {
      // 1. Get active employees (excluding deleted ones)
      let query = supabase
        .from('employees')
        .select('*')
        .eq('status', 'active')
        .not('email', 'like', '%_deleted_%') // Silinmiş çalışanları hariç tut

      if (facilityId) {
        query = query.eq('facility_id', facilityId)
      }
      const { data: employees, error: empError } = await query
      if (empError) throw empError

      const createdRecords: PayrollRecord[] = []
      const currentDay = new Date().getDate()

      for (const emp of employees || []) {

        // 2. Check if payroll exists for this period
        const { count } = await supabase
          .from('payrolls')
          .select('*', { count: 'exact', head: true })
          .eq('employee_id', emp.id)
          .eq('period', period)
          .neq('status', 'cancelled')

        if (count === 0) {
          // 3. Create payroll
          // Calculate standard values
          // Ensure we handle potential missing salary data gracefully
          const salaryInfo = emp.salary || { amount: 0, currency: 'TRY' }
          const baseSalary = salaryInfo.amount || 0

          // Remove mock allowances and deductions to ensure Net Salary = Base Salary as requested
          const allowances: any[] = []
          const deductions: any[] = []

          try {
            // Use snake_case fields from DB directly
            const iban = emp.iban || ''
            const bankName = emp.bank_name || ''

            const record = await this.createPayrollRecord({
              employeeId: emp.id,
              period,
              baseSalary,
              currency: salaryInfo.currency || 'TRY',
              allowances,
              deductions,
              bonuses: [],
              status: 'draft',
              facilityId: emp.facility_id,
              iban: iban,
              bankName: bankName,
              paymentDate: new Date().toISOString().split('T')[0] // Set default payment date to today for draft
            })
            createdRecords.push(record)
          } catch (e) {
            console.error(`Failed to create payroll for employee ${emp.id}:`, e)
          }
        }
      }

      return createdRecords
    } catch (error) {
      console.error('Generate monthly payrolls error:', error)
      return []
    }
  },

  async bulkMarkAsPaid(ids: string[], paymentDate?: string): Promise<PayrollRecord[]> {
    try {
      const date = paymentDate || new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('payrolls')
        .update({ status: 'paid', payment_date: date })
        .in('id', ids)
        .select('*, employees(first_name, last_name, code)')

      if (error) throw error

      const records: PayrollRecord[] = (data as any[] || []).map((d) => this.mapToPayrollRecord(d))

      // Create transactions for all
      for (const record of records) {
        await this.createPayrollTransaction(record)
      }

      return records
    } catch (error) {
      console.error('Bulk mark as paid error:', error)
      throw error
    }
  },

  async bulkSignByEmployee(ids: string[], employeeNames: Record<string, string>): Promise<PayrollRecord[]> {
    try {
      // Bulk update with different values is tricky in one query.
      // We'll do it in parallel promises.
      const promises = ids.map(id => {
        // We need employeeId to look up name in employeeNames, but we only have ID here.
        // Assuming employeeNames is keyed by employeeId? 
        // Original code: employeeNames[record.employeeId]
        // We need to fetch record first or assume we can't do this efficiently without more info.
        // Or we just use a generic name? No, signature needs name.
        // Let's fetch records first.
        return this.getPayrollById(id).then(record => {
          if (record) {
            const name = employeeNames[record.employeeId] || record.employeeName
            return this.signByEmployee(id, name)
          }
          return null
        })
      })

      const results = await Promise.all(promises)
      return results.filter(r => r !== null) as PayrollRecord[]
    } catch (error) {
      console.error('Bulk sign error:', error)
      throw error
    }
  },

  mapToPayrollRecord(data: any): PayrollRecord {
    return {
      id: data.id,
      employeeId: data.employee_id,
      employeeName: data.employees ? `${data.employees.first_name} ${data.employees.last_name}` : 'Unknown',
      employeeCode: data.employees?.code || '',
      period: data.period,
      baseSalary: data.base_salary,
      currency: data.currency,
      allowances: data.allowances || [],
      deductions: data.deductions || [],
      bonuses: data.bonuses || [],
      grossSalary: data.gross_salary,
      totalDeductions: data.total_deductions,
      netSalary: data.net_salary,
      status: data.status,
      paymentDate: data.payment_date,
      notes: data.notes,
      signedByEmployee: data.signed_by_employee,
      signedDate: data.signed_date,
      signedBy: data.signed_by,
      facilityId: data.facility_id,
      iban: data.iban,
      bankName: data.bank_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}
