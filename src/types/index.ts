export * from './calendar'
export * from './notifications'
export * from './branchSettings'
export * from './branchUserManagement'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'Super Admin' | 'Admin' | 'Manager' | 'User'
  facilityAccess: string[]
}

export type ModuleType = 'finance' | 'hr' | 'qurban' | 'projects'

export interface Facility {
  id: string
  code: string
  name: string
  location: string
  type: 'headquarters' | 'branch'
  userRole?: string
  parentFacilityId?: string // Şubeler için genel merkez ID'si
  enabledModules?: ModuleType[] // Şubeler için aktif modüller (genel merkez tarafından yönetilir)
  settings?: any // BranchSettings type (circular dependency prevention)
}

export interface DashboardMetrics {
  totalRevenue: number
  totalExpense: number
  pendingApprovals: number
  activeEmployees: number
  revenueChange: number
  expenseChange: number
}

export interface MonthlyData {
  month: string
  revenue: number
  expense: number
}

export interface CategoryExpense {
  category: string
  amount: number
  percentage: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  status: 'completed' | 'pending' | 'cancelled'
}

export interface Payment {
  id: string
  description: string
  amount: number
  dueDate: string
  status: 'overdue' | 'due-soon' | 'upcoming'
  recipient: string
}



export interface Project {
  id: string
  code: string
  name: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'pending_approval' | 'rejected' | 'cancelled'
  description: string
  managerId: string
  managerName: string
  managerAvatar?: string
  startDate: string
  endDate: string
  progress: number
  budget: number
  spent: number
  collected: number
  currency: string
  facilityId: string
  type?: string
  typeId?: string
  category?: string
  categoryId?: string
  teamSize: number
  taskCount: number
  completedTasks: number
  overdueTasks: number
  isDeleted?: boolean
}

export interface Task {
  id: string
  projectId: string
  name: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigneeId?: string
  assigneeName?: string
  assigneeAvatar?: string
  startDate?: string
  dueDate?: string
  progress: number
  tags: string[]
}

export interface Milestone {
  id: string
  projectId: string
  name: string
  description: string
  targetDate: string
  status: 'upcoming' | 'in-progress' | 'completed' | 'delayed'
  completedDate?: string
}

export interface ProjectTeamMember {
  id: string
  projectId: string
  employeeId: string
  employeeName: string
  employeeAvatar?: string
  role: string
  allocation: number
}

export interface ProjectDocument {
  id: string
  projectId: string
  name: string
  type: string
  size: number
  uploadDate: string
  uploadedBy: string
  category: 'contracts' | 'reports' | 'other'
  url: string
}

export interface ProjectActivity {
  id: string
  projectId: string
  type: 'task_created' | 'task_completed' | 'task_deleted' | 'status_changed' | 'member_added' | 'member_removed' | 'comment_added' | 'project_updated' | 'budget_updated'
  description: string
  userId: string
  userName: string
  timestamp: string
}

export interface QurbanCampaign {
  id: string
  name: string
  year: number
  status: 'active' | 'planning' | 'completed' | 'archived' | 'pending_approval' | 'rejected'
  campaignType: 'small_cattle' | 'large_cattle'
  targetAmount: number
  collectedAmount: number
  targetAnimals: number
  completedAnimals: number
  startDate: string
  endDate: string
  slaughterStartDate: string
  slaughterEndDate: string
  description: string
  currency: string
  facilityId?: string // Şube ID'si
}

export interface QurbanDonation {
  id: string
  campaignId: string
  campaignName: string
  donorName: string
  donorPhone: string
  donorEmail: string
  donorCountry: string
  qurbanType: 'sheep' | 'goat' | 'cow-share' | 'camel-share'
  shareCount: number
  amount: number
  currency: string
  paymentMethod: string
  paymentStatus: 'paid' | 'pending'
  distributionRegion: string
  hasProxy: boolean
  proxyText?: string
  specialRequests?: string
  status: 'processed' | 'pending'
  createdDate: string
  facilityId?: string // Şube ID'si
  deliveryAddress?: string
  exchangeRate?: number
  amountInTry?: number
}

export interface QurbanSchedule {
  id: string
  date: string
  startTime: string
  endTime: string
  location: string
  plannedCount: number
  completedCount: number
  campaignIds: string[]
  teamMembers: string[]
  responsible: string
  status: 'scheduled' | 'in-progress' | 'completed'
  notes?: string
  facilityId?: string // Şube ID'si
}

export interface DistributionRecord {
  id: string
  date: string
  facilityId?: string // Şube ID'si
  campaignId: string
  campaignName: string
  distributionType: 'bulk' | 'individual' // Toplu veya kişisel dağıtım
  // Toplu dağıtım için
  region: string
  packageCount: number // Paket sayısı
  totalWeight: number // Toplam ağırlık (kg)
  averageWeightPerPackage?: number // Paket başına ortalama ağırlık
  distributionList?: string // Dağıtım listesi (JSON string veya metin)
  // Kişisel dağıtım için (eski yapı ile uyumluluk)
  packageNumber?: string
  recipientName?: string
  recipientCode?: string
  weight?: number // Tek paket ağırlığı
  // Ortak alanlar
  status: 'delivered' | 'pending'
  receivedBy?: string
  signature?: string
  photo?: string
  notes?: string
}

export * from './reports'
export * from './approvals'
export * from './notifications'
// export * from './settings' // Settings modülü kaldırıldı - daha sonra sıfırdan kurulacak
export * from './dashboard'
