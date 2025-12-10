import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DotsSixVertical, Eye, EyeSlash, Eye as EyeIcon } from '@phosphor-icons/react'
import type { PrintTemplate, PrintField } from '@/types/printTemplates'
import { toast } from 'sonner'
import { TemplatePreview } from './TemplatePreview'

interface TemplateFieldEditorProps {
  template: PrintTemplate
  onUpdate: (template: PrintTemplate) => void
}

export function TemplateFieldEditor({ template, onUpdate }: TemplateFieldEditorProps) {
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [draggedSection, setDraggedSection] = useState<
    'headerFields' | 'bodyFields' | 'footerFields' | 'signatureFields' | null
  >(null)

  const handleDragStart = (
    e: React.DragEvent,
    fieldId: string,
    section: 'headerFields' | 'bodyFields' | 'footerFields' | 'signatureFields'
  ) => {
    setDraggedField(fieldId)
    setDraggedSection(section)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (
    e: React.DragEvent,
    targetFieldId: string,
    targetSection: 'headerFields' | 'bodyFields' | 'footerFields' | 'signatureFields'
  ) => {
    e.preventDefault()
    if (!draggedField || !draggedSection) return

    const updatedTemplate = { ...template }
    const sourceFields = [...updatedTemplate[draggedSection]]
    const targetFields = [...updatedTemplate[targetSection]]

    const draggedIndex = sourceFields.findIndex(f => f.id === draggedField)
    const targetIndex = targetFields.findIndex(f => f.id === targetFieldId)

    if (draggedIndex === -1) return

    const draggedFieldData = sourceFields[draggedIndex]

    if (draggedSection === targetSection) {
      // Aynı section içinde sıralama
      sourceFields.splice(draggedIndex, 1)
      sourceFields.splice(targetIndex, 0, draggedFieldData)
      updatedTemplate[draggedSection] = sourceFields.map((f, i) => ({
        ...f,
        order: i,
      }))
    } else {
      // Farklı section'a taşıma
      sourceFields.splice(draggedIndex, 1)
      targetFields.splice(targetIndex, 0, draggedFieldData)
      updatedTemplate[draggedSection] = sourceFields.map((f, i) => ({
        ...f,
        order: i,
      }))
      updatedTemplate[targetSection] = targetFields.map((f, i) => ({
        ...f,
        order: i,
      }))
    }

    onUpdate(updatedTemplate)
    setDraggedField(null)
    setDraggedSection(null)
    toast.success('Alan sırası güncellendi')
  }

  const handleToggleVisibility = (
    fieldId: string,
    section: 'headerFields' | 'bodyFields' | 'footerFields' | 'signatureFields'
  ) => {
    const updatedTemplate = { ...template }
    const field = updatedTemplate[section].find(f => f.id === fieldId)
    if (field) {
      field.visible = !field.visible
      onUpdate(updatedTemplate)
    }
  }

  const handleUpdateField = (
    fieldId: string,
    section: 'headerFields' | 'bodyFields' | 'footerFields' | 'signatureFields',
    updates: Partial<PrintField>
  ) => {
    const updatedTemplate = { ...template }
    const field = updatedTemplate[section].find(f => f.id === fieldId)
    if (field) {
      Object.assign(field, updates)
      onUpdate(updatedTemplate)
    }
  }

  const renderField = (
    field: PrintField,
    section: 'headerFields' | 'bodyFields' | 'footerFields' | 'signatureFields',
    index: number
  ) => {
    const isDragging = draggedField === field.id && draggedSection === section

    return (
      <div
        key={field.id}
        draggable
        onDragStart={e => handleDragStart(e, field.id, section)}
        onDragOver={handleDragOver}
        onDrop={e => handleDrop(e, field.id, section)}
        className={`
          flex items-center gap-3 p-3 rounded-lg border transition-all
          ${isDragging ? 'opacity-50 bg-primary/10' : 'bg-background hover:bg-muted/50'}
          cursor-move
        `}
      >
            <DotsSixVertical size={20} className="text-muted-foreground" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {typeof field.label === 'string' ? field.label : field.label.tr || field.label.en}
            </span>
            <Badge variant="outline" className="text-xs">
              {field.key}
            </Badge>
            {!field.visible && (
              <Badge variant="secondary" className="text-xs">
                Gizli
              </Badge>
            )}
          </div>
          {section === 'bodyFields' && (
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Genişlik:</Label>
                <Select
                  value={field.width?.toString() || 'auto'}
                  onValueChange={value =>
                    handleUpdateField(field.id, section, {
                      width: value === 'auto' ? null : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Otomatik</SelectItem>
                    <SelectItem value="50">50mm</SelectItem>
                    <SelectItem value="60">60mm</SelectItem>
                    <SelectItem value="70">70mm</SelectItem>
                    <SelectItem value="80">80mm</SelectItem>
                    <SelectItem value="100">100mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Hizalama:</Label>
                <Select
                  value={field.align || 'left'}
                  onValueChange={value =>
                    handleUpdateField(field.id, section, { align: value as any })
                  }
                >
                  <SelectTrigger className="h-8 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Sol</SelectItem>
                    <SelectItem value="center">Orta</SelectItem>
                    <SelectItem value="right">Sağ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleVisibility(field.id, section)}
            title={field.visible ? 'Gizle' : 'Göster'}
          >
            {field.visible ? <Eye size={16} /> : <EyeSlash size={16} />}
          </Button>
        </div>
      </div>
    )
  }

  const sections = [
    { key: 'headerFields' as const, title: 'Başlık Alanları', icon: '📋' },
    { key: 'bodyFields' as const, title: 'İçerik Alanları', icon: '📊' },
    { key: 'footerFields' as const, title: 'Alt Bilgi Alanları', icon: '📝' },
    { key: 'signatureFields' as const, title: 'İmza Alanları', icon: '✍️' },
  ]

  return (
    <Tabs defaultValue="fields" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="fields" className="gap-2">
          <DotsSixVertical size={16} />
          Alanları Düzenle
        </TabsTrigger>
        <TabsTrigger value="preview" className="gap-2">
          <EyeIcon size={16} />
          Önizleme
        </TabsTrigger>
      </TabsList>

      <TabsContent value="fields" className="space-y-6 mt-6">
        {sections.map(section => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>{section.icon}</span>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template[section.key].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Bu bölümde alan yok
                  </p>
                ) : (
                  template[section.key]
                    .sort((a, b) => a.order - b.order)
                    .map((field, index) => renderField(field, section.key, index))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="preview" className="mt-6">
        <TemplatePreview template={template} />
      </TabsContent>
    </Tabs>
  )
}

