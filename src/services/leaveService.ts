import { supabase } from '@/lib/supabase'
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/types/hr'
import { employeeService } from './hr/employeeService'

export interface LeaveFilters {
  status?: LeaveStatus
  leaveType?: string
  employeeId?: string
  startDate?: string
  endDate?: string
  facilityId?: string
}

export const leaveService = {
  async getLeaves(filters?: LeaveFilters): Promise<LeaveRequest[]> {
    try {
      let query = supabase.from('leave_requests').select('*')

      if (filters?.facilityId) query = query.eq('facility_id', filters.facilityId)
      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.leaveType) query = query.eq('leave_type', filters.leaveType)
      if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId)
      if (filters?.startDate) query = query.gte('start_date', filters.startDate)
      if (filters?.endDate) query = query.lte('end_date', filters.endDate)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(fromDbLeave)
    } catch (error) {
      console.error('Get leaves error:', error)
      return []
    }
  },

  async getLeaveById(id: string): Promise<LeaveRequest | null> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return fromDbLeave(data)
    } catch (error) {
      console.error('Get leave error:', error)
      return null
    }
  },

  async createLeave(leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'> & { status?: LeaveStatus }): Promise<LeaveRequest> {
    try {
      // 1. Create leave request
      const status = leave.status || 'pending'
      const dbData = toDbLeave({
        ...leave,
        status,
        approvalDate: status === 'approved' ? (leave.approvalDate || new Date().toISOString()) : undefined
      })

      const { data, error } = await supabase
        .from('leave_requests')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      // 2. Update employee entitlements if it's an annual leave
      if (leave.leaveType === 'annual') {
        const employee = await employeeService.getEmployeeById(leave.employeeId)
        if (employee) {
          let entitlements = employee.leaveEntitlements || []
          const annualEntitlementIndex = entitlements.findIndex(e => e.type === 'annual')

          if (annualEntitlementIndex >= 0) {
            // Update existing entitlement
            entitlements[annualEntitlementIndex] = {
              ...entitlements[annualEntitlementIndex],
              usedDays: entitlements[annualEntitlementIndex].usedDays + leave.totalDays,
              remainingDays: entitlements[annualEntitlementIndex].remainingDays - leave.totalDays
            }
          } else {
            // Create new entitlement if missing
            // Default annual leave is usually 14 days, but this should ideally come from configuration
            const defaultTotalDays = 14
            entitlements.push({
              type: 'annual',
              totalDays: defaultTotalDays,
              usedDays: leave.totalDays,
              remainingDays: defaultTotalDays - leave.totalDays,
            })
          }

          await employeeService.updateEmployee(leave.employeeId, {
            leaveEntitlements: entitlements
          })
        }
      }

      return fromDbLeave(data)
    } catch (error) {
      console.error('Create leave error:', error)
      throw error
    }
  },

  async approveLeave(id: string, approverId: string, approverName: string): Promise<LeaveRequest> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approver_id: approverId,
          approver_name: approverName,
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return fromDbLeave(data)
    } catch (error) {
      console.error('Approve leave error:', error)
      throw error
    }
  },

  async rejectLeave(id: string, approverId: string, approverName: string, reason: string): Promise<LeaveRequest> {
    try {
      // If rejecting, we might need to revert the entitlement deduction if we deducted it on creation
      // But usually deduction happens on approval or creation. 
      // Current logic deducts on creation. So rejection should revert it.

      const leave = await this.getLeaveById(id)

      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approver_id: approverId,
          approver_name: approverName,
          rejection_reason: reason,
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Revert entitlement if it was annual leave
      if (leave && leave.leaveType === 'annual') {
        const employee = await employeeService.getEmployeeById(leave.employeeId)
        if (employee && employee.leaveEntitlements) {
          const updatedEntitlements = employee.leaveEntitlements.map(entitlement => {
            if (entitlement.type === 'annual') {
              return {
                ...entitlement,
                usedDays: Math.max(0, entitlement.usedDays - leave.totalDays),
                remainingDays: entitlement.remainingDays + leave.totalDays
              }
            }
            return entitlement
          })

          await employeeService.updateEmployee(leave.employeeId, {
            leaveEntitlements: updatedEntitlements
          })
        }
      }

      return fromDbLeave(data)
    } catch (error) {
      console.error('Reject leave error:', error)
      throw error
    }
  }
}

// Helper functions
const toDbLeave = (leave: Partial<LeaveRequest>) => {
  const dbData: any = { ...leave }

  if (leave.employeeId) dbData.employee_id = leave.employeeId
  if (leave.employeeName) dbData.employee_name = leave.employeeName
  if (leave.employeePhoto) dbData.employee_photo = leave.employeePhoto
  if (leave.leaveType) dbData.leave_type = leave.leaveType
  if (leave.startDate) dbData.start_date = leave.startDate
  if (leave.endDate) dbData.end_date = leave.endDate
  if (leave.totalDays) dbData.total_days = leave.totalDays
  if (leave.documentUrl) dbData.document_url = leave.documentUrl
  if (leave.approverId) dbData.approver_id = leave.approverId
  if (leave.approverName) dbData.approver_name = leave.approverName
  if (leave.approvalDate) dbData.approval_date = leave.approvalDate
  if (leave.rejectionReason) dbData.rejection_reason = leave.rejectionReason
  if (leave.facilityId) dbData.facility_id = leave.facilityId

  // Remove camelCase
  delete dbData.employeeId
  delete dbData.employeeName
  delete dbData.employeePhoto
  delete dbData.leaveType
  delete dbData.startDate
  delete dbData.endDate
  delete dbData.totalDays
  delete dbData.documentUrl
  delete dbData.approverId
  delete dbData.approverName
  delete dbData.approvalDate
  delete dbData.rejectionReason
  delete dbData.facilityId

  return dbData
}

const fromDbLeave = (dbData: any): LeaveRequest => {
  return {
    ...dbData,
    employeeId: dbData.employee_id,
    employeeName: dbData.employee_name,
    employeePhoto: dbData.employee_photo,
    leaveType: dbData.leave_type,
    startDate: dbData.start_date,
    endDate: dbData.end_date,
    totalDays: dbData.total_days,
    documentUrl: dbData.document_url,
    approverId: dbData.approver_id,
    approverName: dbData.approver_name,
    approvalDate: dbData.approval_date,
    rejectionReason: dbData.rejection_reason,
    facilityId: dbData.facility_id,
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at
  }
}
