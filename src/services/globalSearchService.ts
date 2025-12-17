import { transactionService } from './finance/transactionService'
import { employeeService } from './employeeService'
import { leaveService } from './leaveService'
import { projectService } from './projects/projectService'
import { campaignService } from './qurban/qurbanService'
import { approvalService } from './approvalService'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/types/finance'
import type { Employee } from '@/types/hr'
import type { Project } from '@/types'

export interface SearchResult {
  id: string
  type: 'transaction' | 'employee' | 'leave' | 'project' | 'qurban' | 'approval'
  title: string
  description: string
  url: string
  metadata?: Record<string, any>
  score: number
}

export interface SearchResultGroup {
  type: SearchResult['type']
  label: string
  icon: string
  results: SearchResult[]
}

const searchableFields: Record<SearchResult['type'], string[]> = {
  transaction: ['code', 'title', 'description', 'categoryName', 'vendorCustomerName'],
  employee: ['firstName', 'lastName', 'code', 'email', 'position', 'department'],
  leave: ['employeeName', 'type', 'reason'],
  project: ['name', 'code', 'description'],
  qurban: ['campaignName', 'donorName'],
  approval: ['title', 'description'],
}

function calculateScore(query: string, text: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  if (lowerText === lowerQuery) return 100
  if (lowerText.startsWith(lowerQuery)) return 80
  if (lowerText.includes(lowerQuery)) return 60
  if (lowerText.split(' ').some(word => word.startsWith(lowerQuery))) return 40
  return 0
}

function searchInObject(obj: any, query: string, fields: string[]): number {
  let maxScore = 0
  for (const field of fields) {
    const value = obj[field]
    if (value && typeof value === 'string') {
      const score = calculateScore(query, value)
      maxScore = Math.max(maxScore, score)
    }
  }
  return maxScore
}

