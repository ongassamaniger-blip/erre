import { supabase } from '@/lib/supabase'
import type { LeaveRequest } from '@/types'

export const leaveService = {
    async getLeaveRequests(facilityId?: string, status?: string): Promise<LeaveRequest[]> {
        try {
            let query = supabase.from('leave_requests').select('*')

            if (facilityId) {
                query = query.eq('facility_id', facilityId)
            }
            if (status) {
                query = query.eq('status', status)
            }

            const { data, error } = await query.order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Get leave requests error:', error)
            return []
        }
    },

    async createLeaveRequest(leaveData: Partial<LeaveRequest>): Promise<LeaveRequest> {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .insert(leaveData)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Create leave request error:', error)
            throw error
        }
    },

    async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Update leave request error:', error)
            throw error
        }
    },

    async approveLeaveRequest(id: string, approverId: string, approverName: string): Promise<LeaveRequest> {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .update({
                    status: 'approved',
                    approver_id: approverId,
                    approver_name: approverName,
                    approval_date: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Approve leave request error:', error)
            throw error
        }
    },

    async rejectLeaveRequest(id: string, approverId: string, notes: string): Promise<LeaveRequest> {
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .update({
                    status: 'rejected',
                    approver_id: approverId,
                    approval_notes: notes,
                    approval_date: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Reject leave request error:', error)
            throw error
        }
    }
}
