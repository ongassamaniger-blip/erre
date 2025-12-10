import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { RealtimeIndicator } from '@/components/common/RealtimeIndicator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  XCircle,
  Clock,
  CurrencyDollar,
  CalendarBlank,
  User,
  FunnelSimple,
  X,
  ArrowClockwise,
  FileArrowDown,
  Printer,
  ChartBar,
  List,
  GridFour
} from '@phosphor-icons/react'
import { approvalService } from '@/services/approvalService'
import type { ApprovalRequest, ApprovalStats } from '@/types'
import { toast } from 'sonner'
import { useApprovalNotifications } from '@/hooks/use-approval-notifications'
import { useAuthStore } from '@/store/authStore'
import { ApprovalDetailDialog } from './components/ApprovalDetailDialog'
import { ApprovalWorkflowVisualization } from './components/ApprovalWorkflowVisualization'
import { ApprovalStatsChart } from './components/ApprovalStatsChart'
import { ApprovalAdvancedFilters } from './components/ApprovalAdvancedFilters'
import { exportApprovalsToExcel, exportApprovalToPDF, printApproval } from '@/utils/approvalExport'
import { useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ApprovalsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'approve' | 'reject' | null
    ids: string[]
  }>({ open: false, type: null, ids: [] })
  const [comment, setComment] = useState('')
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null)

  const [filters, setFilters] = useState({
    module: 'all',
    status: 'pending',
    priority: 'all',
    search: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
  })
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list')

  const [chartData, setChartData] = useState<ApprovalRequest[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch data for list (filtered) and charts (unfiltered) in parallel
      const [approvalsData, chartApprovalsData, statsData] = await Promise.all([
        approvalService.getApprovals({
          facilityId: selectedFacility?.id,
          module: filters.module !== 'all' ? filters.module : undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
        }),
        // Fetch all data for charts (no status/module filters)
        approvalService.getApprovals({
          facilityId: selectedFacility?.id,
          status: 'all'
        }),
        approvalService.getStats(selectedFacility?.id)
      ])

      let filtered = approvalsData

      // Arama filtresi
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filtered = filtered.filter(a =>
          a.title.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower) ||
          a.requestedBy.name.toLowerCase().includes(searchLower)
        )
      }

      // Tarih filtresi
      if (filters.startDate) {
        filtered = filtered.filter(a => new Date(a.requestedAt) >= filters.startDate!)
      }
      if (filters.endDate) {
        filtered = filtered.filter(a => new Date(a.requestedAt) <= filters.endDate!)
      }

      // Tutar filtresi
      if (filters.minAmount !== undefined) {
        filtered = filtered.filter(a => (a.amount || 0) >= filters.minAmount!)
      }
      if (filters.maxAmount !== undefined) {
        filtered = filtered.filter(a => (a.amount || 0) <= filters.maxAmount!)
      }

      if (filters.status !== 'all') {
        filtered = filtered.filter(a => a.status === filters.status)
      }
      if (filters.priority !== 'all') {
        filtered = filtered.filter(a => a.priority === filters.priority)
      }

      setApprovals(filtered)
      setChartData(chartApprovalsData)
      setStats(statsData)
    } catch (error) {
      toast.error('Onaylar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [filters, selectedFacility?.id])

  const { lastCheck } = useApprovalNotifications({
    enabled: true,
    pollInterval: 30000,
    onNewApproval: () => {
      loadData()
    }
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAction = async () => {
    if (!actionDialog.type) return
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      if (actionDialog.type === 'approve') {
        if (actionDialog.ids.length === 1) {
          await approvalService.approveRequest(actionDialog.ids[0], comment)
        } else {
          await approvalService.bulkApprove(actionDialog.ids, comment)
        }
        toast.success('Onay işlemi başarılı')
      } else {
        if (!comment.trim()) {
          toast.error('Ret nedeni zorunludur')
          setIsSubmitting(false)
          return
        }
        if (actionDialog.ids.length === 1) {
          await approvalService.rejectRequest(actionDialog.ids[0], comment)
        } else {
          await approvalService.bulkReject(actionDialog.ids, comment)
        }
        toast.success('Red işlemi başarılı')
      }

      setActionDialog({ open: false, type: null, ids: [] })
      setComment('')
      setSelected(new Set())
      await loadData()
      await queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(approvals.filter(a => a.status === 'pending').map(a => a.id)))
    } else {
      setSelected(new Set())
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selected)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelected(newSelected)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'finance': return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'hr': return 'bg-green-500/10 text-green-700 border-green-200'
      case 'projects': return 'bg-purple-500/10 text-purple-700 border-purple-200'
      case 'qurban': return 'bg-orange-500/10 text-orange-700 border-orange-200'
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede'
      case 'approved': return 'Onaylandı'
      case 'rejected': return 'Reddedildi'
      case 'cancelled': return 'İptal Edildi'
      default: return status
    }
  }

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return null

    const now = new Date().getTime()
    const deadlineTime = new Date(deadline).getTime()
    const diff = deadlineTime - now
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 0) return <Badge variant="destructive">Gecikmiş</Badge>
    if (hours < 24) return <Badge variant="destructive">{hours} saat kaldı</Badge>
    const days = Math.floor(hours / 24)
    return <Badge variant={days < 3 ? 'default' : 'secondary'}>{days} gün kaldı</Badge>
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Onay Merkezi</h1>
            <p className="text-muted-foreground mt-1">
              Bekleyen onaylar ve iş akışı süreçleri
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RealtimeIndicator lastCheck={lastCheck} isActive={true} />
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2 rounded-r-none"
              >
                <List size={16} />
                Liste
              </Button>
              <Button
                variant={viewMode === 'stats' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('stats')}
                className="gap-2 rounded-l-none"
              >
                <ChartBar size={16} />
                İstatistikler
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportApprovalsToExcel(approvals)
                toast.success('Onaylar Excel olarak indirildi')
              }}
              disabled={approvals.length === 0}
              className="gap-2"
            >
              <FileArrowDown size={16} />
              Excel İndir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="gap-2"
            >
              <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
              Yenile
            </Button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bekleyen</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock size={32} weight="duotone" className="text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Onaylanan</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle size={32} weight="duotone" className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reddedilen</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle size={32} weight="duotone" className="text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Acil</p>
                  <p className="text-2xl font-bold">{stats.urgent}</p>
                </div>
                <Clock size={32} weight="duotone" className="text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Filtreler</CardTitle>
              <CardDescription>Onayları filtreleyin ve yönetin</CardDescription>
            </div>
            {selected.size > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2"
                  onClick={() => setActionDialog({ open: true, type: 'approve', ids: Array.from(selected) })}
                >
                  <CheckCircle size={16} />
                  Toplu Onayla ({selected.size})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setActionDialog({ open: true, type: 'reject', ids: Array.from(selected) })}
                >
                  <XCircle size={16} />
                  Toplu Reddet ({selected.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApprovalAdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClear={() => {
              setFilters({
                module: 'all',
                status: 'pending',
                priority: 'all',
                search: '',
                startDate: undefined,
                endDate: undefined,
                minAmount: undefined,
                maxAmount: undefined,
              })
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select value={filters.module} onValueChange={(value) => setFilters(prev => ({ ...prev, module: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Modül" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Modüller</SelectItem>
                <SelectItem value="finance">Finans</SelectItem>
                <SelectItem value="hr">İnsan Kaynakları</SelectItem>
                <SelectItem value="projects">Projeler</SelectItem>
                <SelectItem value="qurban">Kurban</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'stats' ? (
        <ApprovalStatsChart approvals={chartData} />
      ) : (
        <div className="space-y-4">
          {approvals.length > 0 && approvals.some(a => a.status === 'pending') && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected.size === approvals.filter(a => a.status === 'pending').length && approvals.filter(a => a.status === 'pending').length > 0}
                onCheckedChange={handleSelectAll}
                id="select-all"
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                Tümünü Seç
              </Label>
            </div>
          )}

          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : approvals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle size={48} weight="duotone" className="text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Onay kaydı bulunamadı</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Seçili filtrelere uygun onay talebi bulunmuyor
                </p>
              </CardContent>
            </Card>
          ) : (
            approvals.map(approval => (
              <Card key={approval.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {approval.status === 'pending' && (
                      <Checkbox
                        checked={selected.has(approval.id)}
                        onCheckedChange={(checked) => handleSelect(approval.id, checked as boolean)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={getModuleColor(approval.module)}>
                          {approval.module === 'finance' && 'Finans'}
                          {approval.module === 'hr' && 'İK'}
                          {approval.module === 'projects' && 'Proje'}
                          {approval.module === 'qurban' && 'Kurban'}
                        </Badge>
                        <Badge variant={getPriorityColor(approval.priority)} className="capitalize">
                          {approval.priority === 'urgent' && 'Acil'}
                          {approval.priority === 'high' && 'Yüksek'}
                          {approval.priority === 'medium' && 'Orta'}
                          {approval.priority === 'low' && 'Düşük'}
                        </Badge>
                        {approval.deadline && getTimeRemaining(approval.deadline)}
                      </div>
                      <CardTitle className="text-lg">{approval.title}</CardTitle>
                      <CardDescription className="mt-1">{approval.description}</CardDescription>
                    </div>
                    {approval.amount && (
                      <div className="text-right">
                        {/* Bütçe aktarımları için her zaman TRY göster */}
                        {approval.type === 'budget_transfer' && approval.currency !== 'TRY' ? (
                          <>
                            <p className="text-2xl font-bold">
                              {formatCurrency(approval.amountInTry || approval.amount, 'TRY')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ({formatCurrency(approval.amount, approval.currency || 'TRY')})
                            </p>
                          </>
                        ) : (
                          <p className="text-2xl font-bold">
                            {formatCurrency(approval.amount, 'TRY')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User size={16} />
                      <span>{approval.requestedBy.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarBlank size={16} />
                      <span>{new Date(approval.requestedAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Badge variant="outline">{getStatusLabel(approval.status)}</Badge>
                    </div>
                  </div>

                  {approval.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-2"
                        onClick={() => setActionDialog({ open: true, type: 'approve', ids: [approval.id] })}
                      >
                        <CheckCircle size={16} />
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => setActionDialog({ open: true, type: 'reject', ids: [approval.id] })}
                      >
                        <XCircle size={16} />
                        Reddet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApproval(approval)
                          setDetailDialogOpen(true)
                        }}
                      >
                        Detay
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={actionDialog.open} onOpenChange={(open) => {
        setActionDialog({ open, type: null, ids: [] })
        setComment('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Onay' : 'Reddetme'} İşlemi
            </DialogTitle>
            <DialogDescription>
              {actionDialog.ids.length} adet onay talebi{' '}
              {actionDialog.type === 'approve' ? 'onaylanacak' : 'reddedilecek'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {actionDialog.type === 'approve' ? 'Yorum (Opsiyonel)' : 'Red Nedeni *'}
              </Label>
              <Textarea
                id="comment"
                placeholder={actionDialog.type === 'approve' ? 'Yorumunuzu yazın...' : 'Ret nedeninizi belirtin...'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setActionDialog({ open: false, type: null, ids: [] })
              setComment('')
            }} disabled={isSubmitting}>
              İptal
            </Button>
            <Button
              variant={actionDialog.type === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'İşleniyor...' : (actionDialog.type === 'approve' ? 'Onayla' : 'Reddet')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApprovalDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        approval={selectedApproval}
      />
    </div>
  )
}

