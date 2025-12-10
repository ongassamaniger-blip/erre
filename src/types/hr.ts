export type EmploymentType = 'full-time' | 'part-time' | 'contract'
export type EmployeeStatus = 'active' | 'on-leave' | 'inactive'
export type Gender = 'male' | 'female' | 'other'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'
export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type PaymentFrequency = 'monthly' | 'bi-weekly' | 'weekly'

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface BankDetails {
  bankName: string
  iban: string
  accountHolderName: string
}

export interface SalaryInfo {
  amount: number
  currency: string
  frequency: PaymentFrequency
  paymentDate?: string
  bankDetails?: BankDetails
}

export interface LeaveEntitlement {
  type: LeaveType
  totalDays: number
  usedDays: number
  remainingDays: number
}

export interface Document {
  id: string
  name: string
  category: string
  uploadDate: string
  url: string
}

export interface Employee {
  id: string
  code: string
  firstName: string
  lastName: string
  photo?: string
  nationalId: string
  dateOfBirth: string
  nationality: string
  gender: Gender
  maritalStatus: MaritalStatus
  phone: string
  email: string
  address: string
  emergencyContact: EmergencyContact
  department: string
  position: string
  employmentType: EmploymentType
  status: EmployeeStatus
  hireDate: string
  probationEndDate?: string
  contractStartDate?: string
  contractEndDate?: string
  managerId?: string
  workingHours: string
  salary: SalaryInfo
  leaveEntitlements: LeaveEntitlement[]
  documents: Document[]
  facilityId: string // Şube ID'si
  iban?: string
  bankName?: string
  createdAt: string
  updatedAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  employeePhoto?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: LeaveStatus
  documentUrl?: string
  approverId?: string
  approverName?: string
  approvalDate?: string
  rejectionReason?: string
  facilityId: string // Şube ID'si
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  code: string
  managerId?: string
  managerName?: string
  employeeCount: number
  description?: string
  facilityId?: string // Şube ID'si
}

export interface Note {
  id: string
  content: string
  author: string
  createdAt: string
}

export interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
  author?: string
}

export interface EmployeeFilters {
  search?: string
  department?: string
  employmentType?: string
  status?: string
  facilityId?: string
}
