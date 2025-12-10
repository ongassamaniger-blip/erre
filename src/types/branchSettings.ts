export interface BranchGeneralSettings {
  name: string
  code: string
  location: string
  logo?: string
  description?: string
  taxId?: string
  registrationNumber?: string
}

export interface BranchContactSettings {
  phone: string
  email: string
  website?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export interface Currency {
  code: string
  name: string
  symbol: string
  isDefault: boolean
}

export interface BranchFinancialSettings {
  defaultCurrency: string
  fiscalYearStart: string // MM-DD format
  fiscalYearEnd: string // MM-DD format
  taxRate?: number
  invoicePrefix?: string
  invoiceNumberFormat?: string
  currencies?: Currency[] // Para birimleri listesi
}

export interface BranchRegionalSettings {
  timezone: string
  dateFormat: string // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: string // '12h' | '24h'
  language: string
  firstDayOfWeek: number // 0 = Sunday, 1 = Monday
}

export interface BranchNotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  approvalNotifications: boolean
  reminderNotifications: boolean
  reportNotifications: boolean
  notificationEmail?: string
}

export interface BranchReportSettings {
  defaultReportFormat: 'pdf' | 'excel' | 'both'
  autoGenerateReports: boolean
  reportSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    day?: number
    time?: string
  }
  reportRecipients?: string[]
}

export interface BranchSecuritySettings {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expirationDays?: number
  }
  sessionTimeout: number // minutes
  twoFactorAuth: boolean
  ipWhitelist?: string[]
}

export interface BranchExportSettings {
  defaultPdfFormat: 'a4' | 'letter'
  defaultExcelFormat: 'xlsx' | 'xls'
  includeHeaders: boolean
  includeFooters: boolean
  includePageNumbers: boolean
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  numberFormat: 'tr-TR' | 'en-US' | 'fr-FR'
  currencySymbol: '₺' | '$' | '€' | '£'
  autoOpenAfterExport: boolean
}

export interface BranchSettings {
  id: string
  facilityId: string
  general: BranchGeneralSettings
  contact: BranchContactSettings
  financial: BranchFinancialSettings
  regional: BranchRegionalSettings
  notifications: BranchNotificationSettings
  reports: BranchReportSettings
  security: BranchSecuritySettings
  export?: BranchExportSettings
  updatedAt: string
  updatedBy: string
}

