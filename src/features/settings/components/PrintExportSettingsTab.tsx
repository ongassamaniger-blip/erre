import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Printer,
  FileArrowDown,
  Pencil,
  Eye,
  CheckCircle,
  XCircle,
  FilePdf,
  MicrosoftExcelLogo,
  Plus,
} from '@phosphor-icons/react'
import { printTemplatesService } from '@/services/printTemplates/printTemplatesService'
import type { PrintTemplate, PrintTemplateCode } from '@/types/printTemplates'
import { useAuthStore } from '@/store/authStore'
import { branchSettingsService } from '@/services/branchSettingsService'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { TemplateFieldEditor } from './TemplateFieldEditor'
import { CreateTemplateDialog } from './CreateTemplateDialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface PrintExportSettingsTabProps {
  facilityId: string
}

export function PrintExportSettingsTab({ facilityId }: PrintExportSettingsTabProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [activeView, setActiveView] = useState<'templates' | 'exports'>('templates')

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['print-templates', facilityId],
    queryFn: () => printTemplatesService.getPrintTemplates(facilityId),
    enabled: !!facilityId,
  })

  const updateTemplateMutation = useMutation({
    mutationFn: (template: PrintTemplate) =>
      printTemplatesService.updatePrintTemplate(template),
    onSuccess: () => {
      toast.success('Şablon başarıyla güncellendi')
      queryClient.invalidateQueries({ queryKey: ['print-templates'] })
      setSelectedTemplate(null)
    },
    onError: () => {
      toast.error('Şablon güncellenirken bir hata oluştu')
    },
  })

  const createOverrideMutation = useMutation({
    mutationFn: (code: PrintTemplateCode) => {
      // Önce global template'i bul
      const globalTemplate = templates.find(t => t.code === code && t.tenantScope === 'GLOBAL')
      if (!globalTemplate) {
        throw new Error('Global template bulunamadı')
      }
      return printTemplatesService.createTenantOverride(globalTemplate.id, facilityId)
    },
    onSuccess: () => {
      toast.success('Şube özel şablonu oluşturuldu')
      queryClient.invalidateQueries({ queryKey: ['print-templates'] })
    },
    onError: () => {
      toast.error('Şablon oluşturulurken bir hata oluştu')
    },
  })

  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null)
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [draggedTemplate, setDraggedTemplate] = useState<string | null>(null)
  const [templateOrder, setTemplateOrder] = useState<Map<string, number>>(new Map())

  const createTemplateMutation = useMutation({
    mutationFn: (template: any) => printTemplatesService.createTemplate(template),
    onSuccess: () => {
      toast.success('Yeni şablon oluşturuldu')
      queryClient.invalidateQueries({ queryKey: ['print-templates'] })
      setCreateDialogOpen(false)
    },
    onError: () => {
      toast.error('Şablon oluşturulurken bir hata oluştu')
    },
  })

  const handleEditTemplate = (template: PrintTemplate) => {
    setEditingTemplate(template)
    setFieldEditorOpen(true)
  }

  const handleTemplateFieldUpdate = (updatedTemplate: PrintTemplate) => {
    updateTemplateMutation.mutate(updatedTemplate)
  }

  const handleCreateTemplate = (template: any) => {
    createTemplateMutation.mutate(template)
  }

  const handleDragStart = (e: React.DragEvent, templateId: string) => {
    setDraggedTemplate(templateId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', templateId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetTemplateId: string) => {
    e.preventDefault()
    if (!draggedTemplate || draggedTemplate === targetTemplateId) return

    const templateArray = [...templates]
    const draggedIndex = templateArray.findIndex(t => t.id === draggedTemplate)
    const targetIndex = templateArray.findIndex(t => t.id === targetTemplateId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Sıralamayı güncelle
    const [dragged] = templateArray.splice(draggedIndex, 1)
    templateArray.splice(targetIndex, 0, dragged)

    // Sıralamayı kaydet (gerçek uygulamada API'ye gönderilecek)
    const newOrder = new Map<string, number>()
    templateArray.forEach((t, index) => {
      newOrder.set(t.id, index)
    })
    setTemplateOrder(newOrder)

    toast.success('Şablon sırası güncellendi')
    setDraggedTemplate(null)
  }

  const handleDragEnd = () => {
    setDraggedTemplate(null)
  }

  const handleCreateOverride = (code: PrintTemplateCode) => {
    createOverrideMutation.mutate(code)
  }

  const handleToggleField = (
    template: PrintTemplate,
    section: 'headerFields' | 'bodyFields' | 'footerFields' | 'signatureFields',
    fieldIndex: number
  ) => {
    const updatedTemplate = { ...template }
    const field = updatedTemplate[section][fieldIndex]
    field.visible = !field.visible

    updateTemplateMutation.mutate(updatedTemplate)
  }

  const getTemplateCategory = (code: PrintTemplateCode): string => {
    if (code.startsWith('finance.')) return 'Finans'
    if (code.startsWith('hr.')) return 'İnsan Kaynakları'
    if (code.startsWith('qurban.')) return 'Kurban'
    if (code.startsWith('projects.')) return 'Projeler'
    return 'Diğer'
  }

  const getTemplateIcon = (code: PrintTemplateCode) => {
    if (code.includes('payslip') || code.includes('payroll')) return '💰'
    if (code.includes('transaction')) return '💳'
    if (code.includes('certificate')) return '📜'
    if (code.includes('report')) return '📊'
    return '📄'
  }

  const templatesByCategory = templates.reduce((acc, template) => {
    const category = getTemplateCategory(template.code)
    if (!acc[category]) acc[category] = []
    acc[category].push(template)
    return acc
  }, {} as Record<string, PrintTemplate[]>)

  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Printer size={16} />
            Yazdırma Şablonları
          </TabsTrigger>
          <TabsTrigger value="exports" className="gap-2">
            <FileArrowDown size={16} />
            Export Ayarları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Yazdırma Şablonları</h3>
              <p className="text-sm text-muted-foreground">
                Şubede kullanılan tüm yazdırma şablonlarını yönetin. Sürükleyip bırakarak sıralayın.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus size={16} />
              Yeni Şablon
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-base">{category}</CardTitle>
                    <CardDescription>
                      {categoryTemplates.length} şablon
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Şablon</TableHead>
                          <TableHead>Kapsam</TableHead>
                          <TableHead>Yönlendirme</TableHead>
                          <TableHead>Logo</TableHead>
                          <TableHead>Son Güncelleme</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryTemplates.map((template) => {
                          const isDragging = draggedTemplate === template.id
                          return (
                          <TableRow
                            key={template.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, template.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, template.id)}
                            onDragEnd={handleDragEnd}
                            className={`
                              cursor-move transition-all
                              ${isDragging ? 'opacity-50 bg-primary/10' : 'hover:bg-muted/50'}
                            `}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getTemplateIcon(template.code)}</span>
                                <div>
                                  <div className="font-medium">
                                    {typeof template.name === 'string'
                                      ? template.name
                                      : template.name.tr || template.name.en}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {template.code}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {template.tenantScope === 'GLOBAL' ? (
                                <Badge variant="secondary">Global</Badge>
                              ) : (
                                <Badge variant="outline">Şube Özel</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {template.pageOrientation === 'portrait' ? 'Dikey' : 'Yatay'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {template.showLogo ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-gray-400" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(template.updatedAt), 'dd MMM yyyy', { locale: tr })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {template.tenantScope === 'GLOBAL' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCreateOverride(template.code)}
                                    title="Şube Özel Şablon Oluştur"
                                  >
                                    Kopyala
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditTemplate(template)}
                                  title="Düzenle"
                                >
                                  <Pencil size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exports" className="space-y-4 mt-6">
          <ExportSettingsSection facilityId={facilityId} />
        </TabsContent>
      </Tabs>

      <Dialog open={fieldEditorOpen} onOpenChange={setFieldEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate &&
                (typeof editingTemplate.name === 'string'
                  ? editingTemplate.name
                  : editingTemplate.name.tr || editingTemplate.name.en)}
            </DialogTitle>
            <DialogDescription>
              Alanları sürükleyip bırakarak sıralayın, görünürlüğünü değiştirin
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <TemplateFieldEditor
              template={editingTemplate}
              onUpdate={handleTemplateFieldUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateTemplate}
        facilityId={facilityId}
      />
    </div>
  )
}

function ExportSettingsSection({ facilityId }: { facilityId: string }) {
  const queryClient = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['branch-settings', facilityId],
    queryFn: () => branchSettingsService.getSettings(facilityId),
    enabled: !!facilityId,
  })

  const defaultExportSettings = {
    defaultPdfFormat: 'a4' as 'a4' | 'letter',
    defaultExcelFormat: 'xlsx' as 'xlsx' | 'xls',
    includeHeaders: true,
    includeFooters: true,
    includePageNumbers: true,
    dateFormat: 'DD/MM/YYYY' as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
    numberFormat: 'tr-TR' as 'tr-TR' | 'en-US' | 'fr-FR',
    currencySymbol: '₺' as '₺' | '$' | '€' | '£',
    autoOpenAfterExport: false,
  }

  const [exportSettings, setExportSettings] = useState(
    settings?.export || defaultExportSettings
  )

  // Settings değiştiğinde state'i güncelle
  useEffect(() => {
    if (settings?.export) {
      setExportSettings(settings.export)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (updates: any) =>
      branchSettingsService.updateSettings(facilityId, updates),
    onSuccess: () => {
      toast.success('Export ayarları kaydedildi')
      queryClient.invalidateQueries({ queryKey: ['branch-settings'] })
    },
    onError: () => {
      toast.error('Ayarlar kaydedilirken bir hata oluştu')
    },
  })

  const handleSave = () => {
    updateMutation.mutate({ export: exportSettings })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Export Ayarları</h3>
        <p className="text-sm text-muted-foreground">
          PDF ve Excel export formatlarını yapılandırın
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FilePdf size={20} />
              PDF Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Varsayılan Sayfa Formatı</Label>
              <Select
                value={exportSettings.defaultPdfFormat}
                onValueChange={(value: 'a4' | 'letter') =>
                  setExportSettings({ ...exportSettings, defaultPdfFormat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pdf-headers">Başlık Ekle</Label>
              <Switch
                id="pdf-headers"
                checked={exportSettings.includeHeaders}
                onCheckedChange={(checked) =>
                  setExportSettings({ ...exportSettings, includeHeaders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pdf-footers">Alt Bilgi Ekle</Label>
              <Switch
                id="pdf-footers"
                checked={exportSettings.includeFooters}
                onCheckedChange={(checked) =>
                  setExportSettings({ ...exportSettings, includeFooters: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pdf-pages">Sayfa Numarası</Label>
              <Switch
                id="pdf-pages"
                checked={exportSettings.includePageNumbers}
                onCheckedChange={(checked) =>
                  setExportSettings({ ...exportSettings, includePageNumbers: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MicrosoftExcelLogo size={20} />
              Excel Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Varsayılan Format</Label>
              <Select
                value={exportSettings.defaultExcelFormat}
                onValueChange={(value: 'xlsx' | 'xls') =>
                  setExportSettings({ ...exportSettings, defaultExcelFormat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">XLSX (Excel 2007+)</SelectItem>
                  <SelectItem value="xls">XLS (Excel 97-2003)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="excel-headers">Başlık Satırı Ekle</Label>
              <Switch
                id="excel-headers"
                checked={exportSettings.includeHeaders}
                onCheckedChange={(checked) =>
                  setExportSettings({ ...exportSettings, includeHeaders: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Format Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tarih Formatı</Label>
              <Select
                value={exportSettings.dateFormat}
                onValueChange={(value: any) =>
                  setExportSettings({ ...exportSettings, dateFormat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Türkçe)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (Amerikan)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sayı Formatı</Label>
              <Select
                value={exportSettings.numberFormat}
                onValueChange={(value: any) =>
                  setExportSettings({ ...exportSettings, numberFormat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr-TR">Türkçe (1.234,56)</SelectItem>
                  <SelectItem value="en-US">İngilizce (1,234.56)</SelectItem>
                  <SelectItem value="fr-FR">Fransızca (1 234,56)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Para Birimi Sembolü</Label>
              <Select
                value={exportSettings.currencySymbol}
                onValueChange={(value: any) =>
                  setExportSettings({ ...exportSettings, currencySymbol: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="₺">₺ (Türk Lirası)</SelectItem>
                  <SelectItem value="$">$ (Dolar)</SelectItem>
                  <SelectItem value="€">€ (Euro)</SelectItem>
                  <SelectItem value="£">£ (Sterlin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Genel Ayarlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-open">Export Sonrası Otomatik Aç</Label>
              <Switch
                id="auto-open"
                checked={exportSettings.autoOpenAfterExport}
                onCheckedChange={(checked) =>
                  setExportSettings({ ...exportSettings, autoOpenAfterExport: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Ayarları Kaydet</Button>
      </div>
    </div>
  )
}

