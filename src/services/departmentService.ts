import { supabase } from '@/lib/supabase'
import type { Department } from '@/types/hr'
import { DEFAULT_DEPARTMENTS, type LocalDepartment } from '@/constants/defaults'

// Lokal departmanı DB formatına dönüştür
function localToDbDepartment(local: LocalDepartment, facilityId?: string): Department {
  return {
    id: local.id,
    name: local.name,
    code: local.code,
    description: local.description,
    employeeCount: 0,
    facilityId: facilityId
  }
}

export const departmentService = {
  /**
   * Departmanları getir - önce DB'den, yoksa lokal varsayılanları kullan
   */
  async getDepartments(filters?: { facilityId?: string; isActive?: boolean }): Promise<Department[]> {
    try {
      // Optimize: Only select needed columns
      let query = supabase.from('departments').select(`
        id,
        facility_id,
        name,
        description,
        manager_id,
        parent_department_id,
        is_active,
        created_at,
        updated_at
      `)

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }

      // Filter by is_active status (default to true if not specified)
      const isActive = filters?.isActive !== undefined ? filters.isActive : true
      query = query.eq('is_active', isActive)

      const { data: departments, error } = await query.order('name', { ascending: true })

      if (error) {
        console.warn('DB departments error, using local defaults:', error)
        return await this.getLocalDepartments(filters?.facilityId)
      }

      // DB'de departman yoksa lokal varsayılanları kullan
      if (!departments || departments.length === 0) {
        console.log('No departments in DB, using local defaults')
        return await this.getLocalDepartments(filters?.facilityId)
      }

      // Fetch employee counts - only active employees for this facility
      let empQuery = supabase
        .from('employees')
        .select('department, id, status, email')
        .eq('status', 'active')
        .not('email', 'like', '%_deleted_%')

      if (filters?.facilityId) {
        empQuery = empQuery.eq('facility_id', filters.facilityId)
      }

      const { data: employees, error: empError } = await empQuery

      if (empError) {
        console.warn('Error fetching employees for count:', empError)
      }

      // Calculate counts by department name (case-insensitive)
      const employeeCountsByName = new Map<string, number>()

      console.log('=== DEPARTMENT EMPLOYEE COUNT DEBUG ===')
      console.log('Total active employees fetched:', employees?.length || 0)
      console.log('Employee departments:', employees?.map(e => e.department))

      employees?.forEach((emp: any) => {
        // Count by department name
        if (emp.department) {
          const normalizedName = emp.department.trim().toLowerCase()
          const count = employeeCountsByName.get(normalizedName) || 0
          employeeCountsByName.set(normalizedName, count + 1)
        }
      })

      console.log('Employee counts by department:', Object.fromEntries(employeeCountsByName))

      return departments.map(dept => {
        // Match by department name (case-insensitive)
        const normalizedDeptName = dept.name.trim().toLowerCase()
        const employeeCount = employeeCountsByName.get(normalizedDeptName) || 0

        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          managerId: dept.manager_id,
          managerName: dept.manager_name,
          employeeCount,
          description: dept.description,
          facilityId: dept.facility_id
        }
      })
    } catch (error) {
      console.error('Get departments error, using local defaults:', error)
      return await this.getLocalDepartments(filters?.facilityId)
    }
  },

  /**
   * Lokal varsayılan departmanları getir - çalışan sayılarıyla birlikte
   */
  async getLocalDepartments(facilityId?: string): Promise<Department[]> {
    // Fetch employee counts for local departments too
    let employees: any[] = []

    if (facilityId) {
      const { data } = await supabase
        .from('employees')
        .select('department, id, status, email')
        .eq('status', 'active')
        .eq('facility_id', facilityId)
        .not('email', 'like', '%_deleted_%')

      employees = data || []
    }

    console.log('=== LOCAL DEPARTMENTS EMPLOYEE COUNT ===')
    console.log('Facility ID:', facilityId)
    console.log('Active employees:', employees.length)
    console.log('Employee departments:', employees.map(e => e.department))

    // Calculate counts by department name
    const employeeCountsByName = new Map<string, number>()
    employees.forEach((emp: any) => {
      if (emp.department) {
        const normalizedName = emp.department.trim().toLowerCase()
        const count = employeeCountsByName.get(normalizedName) || 0
        employeeCountsByName.set(normalizedName, count + 1)
      }
    })

    console.log('Employee counts:', Object.fromEntries(employeeCountsByName))

    return DEFAULT_DEPARTMENTS.map(d => {
      const normalizedName = d.name.trim().toLowerCase()
      const employeeCount = employeeCountsByName.get(normalizedName) || 0

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        employeeCount,
        facilityId
      }
    })
  },

  /**
   * Tüm lokal varsayılan departmanları döndür (UI için)
   */
  getAllLocalDepartments(): LocalDepartment[] {
    return DEFAULT_DEPARTMENTS
  },

  async getDepartmentById(id: string): Promise<Department | undefined> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return undefined

      return {
        id: data.id,
        name: data.name,
        code: data.code,
        managerId: data.manager_id,
        managerName: data.manager_name,
        employeeCount: data.employee_count || 0,
        description: data.description,
        facilityId: data.facility_id
      }
    } catch (error) {
      console.error('Get department error:', error)
      return undefined
    }
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    try {
      const dbData = {
        name: data.name,
        code: data.code,
        manager_id: data.managerId || null,
        manager_name: data.managerName,
        description: data.description,
        facility_id: data.facilityId
      }

      const { data: newDept, error } = await supabase
        .from('departments')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      return {
        id: newDept.id,
        name: newDept.name,
        code: newDept.code,
        managerId: newDept.manager_id,
        managerName: newDept.manager_name,
        employeeCount: 0,
        description: newDept.description,
        facilityId: newDept.facility_id
      }
    } catch (error) {
      console.error('Create department error:', error)
      throw error
    }
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    try {
      const dbData: any = {}
      if (data.name) dbData.name = data.name
      if (data.code) dbData.code = data.code
      if (data.managerId !== undefined) dbData.manager_id = data.managerId || null
      if (data.managerName !== undefined) dbData.manager_name = data.managerName
      if (data.description) dbData.description = data.description

      const { data: updatedDept, error } = await supabase
        .from('departments')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return {
        id: updatedDept.id,
        name: updatedDept.name,
        code: updatedDept.code,
        managerId: updatedDept.manager_id,
        managerName: updatedDept.manager_name,
        employeeCount: updatedDept.employee_count || 0,
        description: updatedDept.description,
        facilityId: updatedDept.facility_id
      }
    } catch (error) {
      console.error('Update department error:', error)
      throw error
    }
  },

  async deleteDepartment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete department error:', error)
      throw error
    }
  },

  async restoreDepartment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: true })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Restore department error:', error)
      throw error
    }
  },

  async hardDeleteDepartment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Hard delete department error:', error)
      throw error
    }
  },

  // Clean up all quarantined (inactive) departments for a facility
  async cleanupQuarantinedDepartments(facilityId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('departments')
        .delete()
        .eq('facility_id', facilityId)
        .eq('is_active', false)
        .select()

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Cleanup quarantined departments error:', error)
      throw error
    }
  },
}
