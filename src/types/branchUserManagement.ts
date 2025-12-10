export type BranchRole = 
  | 'Branch Manager'      // Şube Müdürü
  | 'Finance Manager'     // Finans Müdürü
  | 'HR Manager'          // İK Müdürü
  | 'Project Manager'     // Proje Müdürü
  | 'Accountant'          // Muhasebeci
  | 'HR Specialist'       // İK Uzmanı
  | 'Project Coordinator' // Proje Koordinatörü
  | 'Staff'               // Personel
  | 'Viewer'              // Görüntüleyici

export interface BranchUser {
  id: string
  facilityId: string
  email: string
  name: string
  avatar?: string
  role: BranchRole
  department?: string
  position?: string
  phone?: string
  isActive: boolean
  reportsTo?: string // Üst yönetici ID'si (hiyerarşi)
  permissions: BranchUserPermissions
  createdAt: string
  createdBy: string
  updatedAt: string
  lastLogin?: string
}

export interface BranchUserPermissions {
  // Modül izinleri
  finance: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
  }
  hr: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
  }
  projects: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
  }
  qurban: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    approve: boolean
  }
  reports: {
    view: boolean
    create: boolean
    export: boolean
  }
  approvals: {
    view: boolean
    approve: boolean
    reject: boolean
  }
  calendar: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
  }
  settings: {
    view: boolean
    edit: boolean
  }
}

export interface BranchRoleDefinition {
  id: string
  name: BranchRole
  description: string
  permissions: BranchUserPermissions
  isSystemRole: boolean // Sistem rolü mü yoksa özel rol mü
  facilityId: string
  createdAt: string
  createdBy: string
}

export interface BranchUserHierarchy {
  userId: string
  userName: string
  role: BranchRole
  reportsTo?: string
  subordinates: BranchUserHierarchy[]
  level: number
}

