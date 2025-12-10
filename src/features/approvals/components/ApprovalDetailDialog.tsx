import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  CalendarBlank,
  CurrencyDollar,
  FileText,
  FileArrowDown,
  Printer,
} from '@phosphor-icons/react'
import type { ApprovalRequest } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { exportApprovalToPDF, printApproval } from '@/utils/approvalExport'
import { ApprovalWorkflowVisualization } from './ApprovalWorkflowVisualization'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ApprovalDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  approval: ApprovalRequest | null
}

export function ApprovalDetailDialog({
  open,
  onOpenChange,
  approval,
}: ApprovalDetailDialogProps) {
  if (!approval) return null

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getModuleLabel = (module: string) => {
    switch (module) {
      case 'finance': return 'Finans'
      case 'hr': return 'İnsan Kaynakları'
      case 'projects': return 'Projeler'
      case 'qurban': return 'Kurban'
      default: return module
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-200'
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-200'
      case 'cancelled': return 'bg-gray-500/10 text-gray-700 border-gray-200'
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <DialogTitle>{approval.title}</DialogTitle>
                <Badge variant="outline" className={getStatusColor(approval.status)}>
                  {approval.status === 'pending' && 'Beklemede'}
                  {approval.status === 'approved' && 'Onaylandı'}
                  {approval.status === 'rejected' && 'Reddedildi'}
                  {approval.status === 'cancelled' && 'İptal Edildi'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportApprovalToPDF(approval)
                    toast.success('Onay PDF olarak indirildi')
                  }}
                  className="gap-2"
                >
                  <FileArrowDown size={16} />
                  PDF İndir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    printApproval(approval)
                  }}
                  className="gap-2"
                >
                  <Printer size={16} />
                  Yazdır
                </Button>
              </div>
            </div>
            <DialogDescription>{approval.description}</DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0 px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="details">Detaylar</TabsTrigger>
            <TabsTrigger value="workflow">Onay Akışı</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                {/* Temel Bilgiler */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText size={16} />
                      <span>Modül</span>
                    </div>
                    <Badge variant="outline">{getModuleLabel(approval.module)}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={16} />
                      <span>Öncelik</span>
                    </div>
                    <Badge variant={getPriorityColor(approval.priority)} className="capitalize">
                      {approval.priority === 'urgent' && 'Acil'}
                      {approval.priority === 'high' && 'Yüksek'}
                      {approval.priority === 'medium' && 'Orta'}
                      {approval.priority === 'low' && 'Düşük'}
                    </Badge>
                  </div>
                  {approval.amount && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CurrencyDollar size={16} />
                        <span>Tutar</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {formatCurrency(approval.amount, approval.currency || 'TRY')}
                      </p>
                    </div>
                  )}
                  {approval.deadline && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarBlank size={16} />
                        <span>Son Tarih</span>
                      </div>
                      <p className="text-sm">
                        {format(new Date(approval.deadline), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Talep Eden */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User size={16} />
                    <span>Talep Eden</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{approval.requestedBy.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(approval.requestedAt), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Onaylayıcı */}
                {approval.currentApprover && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle size={16} />
                        <span>Onaylayıcı</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <CheckCircle size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{approval.currentApprover.name}</p>
                          <p className="text-sm text-muted-foreground">{approval.currentApprover.role}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Metadata */}
                {(() => {
                  const excludedKeys = [
                    'id', 'created_at', 'updated_at', 'facility_id', 'facilityId',
                    'isBudget', 'isVendorCustomer', 'status', 'type', 'amount',
                    'currency', 'title', 'description', 'priority', 'requestedBy',
                    'requestedAt', 'deadline', 'history', 'relatedEntityId', 'module',
                    'documents', 'approval_status', 'approved_by', 'approved_at',
                    'rejected_by', 'rejected_at', 'notes', 'search_text', 'search'
                  ]

                  const metadataEntries = Object.entries(approval.metadata).filter(
                    ([key]) => !excludedKeys.includes(key) && !key.startsWith('_')
                  )

                  if (metadataEntries.length === 0) return null

                  return (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <FileText size={18} />
                          <span>Ek Bilgiler</span>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 border">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {metadataEntries.map(([key, value]) => {
                              if (value === null || value === undefined || value === '') return null

                              // Format key label
                              const label = key
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/_/g, ' ')
                                .trim()
                                .replace(/\b\w/g, c => c.toUpperCase())

                              // Format value
                              let displayValue = String(value)
                              if (Array.isArray(value)) displayValue = value.join(', ')
                              if (typeof value === 'boolean') displayValue = value ? 'Evet' : 'Hayır'
                              if (key.toLowerCase().includes('date') && typeof value === 'string') {
                                try {
                                  displayValue = format(new Date(value), 'dd MMMM yyyy', { locale: tr })
                                } catch (e) { }
                              }

                              return (
                                <div key={key} className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground font-medium">{label}</span>
                                  <span className="text-sm text-foreground break-words">{displayValue}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}

                {/* Geçmiş */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={16} />
                    <span>İşlem Geçmişi</span>
                  </div>
                  <div className="space-y-3">
                    {approval.history.map((item, index) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.action === 'submitted' ? 'bg-blue-500/10' :
                              item.action === 'approved' ? 'bg-green-500/10' :
                                item.action === 'rejected' ? 'bg-red-500/10' :
                                  'bg-gray-500/10'
                            }`}>
                            {item.action === 'submitted' && <Clock size={16} className="text-blue-600" />}
                            {item.action === 'approved' && <CheckCircle size={16} className="text-green-600" />}
                            {item.action === 'rejected' && <XCircle size={16} className="text-red-600" />}
                          </div>
                          {index < approval.history.length - 1 && (
                            <div className="w-0.5 h-6 bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {item.action === 'submitted' && 'Talep Oluşturuldu'}
                              {item.action === 'approved' && 'Onaylandı'}
                              {item.action === 'rejected' && 'Reddedildi'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm', { locale: tr })}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.actor.name}
                          </p>
                          {item.comment && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              "{item.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="workflow" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full pr-4">
              <ApprovalWorkflowVisualization approval={approval} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
