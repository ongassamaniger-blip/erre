export type TransactionType = 'income' | 'expense' | 'transfer'
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'draft'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'check'
export type Currency = 'TRY' | 'USD' | 'EUR' | 'SAR' | 'GBP'

export interface Transaction {
  id: string
  code: string
  type: TransactionType
  date: string
  amount: number
  currency: Currency
  exchangeRate?: number
  amountInBaseCurrency: number
  categoryId: string
  categoryName: string
  title: string
  description: string
  vendorCustomerId?: string
  vendorCustomerName?: string
  projectId?: string
  projectName?: string
  departmentId?: string
  departmentName?: string
  paymentMethod: PaymentMethod
  status: TransactionStatus
  documents: TransactionDocument[]
  notes?: string
  facilityId: string // Şube ID'si
  createdBy: string
  createdAt: string
  updatedAt: string
  approvalSteps?: ApprovalStep[]
  activityLog?: ActivityLogEntry[]
  categories?: { name: string }
  vendors_customers?: { name: string }
  departments?: { name: string }
  projects?: { name: string }
}

export interface TransactionDocument {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt: string
}

export interface ApprovalStep {
  id: string
  stepName: string
  approverName: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected'
  date?: string
  note?: string
}

export interface ActivityLogEntry {
  id: string
  action: string
  userName: string
  date: string
  details?: string
}

export interface TransactionFilters {
  startDate?: string
  endDate?: string
  type?: TransactionType
  categoryId?: string
  status?: TransactionStatus
  approvalStatus?: TransactionStatus
  search?: string
  minAmount?: number
  maxAmount?: number
  vendorCustomerId?: string
  projectId?: string
  departmentId?: string
  facilityId?: string // Şube ID'si
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Category {
  id: string
  name: string
  parentId?: string
  type: TransactionType
  color: string
  icon?: string
  description?: string
  facility_id?: string | null
  is_system?: boolean
  created_at?: string
  updated_at?: string
}

export interface VendorCustomer {
  id: string
  name: string
  type: 'vendor' | 'customer'
  taxNumber?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  contactPerson?: string
  notes?: string
  facility_id?: string
  isActive?: boolean
  status?: 'pending' | 'approved' | 'rejected' | 'archived'
}

export interface Project {
  id: string
  name: string
  code: string
  status: 'active' | 'completed' | 'on_hold'
}

export interface Department {
  id: string
  name: string
  code: string
}

export interface Budget {
  id: string
  code: string
  name: string
  year: number
  period: 'yearly' | 'quarterly' | 'monthly'
  periodLabel: string
  scope: 'department' | 'project' | 'category'
  scopeId: string
  scopeName: string
  amount: number
  spent: number
  remaining: number
  usagePercentage: number
  status: 'active' | 'completed' | 'exceeded' | 'draft' | 'cancelled' | 'pending'
  currency: Currency
  startDate: string
  endDate: string
  facilityId: string // Şube ID'si
  createdAt: string
  updatedAt: string
}

export interface BudgetFilters {
  year?: number
  period?: Budget['period']
  departmentId?: string
  projectId?: string
  status?: Budget['status']
  scope?: Budget['scope']
  facilityId?: string // Şube ID'si
  statuses?: Budget['status'][]
}

export interface BudgetSpending {
  date?: string
  amount: number
  cumulative?: number
  categoryId?: string
  categoryName?: string
  percentage?: number
}

export interface CreateTransactionDTO {
  type: TransactionType
  date: string
  amount: number
  currency: Currency
  exchangeRate?: number
  amountInBaseCurrency?: number
  categoryId: string
  title?: string
  description: string
  vendorCustomerId?: string
  projectId?: string
  departmentId?: string
  paymentMethod: PaymentMethod
  documents: File[]
  notes?: string
  transactionNumber?: string
  receiptUrl?: string
  status: TransactionStatus
  approvalStatus?: TransactionStatus
  facilityId: string // Şube ID'si
}

export interface UpdateTransactionDTO extends Partial<CreateTransactionDTO> {
  id: string
}

export interface CreateBudgetDTO {
  name: string
  year: number
  period: Budget['period']
  scope: Budget['scope']
  scopeId: string
  amount: number
  currency: Currency
  startDate: string
  endDate: string
  status?: Budget['status']
  facilityId: string
}

export interface UpdateBudgetDTO extends Partial<CreateBudgetDTO> {
  id: string
}

export interface BudgetTransfer {
  id: string
  code: string
  fromFacilityId: string // Genel Merkez
  toFacilityId: string // Şube
  amount: number
  currency: Currency
  exchangeRate?: number // Döviz kuru
  amountInTry?: number // TRY karşılığı
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  completedAt?: string
  transferDate: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface BudgetTransferRequest {
  toFacilityId: string
  amount: number
  currency: Currency
  description?: string
  transferDate?: string
}

export interface BudgetTransferFilters {
  fromFacilityId?: string
  toFacilityId?: string
  status?: BudgetTransfer['status']
  dateFrom?: string
  dateTo?: string
}

export interface ChartAccount {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  parentId?: string
  level: number
  isActive: boolean
  balance: number
  currency: string
  description?: string
  children?: ChartAccount[]
  facilityId: string
}
