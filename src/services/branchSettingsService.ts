import type { BranchSettings, Currency } from '@/types/branchSettings'
import { supabase } from '@/lib/supabase'

const generateDefaultSettings = (facilityId: string, facilityName: string = '', facilityCode: string = ''): BranchSettings => {
  return {
    id: `settings-${facilityId}`,
    facilityId,
    general: {
      name: facilityName,
      code: facilityCode,
      location: '',
      description: '',
      taxId: '',
      registrationNumber: '',
    },
    contact: {
      phone: '',
      email: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Türkiye',
      },
    },
    financial: {
      defaultCurrency: 'TRY',
      fiscalYearStart: '01-01',
      fiscalYearEnd: '12-31',
      taxRate: 20,
      invoicePrefix: facilityCode || 'INV',
      invoiceNumberFormat: 'YYYY-{NUMBER}',
      currencies: [
        { code: 'TRY', name: 'Türk Lirası', symbol: '₺', isDefault: true },
        { code: 'USD', name: 'Amerikan Doları', symbol: '$', isDefault: false },
        { code: 'EUR', name: 'Euro', symbol: '€', isDefault: false },
        { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£', isDefault: false },
      ] as Currency[],
    },
    regional: {
      timezone: 'Europe/Istanbul',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'tr',
      firstDayOfWeek: 1, // Monday
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      approvalNotifications: true,
      reminderNotifications: true,
      reportNotifications: true,
      notificationEmail: '',
    },
    reports: {
      defaultReportFormat: 'pdf',
      autoGenerateReports: false,
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: 90,
      },
      sessionTimeout: 60,
      twoFactorAuth: false,
    },
    export: {
      defaultPdfFormat: 'a4',
      defaultExcelFormat: 'xlsx',
      includeHeaders: true,
      includeFooters: true,
      includePageNumbers: true,
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'tr-TR',
      currencySymbol: '₺',
      autoOpenAfterExport: false,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  }
}

export const branchSettingsService = {
  async getSettings(facilityId: string): Promise<BranchSettings> {
    try {
      // Fetch facility settings and basic info to populate defaults if needed
      const { data: facility, error } = await supabase
        .from('facilities')
        .select('id, name, code, settings')
        .eq('id', facilityId)
        .single()

      if (error) throw error

      // If settings exist and are not empty object, return them
      if (facility.settings && Object.keys(facility.settings).length > 0) {
        // Ensure facilityId matches (just in case)
        return { ...facility.settings, facilityId }
      }

      // If no settings, generate defaults
      const defaultSettings = generateDefaultSettings(facilityId, facility.name, facility.code)

      // Save defaults to DB so next fetch is faster
      // Save defaults to DB so next fetch is faster
      this.updateSettings(facilityId, defaultSettings).catch(err =>
        console.error('Error saving default settings:', err)
      )

      return defaultSettings
    } catch (error) {
      console.error('Error fetching settings:', error)
      // Fallback to defaults on error to prevent app crash
      return generateDefaultSettings(facilityId)
    }
  },

  async updateSettings(facilityId: string, updates: Partial<BranchSettings>): Promise<BranchSettings> {
    try {
      // First get current settings to merge
      const currentSettings = await this.getSettings(facilityId)

      const newSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date().toISOString(),
        // updatedBy would ideally come from auth context, but we'll leave it as is or update if passed
      }

      const { error } = await supabase
        .from('facilities')
        .update({ settings: newSettings })
        .eq('id', facilityId)

      if (error) throw error

      return newSettings
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  },

  async updateGeneralSettings(facilityId: string, general: Partial<BranchSettings['general']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      general: { ...settings.general, ...general },
    })
  },

  async updateContactSettings(facilityId: string, contact: Partial<BranchSettings['contact']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      contact: { ...settings.contact, ...contact },
    })
  },

  async updateFinancialSettings(facilityId: string, financial: Partial<BranchSettings['financial']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      financial: { ...settings.financial, ...financial },
    })
  },

  async updateRegionalSettings(facilityId: string, regional: Partial<BranchSettings['regional']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      regional: { ...settings.regional, ...regional },
    })
  },

  async updateNotificationSettings(facilityId: string, notifications: Partial<BranchSettings['notifications']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      notifications: { ...settings.notifications, ...notifications },
    })
  },

  async updateReportSettings(facilityId: string, reports: Partial<BranchSettings['reports']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      reports: { ...settings.reports, ...reports },
    })
  },

  async updateSecuritySettings(facilityId: string, security: Partial<BranchSettings['security']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      security: { ...settings.security, ...security },
    })
  },

  async updatePrintExportSettings(facilityId: string, printExport: Partial<BranchSettings['export']>): Promise<BranchSettings> {
    const settings = await this.getSettings(facilityId)
    return this.updateSettings(facilityId, {
      export: { ...settings.export, ...printExport } as BranchSettings['export'],
    })
  },
}
