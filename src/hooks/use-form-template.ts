import { useQuery } from '@tanstack/react-query'
import { formsService } from '@/services/formsService'
import { FormTemplateCode } from '@/types/forms'

export function useFormTemplate(code: FormTemplateCode, tenantId: string) {
  return useQuery({
    queryKey: ['form-template', code, tenantId],
    queryFn: () => formsService.getFormTemplateByCode(code, tenantId),
    enabled: !!tenantId
  })
}

export function useFormTemplates(tenantId: string) {
  return useQuery({
    queryKey: ['form-templates', tenantId],
    queryFn: () => formsService.getFormTemplates(tenantId),
    enabled: !!tenantId
  })
}
