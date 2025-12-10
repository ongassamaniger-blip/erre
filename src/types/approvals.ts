export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type ApprovalPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ApprovalModule = 'finance' | 'hr' | 'projects' | 'qurban'

export interface ApprovalRequest {
  id: string
  module: ApprovalModule
  type: string
  title: string
  description: string
  amount?: number
  currency?: string
  exchangeRate?: number // Döviz kuru
  amountInTry?: number // TRY karşılığı
  requestedBy: {
    id: string
    name: string
    avatar?: string
  }
  requestedAt: string
  status: ApprovalStatus
  priority: ApprovalPriority
  deadline?: string
  currentApprover?: {
    id: string
    name: string
    role: string
  }
  metadata: Record<string, any>
  attachments?: {
    id: string
    name: string
    url: string
    type: string
  }[]
  history: ApprovalHistoryItem[]
  facilityId?: string // Şube ID'si
  relatedEntityId?: string // İlişkili entity ID'si (transaction, leave, project, vb.)
}

export interface ApprovalHistoryItem {
  id: string
  action: 'submitted' | 'approved' | 'rejected' | 'commented' | 'reassigned'
  actor: {
    id: string
    name: string
  }
  timestamp: string
  comment?: string
  metadata?: Record<string, any>
}

export interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  urgent: number
}
