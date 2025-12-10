export type FormTemplateCode =
  | 'finance.transaction'
  | 'projects.project'
  | 'qurban.sacrifice'
  | 'hr.leave'

export type Locale = 'tr' | 'en' | 'fr' | 'ar'

export type TranslatedText = {
  [locale: string]: string
}

export type FormFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'date'
  | 'datetime'
  | 'checkbox'
  | 'radio'
  | 'file'

export interface FormFieldOption {
  value: string
  label: TranslatedText
}

export interface FormFieldCondition {
  fieldKey: string
  equals: string | number | boolean
}

export interface FormField {
  id: string
  name: TranslatedText
  key: string
  type: FormFieldType
  required: boolean
  placeholder?: TranslatedText
  helpText?: TranslatedText
  defaultValue?: string | number | boolean
  options?: FormFieldOption[]
  optionsStatic?: FormFieldOption[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    minLength?: number
    maxLength?: number
  }
  conditional?: FormFieldCondition
  order: number
  section?: string
  width?: 'full' | 'half' | 'third'
  visible?: boolean
  label?: TranslatedText
  onlyRoles?: string[]
  showIf?: FormFieldCondition
}

export interface FormTemplate {
  id: string
  code: FormTemplateCode
  name: TranslatedText
  description: TranslatedText
  tenantScope: 'GLOBAL' | 'TENANT'
  tenantId?: string
  fields: FormField[]
  version: number
  updatedAt: string
  updatedBy?: string
}















