import { supabase } from '@/lib/supabase'
import type { Employee, EmployeeFilters } from '@/types/hr'

export const employeeService = {
    async getEmployees(filters?: EmployeeFilters | string): Promise<Employee[]> {
        try {
            let query = supabase.from('employees').select('*')

            if (typeof filters === 'string') {
                if (filters) query = query.eq('facility_id', filters)
            } else if (filters) {
                if (filters.facilityId) query = query.eq('facility_id', filters.facilityId)
                if (filters.department) query = query.eq('department', filters.department)
                if (filters.employmentType) query = query.eq('employment_type', filters.employmentType)
                if (filters.status) query = query.eq('status', filters.status)
                if (filters.search) {
                    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
                }
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

    async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
        try {
            // Generate unique code if not provided
            if (!employeeData.code) {
                const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
                employeeData.code = `EMP-${randomStr}`
            }

            // Ensure required NOT NULL fields have default values
            if (!employeeData.position) {
                employeeData.position = 'Belirtilmedi' // Default position
            }
            if (!employeeData.hireDate) {
                employeeData.hireDate = new Date().toISOString().split('T')[0] // Default to today
            }

            const dbData = toDbEmployee(employeeData)
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
            // If changing status to active, we need to clean up _deleted_ suffixes
            if (updates.status === 'active') {
                // First get current employee data
                const { data: currentEmployee, error: fetchError } = await supabase
                    .from('employees')
                    .select('email, code, national_id, status')
                    .eq('id', id)
                    .single()

                if (fetchError) throw fetchError

                // If employee was inactive, clean up _deleted_ suffixes
                if (currentEmployee.status === 'inactive') {
                    const cleanValue = (value: string | null): string | null => {
                        if (!value) return value
                        // Remove _deleted_timestamp suffix
                        return value.replace(/_deleted_\d+/g, '')
                    }

                    // Add cleaned values to updates
                    if (currentEmployee.email && currentEmployee.email.includes('_deleted_')) {
                        updates.email = cleanValue(currentEmployee.email) || updates.email
                    }
                    if (currentEmployee.code && currentEmployee.code.includes('_deleted_')) {
                        updates.code = cleanValue(currentEmployee.code) || updates.code
                    }
                    if (currentEmployee.national_id && currentEmployee.national_id.includes('_deleted_')) {
                        updates.nationalId = cleanValue(currentEmployee.national_id) || updates.nationalId
                    }
                }
            }

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
            // Get current employee data first
            const { data: employee, error: fetchError } = await supabase
                .from('employees')
                .select('email, code, national_id, status')
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            // If already inactive/deleted, don't modify again
            if (employee.status === 'inactive') {
                console.log('Employee already inactive, skipping soft delete')
                return
            }

            // Helper function to clean existing _deleted_ suffixes and add new one
            const cleanAndMark = (value: string | null): string => {
                if (!value) return `unknown_deleted_${Date.now()}`
                // Remove any existing _deleted_ suffixes first
                const cleanValue = value.replace(/_deleted_\d+/g, '')
                return `${cleanValue}_deleted_${Date.now()}`
            }

            const updates = {
                status: 'inactive',
                email: cleanAndMark(employee.email),
                code: cleanAndMark(employee.code),
                national_id: cleanAndMark(employee.national_id),
                updated_at: new Date().toISOString()
            }

            // Perform soft delete by updating status and renaming unique fields
            const { error } = await supabase
                .from('employees')
                .update(updates)
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Delete employee error:', error)
            throw error
        }
    },

    // Hard delete - permanently removes employee and all related data from database
    async hardDeleteEmployee(id: string): Promise<void> {
        try {
            // 1. Delete leave requests
            const { error: leavesError } = await supabase
                .from('leave_requests')
                .delete()
                .eq('employee_id', id)

            if (leavesError) {
                console.warn('Error deleting leave requests:', leavesError.message)
            }

            // 2. Delete payroll records
            const { error: payrollError } = await supabase
                .from('payroll_records')
                .delete()
                .eq('employee_id', id)

            if (payrollError) {
                console.warn('Error deleting payroll records:', payrollError.message)
            }

            // 3. Delete attendance records
            const { error: attendanceError } = await supabase
                .from('attendance_records')
                .delete()
                .eq('employee_id', id)

            if (attendanceError) {
                console.warn('Error deleting attendance records:', attendanceError.message)
            }

            // 4. Delete task assignments (if exists)
            const { error: taskError } = await supabase
                .from('task_assignments')
                .delete()
                .eq('employee_id', id)

            if (taskError) {
                console.warn('Error deleting task assignments:', taskError.message)
            }

            // 5. Finally delete the employee
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Hard delete employee error:', error)
            throw error
        }
    },

    async checkEmailExists(email: string): Promise<boolean> {
        try {
            const { count, error } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('email', email)
                .not('email', 'like', '%_deleted_%') // Silinmiş çalışanları hariç tut
                .neq('status', 'terminated') // Sonlandırılmış çalışanları hariç tut

            if (error) throw error
            return (count || 0) > 0
        } catch (error) {
            console.error('Check email error:', error)
            return false
        }
    }
}

// Helper functions for data mapping
const toDbEmployee = (employee: Partial<Employee>) => {
    const dbData: any = {}

    // Direct mappings (same name in both)
    if (employee.email !== undefined) dbData.email = employee.email
    if (employee.phone !== undefined) dbData.phone = employee.phone
    if (employee.address !== undefined) dbData.address = employee.address
    if (employee.gender !== undefined) dbData.gender = employee.gender
    if (employee.nationality !== undefined) dbData.nationality = employee.nationality
    if (employee.code !== undefined) dbData.code = employee.code
    if (employee.department !== undefined) dbData.department = employee.department
    if (employee.position !== undefined) dbData.position = employee.position
    if (employee.status !== undefined) dbData.status = employee.status

    // Camel to snake_case mappings
    if (employee.firstName !== undefined) dbData.first_name = employee.firstName
    if (employee.lastName !== undefined) dbData.last_name = employee.lastName
    if (employee.nationalId !== undefined) dbData.national_id = employee.nationalId
    if (employee.dateOfBirth !== undefined) dbData.date_of_birth = employee.dateOfBirth
    if (employee.maritalStatus !== undefined) dbData.marital_status = employee.maritalStatus
    if (employee.employmentType !== undefined) dbData.employment_type = employee.employmentType
    if (employee.hireDate !== undefined) dbData.hire_date = employee.hireDate
    if (employee.contractStartDate !== undefined) dbData.contract_start_date = employee.contractStartDate
    if (employee.contractEndDate !== undefined) dbData.contract_end_date = employee.contractEndDate
    if (employee.workingHours !== undefined) dbData.working_hours = employee.workingHours
    if (employee.facilityId !== undefined) dbData.facility_id = employee.facilityId
    if (employee.iban !== undefined) dbData.iban = employee.iban
    if (employee.bankName !== undefined) dbData.bank_name = employee.bankName

    // JSONB fields - keep as objects
    if (employee.salary !== undefined) dbData.salary = employee.salary
    if (employee.documents !== undefined) dbData.documents = employee.documents
    if (employee.leaveEntitlements !== undefined) dbData.leave_entitlements = employee.leaveEntitlements
    if (employee.emergencyContact !== undefined) dbData.emergency_contact = employee.emergencyContact

    return dbData
}

const fromDbEmployee = (dbData: any): Employee => {
    return {
        id: dbData.id,
        code: dbData.code || '',
        firstName: dbData.first_name,
        lastName: dbData.last_name,
        nationalId: dbData.national_id || '',
        dateOfBirth: dbData.date_of_birth || '',
        nationality: dbData.nationality || 'TR',
        gender: dbData.gender || 'male',
        maritalStatus: dbData.marital_status || 'single',
        phone: dbData.phone || '',
        email: dbData.email || '',
        address: dbData.address || '',
        emergencyContact: dbData.emergency_contact || { name: '', relationship: '', phone: '' },
        department: dbData.department || '',
        position: dbData.position || '',
        employmentType: dbData.employment_type || 'full-time',
        hireDate: dbData.hire_date || '',
        contractStartDate: dbData.contract_start_date,
        contractEndDate: dbData.contract_end_date,
        workingHours: dbData.working_hours,
        salary: dbData.salary || { amount: 0, currency: 'TRY', frequency: 'monthly' },
        leaveEntitlements: dbData.leave_entitlements || [],
        documents: dbData.documents || [],
        status: dbData.status || 'active',
        facilityId: dbData.facility_id,
        iban: dbData.iban,
        bankName: dbData.bank_name,
        createdAt: dbData.created_at,
        updatedAt: dbData.updated_at,
    }
}
