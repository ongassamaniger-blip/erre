import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { PrintTemplate } from '@/types/printTemplates'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TemplatePreviewProps {
  template: PrintTemplate
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const templateName = typeof template.name === 'string'
    ? template.name
    : template.name.tr || template.name.en

  const getFieldLabel = (field: any) => {
    return typeof field.label === 'string'
      ? field.label
      : field.label.tr || field.label.en || field.key
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📄 Önizleme</span>
            <Badge variant="secondary" className="text-xs font-normal">
              Temsili Veri
            </Badge>
          </div>
          <Badge variant="outline" className="capitalize">
            {template.pageOrientation === 'portrait' ? 'Dikey' : 'Yatay'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`
            bg-white border-2 border-gray-300 shadow-lg p-6
            ${template.pageOrientation === 'landscape' ? 'aspect-[16/9]' : 'aspect-[1/1.414]'}
            min-h-[400px]
          `}
          style={{
            maxWidth: template.pageOrientation === 'landscape' ? '100%' : '210mm',
            margin: '0 auto',
          }}
        >
          {/* Logo */}
          {template.showLogo && (
            <div
              className={`
                mb-4 flex
                ${template.logoPosition === 'left' ? 'justify-start' : ''}
                ${template.logoPosition === 'center' ? 'justify-center' : ''}
                ${template.logoPosition === 'right' ? 'justify-end' : ''}
              `}
            >
              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                LOGO
              </div>
            </div>
          )}

          {/* Header Fields */}
          {template.headerFields.filter(f => f.visible).length > 0 && (
            <div className="mb-6 space-y-2 border-b pb-4">
              {template.headerFields
                .filter(f => f.visible)
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div
                    key={field.id}
                    className={`
                      ${field.align === 'center' ? 'text-center' : ''}
                      ${field.align === 'right' ? 'text-right' : ''}
                      ${field.bold ? 'font-bold' : ''}
                      ${field.italic ? 'italic' : ''}
                    `}
                  >
                    <span className="text-xs text-gray-500">{getFieldLabel(field)}:</span>{' '}
                    <span className="text-sm">
                      {field.key === 'organizationName' && 'Örnek Organizasyon Adı'}
                      {field.key === 'documentTitle' && templateName}
                      {field.key === 'printDate' && format(new Date(), 'dd MMMM yyyy', { locale: tr })}
                      {field.key === 'documentNumber' && 'DOC-2025-001'}
                      {!['organizationName', 'documentTitle', 'printDate', 'documentNumber'].includes(field.key) &&
                        `Örnek ${getFieldLabel(field)}`}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Body Fields - Table */}
          {template.bodyFields.filter(f => f.visible).length > 0 && (
            <div className="mb-6">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    {template.bodyFields
                      .filter(f => f.visible)
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <th
                          key={field.id}
                          className={`
                            border border-gray-300 p-2
                            ${field.align === 'center' ? 'text-center' : ''}
                            ${field.align === 'right' ? 'text-right' : ''}
                            ${field.bold ? 'font-bold' : ''}
                          `}
                          style={{ width: field.width ? `${field.width}mm` : 'auto' }}
                        >
                          {getFieldLabel(field)}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {template.bodyFields
                      .filter(f => f.visible)
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <td
                          key={field.id}
                          className={`
                            border border-gray-300 p-2
                            ${field.align === 'center' ? 'text-center' : ''}
                            ${field.align === 'right' ? 'text-right' : ''}
                          `}
                        >
                          {field.key.includes('amount') || field.key.includes('price')
                            ? '1.234,56 ₺'
                            : field.key.includes('date')
                              ? format(new Date(), 'dd.MM.yyyy', { locale: tr })
                              : `Örnek ${getFieldLabel(field)}`}
                        </td>
                      ))}
                  </tr>
                  <tr>
                    {template.bodyFields
                      .filter(f => f.visible)
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <td
                          key={field.id}
                          className={`
                            border border-gray-300 p-2
                            ${field.align === 'center' ? 'text-center' : ''}
                            ${field.align === 'right' ? 'text-right' : ''}
                          `}
                        >
                          {field.key.includes('amount') || field.key.includes('price')
                            ? '2.345,67 ₺'
                            : field.key.includes('date')
                              ? format(new Date(), 'dd.MM.yyyy', { locale: tr })
                              : `Örnek ${getFieldLabel(field)} 2`}
                        </td>
                      ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Fields */}
          {template.footerFields.filter(f => f.visible).length > 0 && (
            <div className="mt-auto pt-4 border-t space-y-1 text-xs">
              {template.footerFields
                .filter(f => f.visible)
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div
                    key={field.id}
                    className={`
                      ${field.align === 'center' ? 'text-center' : ''}
                      ${field.align === 'right' ? 'text-right' : ''}
                      ${field.bold ? 'font-bold' : ''}
                      ${field.italic ? 'italic' : ''}
                    `}
                  >
                    {getFieldLabel(field)}
                  </div>
                ))}
            </div>
          )}

          {/* Signature Fields */}
          {template.signatureFields.filter(f => f.visible).length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-8">
                {template.signatureFields
                  .filter(f => f.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id} className="space-y-2">
                      <div className="border-b border-gray-400 h-12"></div>
                      <div className="text-xs text-center">
                        {getFieldLabel(field)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Page Number */}
          {template.showPageNumber && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Sayfa 1
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

