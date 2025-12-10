import { supabase } from '@/lib/supabase'
import type { Employee } from '@/types/hr'

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  employeeCode: string
  date: string
  checkIn?: string
  checkOut?: string
  workingHours?: number
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave'
  lateMinutes?: number
  notes?: string
  facilityId: string // Şube ID'si
}

export interface AttendanceFilters {
  employeeId?: string
  department?: string
  dateFrom?: string
  dateTo?: string
  status?: AttendanceRecord['status']
  facilityId?: string // Şube ID'si
}

export const attendanceService = {
  async getAttendanceRecords(filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
    try {
      let query = supabase.from('attendance').select('*, employees(first_name, last_name, code, department)')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error

      let records = (data || []).map(this.mapToAttendanceRecord)

      if (filters?.department) {
        // Filter by department from joined employee data
        records = records.filter(rec => {
          const emp = (data || []).find(d => d.id === rec.id)?.employees
          return emp?.department === filters.department
        })
      }

      return records
    } catch (error) {
      console.error('Get attendance records error:', error)
      return []
    }
  },

  async getAttendanceByEmployee(employeeId: string, month?: string): Promise<AttendanceRecord[]> {
    try {
      let query = supabase.from('attendance').select('*, employees(first_name, last_name, code)')
        .eq('employee_id', employeeId)

      if (month) {
        // Filter by month (YYYY-MM)
        // Supabase doesn't have startsWith for date column easily, use range
        const startDate = `${month}-01`
        const endDate = `${month}-31` // Simple approximation or calculate last day
        query = query.gte('date', startDate).lte('date', endDate)
      }

      const { data, error } = await query.order('date', { ascending: true })

      if (error) throw error
      return (data || []).map(this.mapToAttendanceRecord)
    } catch (error) {
      console.error('Get attendance by employee error:', error)
      return []
    }
  },

  async createAttendanceRecord(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      const dbData = {
        employee_id: data.employeeId,
        date: data.date || new Date().toISOString().split('T')[0],
        check_in: data.checkIn,
        check_out: data.checkOut,
        working_hours: data.workingHours,
        status: data.status || 'present',
        late_minutes: data.lateMinutes,
        notes: data.notes,
        facility_id: data.facilityId
      }

      const { data: newRecord, error } = await supabase
        .from('attendance')
        .insert(dbData)
        .select('*, employees(first_name, last_name, code)')
        .single()

      if (error) throw error
      return this.mapToAttendanceRecord(newRecord)
    } catch (error) {
      console.error('Create attendance record error:', error)
      throw error
    }
  },

  async updateAttendanceRecord(id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      const dbUpdates: any = {}
      if (data.date !== undefined) dbUpdates.date = data.date
      if (data.checkIn !== undefined) dbUpdates.check_in = data.checkIn
      if (data.checkOut !== undefined) dbUpdates.check_out = data.checkOut
      if (data.workingHours !== undefined) dbUpdates.working_hours = data.workingHours
      if (data.status !== undefined) dbUpdates.status = data.status
      if (data.lateMinutes !== undefined) dbUpdates.late_minutes = data.lateMinutes
      if (data.notes !== undefined) dbUpdates.notes = data.notes

      const { data: updated, error } = await supabase
        .from('attendance')
        .update(dbUpdates)
        .eq('id', id)
        .select('*, employees(first_name, last_name, code)')
        .single()

      if (error) throw error
      return this.mapToAttendanceRecord(updated)
    } catch (error) {
      console.error('Update attendance record error:', error)
      throw error
    }
  },

  async deleteAttendanceRecord(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete attendance record error:', error)
      throw error
    }
  },

  async bulkImportAttendanceRecords(
    records: Array<{
      employeeCode?: string
      employeeName?: string
      date: string
      checkIn?: string
      checkOut?: string
      status?: AttendanceRecord['status']
      notes?: string
      facilityId?: string
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0
    let failed = 0
    const errors: string[] = []

    // Fetch all employees to map codes/names to IDs efficiently
    // This might be heavy if many employees, but better than N queries.
    // Or we query per record if list is small.
    // Let's assume list is small (daily import).

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      try {
        // Find employee
        let employeeId: string | undefined
        let facilityId: string | undefined

        if (record.employeeCode) {
          const { data: emp } = await supabase.from('employees').select('id, facility_id').eq('code', record.employeeCode).single()
          if (emp) {
            employeeId = emp.id
            facilityId = emp.facility_id
          }
        } else if (record.employeeName) {
          // Split name? Or search ilike?
          // Assuming exact match or we need better search.
          // Let's try to split first/last
          const parts = record.employeeName.split(' ')
          if (parts.length >= 2) {
            const last = parts.pop()
            const first = parts.join(' ')
            const { data: emp } = await supabase.from('employees').select('id, facility_id')
              .eq('first_name', first)
              .eq('last_name', last)
              .single()
            if (emp) {
              employeeId = emp.id
              facilityId = emp.facility_id
            }
          }
        }

        if (!employeeId) {
          failed++
          errors.push(`Satır ${i + 1}: Çalışan bulunamadı (${record.employeeCode || record.employeeName})`)
          continue
        }

        if (!record.date) {
          failed++
          errors.push(`Satır ${i + 1}: Tarih eksik`)
          continue
        }

        // Calculate working hours
        let workingHours: number | undefined
        if (record.checkIn && record.checkOut) {
          const [inHour, inMin] = record.checkIn.split(':').map(Number)
          const [outHour, outMin] = record.checkOut.split(':').map(Number)
          const inMinutes = inHour * 60 + inMin
          const outMinutes = outHour * 60 + outMin
          workingHours = (outMinutes - inMinutes) / 60
        }

        // Calculate late minutes
        let lateMinutes: number | undefined
        if (record.checkIn && record.status === 'late') {
          const [inHour, inMin] = record.checkIn.split(':').map(Number)
          const expectedIn = 9 * 60 // 09:00
          const actualIn = inHour * 60 + inMin
          if (actualIn > expectedIn) {
            lateMinutes = actualIn - expectedIn
          }
        }

        // Check existing
        const { data: existing } = await supabase
          .from('attendance')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('date', record.date)
          .single()

        const dbData = {
          employee_id: employeeId,
          date: record.date,
          check_in: record.checkIn,
          check_out: record.checkOut,
          working_hours: workingHours,
          status: record.status || 'present',
          late_minutes: lateMinutes,
          notes: record.notes,
          facility_id: record.facilityId || facilityId
        }

        if (existing) {
          await supabase.from('attendance').update(dbData).eq('id', existing.id)
        } else {
          await supabase.from('attendance').insert(dbData)
        }

        success++
      } catch (error: any) {
        failed++
        errors.push(`Satır ${i + 1}: ${error.message || 'Bilinmeyen hata'}`)
      }
    }

    return { success, failed, errors }
  },

  mapToAttendanceRecord(data: any): AttendanceRecord {
    return {
      id: data.id,
      employeeId: data.employee_id,
      employeeName: data.employees ? `${data.employees.first_name} ${data.employees.last_name}` : 'Unknown',
      employeeCode: data.employees?.code || '',
      date: data.date,
      checkIn: data.check_in,
      checkOut: data.check_out,
      workingHours: data.working_hours,
      status: data.status,
      lateMinutes: data.late_minutes,
      notes: data.notes,
      facilityId: data.facility_id
    }
  }
}
