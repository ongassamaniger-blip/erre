import { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formsService } from '@/services/formsService'
import { FormTemplateCode, FormField as FormFieldType } from '@/types/forms'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'

interface DynamicFormProps {
  templateCode: FormTemplateCode
  tenantId: string
  locale?: 'tr' | 'en' | 'fr' | 'ar'
  values?: Record<string, any>
  onChange?: (key: string, value: any) => void
  errors?: Record<string, string>
  userRole?: string
}

export function DynamicForm({
  templateCode,
  tenantId,
  locale = 'tr',
  values = {},
  onChange,
  errors = {},
  userRole
}: DynamicFormProps) {
  const { data: template, isLoading } = useQuery({
    queryKey: ['form-template', templateCode, tenantId],
    queryFn: () => formsService.getFormTemplateByCode(templateCode, tenantId),
    enabled: !!tenantId
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Form şablonu yüklenemedi
      </div>
    )
  }

  const visibleFields = template.fields
    .filter(field => {
      if (!field.visible) return false
      
      if (field.onlyRoles && field.onlyRoles.length > 0 && userRole) {
        if (!field.onlyRoles.includes(userRole)) return false
      }
      
      if (field.showIf) {
        const conditionValue = values[field.showIf.fieldKey]
        if (conditionValue !== field.showIf.equals) return false
      }
      
      return true
    })
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      {visibleFields.map(field => (
        <FormField
          key={field.id}
          field={field}
          locale={locale}
          value={values[field.key]}
          onChange={(value) => onChange?.(field.key, value)}
          error={errors[field.key]}
        />
      ))}
    </div>
  )
}

interface FormFieldProps {
  field: FormFieldType
  locale: 'tr' | 'en' | 'fr' | 'ar'
  value?: any
  onChange?: (value: any) => void
  error?: string
}

function FormField({ field, locale, value, onChange, error }: FormFieldProps) {
  const label = field.label[locale] || field.label.tr || field.key
  const placeholder = field.placeholder?.[locale] || field.placeholder?.tr || ''

  const renderInput = (): ReactNode => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'textarea':
        return (
          <Textarea
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'number':
        return (
          <Input
            id={field.key}
            type="number"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'date':
        return (
          <Input
            id={field.key}
            type="date"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'datetime':
        return (
          <Input
            id={field.key}
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger id={field.key} className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.optionsStatic?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label[locale] || option.label.tr || option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            {field.optionsStatic?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.key}-${option.value}`} />
                <Label htmlFor={`${field.key}-${option.value}`} className="font-normal">
                  {option.label[locale] || option.label.tr || option.value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.key} className="font-normal">
              {label}
            </Label>
          </div>
        )

      case 'file':
        return (
          <Input
            id={field.key}
            type="file"
            multiple
            onChange={(e) => onChange?.(Array.from(e.target.files || []))}
            className={error ? 'border-destructive' : ''}
          />
        )

      default:
        return (
          <Input
            id={field.key}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={error ? 'border-destructive' : ''}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      {field.type !== 'checkbox' && (
        <Label htmlFor={field.key}>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