export const globalSearchService = {
  async search(query: string, facilityId?: string, limit: number = 10): Promise<SearchResultGroup[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const searchQuery = query.trim()
    const results: SearchResult[] = []

    try {
      // Get facility ID from auth if not provided
      let targetFacilityId = facilityId
      if (!targetFacilityId) {
        const { data: { user } } = await supabase.auth.getUser()
        // Try to get facility from user context (you may need to adjust this)
        // For now, we'll search across all facilities the user has access to
      }

      // Use Supabase Full-Text Search with ILIKE fallback
      const searchPattern = `%${searchQuery}%`

      // 1. Search Transactions
      try {
        let txQuery = supabase
          .from('transactions')
          .select('id, transaction_number, description, amount, currency, status, category_id, categories(name)')
          .or(`description.ilike.${searchPattern},transaction_number.ilike.${searchPattern},notes.ilike.${searchPattern}`)
          .limit(20)

        if (targetFacilityId) {
          txQuery = txQuery.eq('facility_id', targetFacilityId)
        }

        const { data: transactions } = await txQuery

        transactions?.forEach((tx: any) => {
          const score = calculateScore(searchQuery, tx.description || tx.transaction_number || '')
          if (score > 0) {
            results.push({
              id: tx.id,
              type: 'transaction',
              title: tx.description || tx.transaction_number,
              description: `${tx.categories?.name || 'Kategori'} • ${tx.amount} ${tx.currency}`,
              url: `/finance/transactions/${tx.id}`,
              metadata: { amount: tx.amount, currency: tx.currency, status: tx.status },
              score,
            })
          }
        })
      } catch (error) {
        console.warn('Transaction search error:', error)
      }

      // 2. Search Employees
      try {
        let empQuery = supabase
          .from('employees')
          .select('id, first_name, last_name, email, position, department, code')
          .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},position.ilike.${searchPattern},department.ilike.${searchPattern}`)
          .limit(20)

        if (targetFacilityId) {
          empQuery = empQuery.eq('facility_id', targetFacilityId)
        }

        const { data: employees } = await empQuery

        employees?.forEach((emp: any) => {
          const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
          const score = calculateScore(searchQuery, fullName || emp.email || '')
          if (score > 0) {
            results.push({
              id: emp.id,
              type: 'employee',
              title: fullName || emp.email,
              description: `${emp.position || '-'} • ${emp.department || '-'}`,
              url: `/hr/employees/${emp.id}`,
              metadata: { code: emp.code, email: emp.email },
              score,
            })
          }
        })
      } catch (error) {
        console.warn('Employee search error:', error)
      }

      // 3. Search Projects
      try {
        let projQuery = supabase
          .from('projects')
          .select('id, name, description, code, status')
          .or(`name.ilike.${searchPattern},description.ilike.${searchPattern},code.ilike.${searchPattern}`)
          .limit(20)

        if (targetFacilityId) {
          projQuery = projQuery.eq('facility_id', targetFacilityId)
        }

        const { data: projects } = await projQuery

        projects?.forEach((project: any) => {
          const score = calculateScore(searchQuery, project.name || project.description || '')
          if (score > 0) {
            results.push({
              id: project.id,
              type: 'project',
              title: project.name,
              description: project.description || `${project.status} • ${project.code}`,
              url: `/projects/${project.id}`,
              metadata: { status: project.status, code: project.code },
              score,
            })
          }
        })
      } catch (error) {
        console.warn('Project search error:', error)
      }

      // 4. Search Leave Requests
      try {
        let leaveQuery = supabase
          .from('leave_requests')
          .select('id, reason, leave_type, start_date, end_date, status, employee_id, employees(first_name, last_name)')
          .or(`reason.ilike.${searchPattern},leave_type.ilike.${searchPattern}`)
          .limit(20)

        if (targetFacilityId) {
          leaveQuery = leaveQuery.eq('facility_id', targetFacilityId)
        }

        const { data: leaves } = await leaveQuery

        leaves?.forEach((leave: any) => {
          const empName = leave.employees ? `${leave.employees.first_name} ${leave.employees.last_name}` : 'İzin Talebi'
          const score = calculateScore(searchQuery, leave.reason || leave.leave_type || '')
          if (score > 0) {
            results.push({
              id: leave.id,
              type: 'leave',
              title: empName,
              description: `${leave.leave_type} • ${leave.start_date} - ${leave.end_date}`,
              url: `/hr/leaves`,
              metadata: { status: leave.status },
              score,
            })
          }
        })
      } catch (error) {
        console.warn('Leave search error:', error)
      }

      // 5. Search Qurban Campaigns
      try {
        let campaignQuery = supabase
          .from('qurban_campaigns')
          .select('id, name, description, status, target_amount, currency')
          .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .limit(20)

        if (targetFacilityId) {
          campaignQuery = campaignQuery.eq('facility_id', targetFacilityId)
        }

        const { data: campaigns } = await campaignQuery

        campaigns?.forEach((campaign: any) => {
          const score = calculateScore(searchQuery, campaign.name || '')
          if (score > 0) {
            results.push({
              id: campaign.id,
              type: 'qurban',
              title: campaign.name,
              description: `${campaign.status} • ${campaign.target_amount} ${campaign.currency}`,
              url: `/qurban`,
              metadata: { status: campaign.status },
              score,
            })
          }
        })
      } catch (error) {
        console.warn('Campaign search error:', error)
      }

      // 6. Search Approval Requests
      try {
        let approvalQuery = supabase
          .from('approval_requests')
          .select('id, title, description, module, status, priority')
          .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
          .limit(20)

        if (targetFacilityId) {
          approvalQuery = approvalQuery.eq('facility_id', targetFacilityId)
        }

        const { data: approvals } = await approvalQuery

        approvals?.forEach((approval: any) => {
          const score = calculateScore(searchQuery, approval.title || approval.description || '')
          if (score > 0) {
            results.push({
              id: approval.id,
              type: 'approval',
              title: approval.title,
              description: `${approval.module} • ${approval.status}`,
              url: `/approvals`,
              metadata: { status: approval.status, priority: approval.priority },
              score,
            })
          }
        })
      } catch (error) {
        console.warn('Approval search error:', error)
      }
    } catch (error) {
      console.error('Global search error:', error)
    }

    // Score'a göre sırala ve limit uygula
    results.sort((a, b) => b.score - a.score)
    const topResults = results.slice(0, limit)

    // Grupla
    const grouped: Record<string, SearchResultGroup> = {}
    
    const typeLabels: Record<SearchResult['type'], { label: string; icon: string }> = {
      transaction: { label: 'Finans İşlemleri', icon: 'Receipt' },
      employee: { label: 'Çalışanlar', icon: 'UserCircle' },
      leave: { label: 'İzin Talepleri', icon: 'CalendarBlank' },
      project: { label: 'Projeler', icon: 'FolderOpen' },
      qurban: { label: 'Kurban Kampanyaları', icon: 'Cow' },
      approval: { label: 'Onaylar', icon: 'CheckCircle' },
    }

    topResults.forEach(result => {
      if (!grouped[result.type]) {
        grouped[result.type] = {
          type: result.type,
          label: typeLabels[result.type].label,
          icon: typeLabels[result.type].icon,
          results: [],
        }
      }
      grouped[result.type].results.push(result)
    })

    return Object.values(grouped)
  },
}

