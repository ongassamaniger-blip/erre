import { transactionService } from './finance/transactionService'
import { employeeService } from './employeeService'
import { leaveService } from './leaveService'
import { projectService } from './projects/projectService'
import { campaignService } from './qurban/qurbanService'
import { approvalService } from './approvalService'
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
  async search(query: string, limit: number = 10): Promise<SearchResultGroup[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const searchQuery = query.trim()
    const results: SearchResult[] = []

    try {
      // Finans İşlemleri
      const transactions = await transactionService.getTransactions({}, { page: 1, pageSize: 50 })
      transactions.data.forEach((tx: Transaction) => {
        const score = searchInObject(tx, searchQuery, searchableFields.transaction)
        if (score > 0) {
          results.push({
            id: tx.id,
            type: 'transaction',
            title: tx.title || tx.code,
            description: `${tx.categoryName} • ${tx.amount} ${tx.currency}`,
            url: `/finance/transactions/${tx.id}`,
            metadata: { amount: tx.amount, currency: tx.currency, status: tx.status },
            score,
          })
        }
      })

      // Çalışanlar
      const employees = await employeeService.getEmployees()
      employees.forEach((emp: Employee) => {
        const score = searchInObject(emp, searchQuery, searchableFields.employee)
        if (score > 0) {
          results.push({
            id: emp.id,
            type: 'employee',
            title: `${emp.firstName} ${emp.lastName}`,
            description: `${emp.position} • ${emp.department}`,
            url: `/hr/employees/${emp.id}`,
            metadata: { code: emp.code, email: emp.email },
            score,
          })
        }
      })

      // İzin Talepleri
      const leaves = await leaveService.getLeaves({})
      leaves.forEach((leave) => {
        const score = searchInObject(leave, searchQuery, searchableFields.leave)
        if (score > 0) {
          results.push({
            id: leave.id,
            type: 'leave',
            title: `${leave.employeeName || 'İzin Talebi'}`,
            description: `${leave.type} • ${leave.startDate} - ${leave.endDate}`,
            url: `/hr/leaves`,
            metadata: { status: leave.status },
            score,
          })
        }
      })

      // Projeler
      const projects = await projectService.getProjects()
      projects.forEach((project: Project) => {
        const score = searchInObject(project, searchQuery, searchableFields.project)
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

      // Kurban Kampanyaları
      const campaigns = await campaignService.getCampaigns()
      campaigns.forEach((campaign) => {
        const score = calculateScore(searchQuery, campaign.name || '')
        if (score > 0) {
          results.push({
            id: campaign.id,
            type: 'qurban',
            title: campaign.name,
            description: `${campaign.status} • ${campaign.targetAmount} ${campaign.currency}`,
            url: `/qurban`,
            metadata: { status: campaign.status },
            score,
          })
        }
      })

      // Onaylar
      const approvals = await approvalService.getApprovals()
      approvals.forEach((approval) => {
        const score = searchInObject(approval, searchQuery, searchableFields.approval)
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

