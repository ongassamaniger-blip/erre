import type { Locale, TranslatedText } from './forms'

export type PrintTemplateCode =
  | 'finance.transaction'
  | 'finance.budget'
  | 'hr.payslip'
  | 'hr.employee'
  | 'qurban.certificate'
  | 'projects.summary'

export type PrintSectionType = 'header' | 'body' | 'footer' | 'signatures'

export interface PrintField {
  id: string
  key: string
  label: TranslatedText
  section: PrintSectionType
  visible: boolean
  order: number
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  italic?: boolean
  width?: number | null
}

export interface PrintTemplate {
  id: string
  code: PrintTemplateCode
  name: TranslatedText
  tenantScope: 'GLOBAL' | 'TENANT'
  tenantId?: string
  headerFields: PrintField[]
  bodyFields: PrintField[]
  footerFields: PrintField[]
  signatureFields: PrintField[]
  pageOrientation: 'portrait' | 'landscape'
  showLogo: boolean
  logoPosition: 'left' | 'center' | 'right'
  showPageNumber: boolean
  version: number
  updatedAt: string
  updatedBy?: string
}

export { type Locale, type TranslatedText }
