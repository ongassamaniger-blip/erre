import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, FunnelSimple, CalendarBlank, CurrencyDollar, ChartLine, FileArrowDown, Trash } from '@phosphor-icons/react'
import { exportCampaignsToExcel } from '@/utils/qurbanExport'
import { toast } from 'sonner'
import { campaignService } from '@/services/qurban/qurbanService'
import { CreateCampaignDialog } from './CreateCampaignDialog'
import { CampaignDetailDialog } from './CampaignDetailDialog'
import { ExportDialog } from './ExportDialog'
import type { QurbanCampaign } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

const statusColors = {
  active: 'bg-green-500/10 text-green-700 border-green-200',
  planning: 'bg-blue-500/10 text-blue-700 border-blue-200',
  completed: 'bg-gray-500/10 text-gray-700 border-gray-200',
  archived: 'bg-orange-500/10 text-orange-700 border-orange-200',
  pending_approval: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-500/10 text-red-700 border-red-200',
}

const statusLabels = {
  active: 'Aktif',
  planning: 'Planlama',
  completed: 'Tamamlandı',
  archived: 'Arşiv',
  pending_approval: 'Onay Bekliyor',
  rejected: 'Reddedildi',
}

export function CampaignsTab() {
  const queryClient = useQueryClient()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<QurbanCampaign | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignService.deleteCampaign(id),
    onSuccess: () => {
      toast.success('Kampanya başarıyla silindi')
      // Invalidate both the specific query for this facility and the general one just in case
      queryClient.invalidateQueries({ queryKey: ['qurban-campaigns-all'] })
      queryClient.invalidateQueries({ queryKey: ['qurban-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['qurban-campaigns-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kampanya silinirken bir hata oluştu')
    }
  })

  const { data: allCampaigns = [], isLoading } = useQuery({
    queryKey: ['qurban-campaigns-all', selectedFacility?.id],
    queryFn: () => campaignService.getCampaigns({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  // Real-time subscription for campaigns
  useEffect(() => {
    if (!selectedFacility?.id) return

    const channel = supabase
      .channel('qurban-campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qurban_campaigns',
          filter: `facility_id=eq.${selectedFacility.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['qurban-campaigns-all'] })
          queryClient.invalidateQueries({ queryKey: ['qurban-campaigns'] })
          queryClient.invalidateQueries({ queryKey: ['qurban-campaigns-stats'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedFacility?.id, queryClient])

  const filteredCampaigns = useMemo(() => {
    let filtered = allCampaigns.filter(c => c.status !== 'pending_approval' && c.status !== 'rejected')

    if (yearFilter !== 'all') {
      filtered = filtered.filter((c) => c.year === parseInt(yearFilter))
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }
    return filtered
  }, [allCampaigns, yearFilter, statusFilter])

  const campaigns = filteredCampaigns

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(campaigns.map((c) => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleExport = (options: {
    type: 'all' | 'filtered' | 'selected'
    selectedIds?: string[]
  }) => {
    let dataToExport: QurbanCampaign[] = []

    if (options.type === 'all') {
      dataToExport = allCampaigns
    } else if (options.type === 'filtered') {
      dataToExport = filteredCampaigns
    } else if (options.type === 'selected' && options.selectedIds) {
      dataToExport = allCampaigns.filter((c) => options.selectedIds!.includes(c.id))
    }

    if (dataToExport.length === 0) {
      toast.error('Dışa aktarılacak kampanya bulunamadı')
      return
    }

    exportCampaignsToExcel(dataToExport)
    toast.success(`${dataToExport.length} kampanya Excel dosyası olarak indiriliyor...`)
  }

  const CampaignCard = ({ campaign }: { campaign: QurbanCampaign }) => {
    const collectionProgress = (campaign.collectedAmount / campaign.targetAmount) * 100
    const animalProgress = (campaign.completedAnimals / campaign.targetAnimals) * 100

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg mb-1">{campaign.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Yıl: {campaign.year}</p>
              </div>
              <Badge variant="outline" className={statusColors[campaign.status]}>
                {statusLabels[campaign.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Toplanan Tutar</span>
                <span className="font-medium">
                  {formatCurrency(campaign.collectedAmount)} / {formatCurrency(campaign.targetAmount)}
                </span>
              </div>
              <Progress value={collectionProgress} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(collectionProgress)}%</p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Hayvan Sayısı</span>
                <span className="font-medium">
                  {campaign.completedAnimals} / {campaign.targetAnimals}
                </span>
              </div>
              <Progress value={animalProgress} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(animalProgress)}%</p>
            </div>

            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Kampanya Süresi</span>
                <div className="flex items-center gap-1">
                  <CalendarBlank size={16} />
                  <span>
                    {format(new Date(campaign.startDate), 'dd MMM', { locale: tr })} -{' '}
                    {format(new Date(campaign.endDate), 'dd MMM yyyy', { locale: tr })}
                  </span>
                </div>
              </div>
            </div>

            {campaign.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">{campaign.description}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setSelectedCampaign(campaign)
                  setDetailDialogOpen(true)
                }}
              >
                Detay
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="px-3"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) {
                    deleteMutation.mutate(campaign.id)
                  }
                }}
              >
                <Trash size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <FunnelSimple size={20} className="text-muted-foreground" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportDialogOpen(true)}
          >
            <FileArrowDown size={16} />
            Excel İndir
          </Button>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Yıl" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Yıllar</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="planning">Planlama</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="archived">Arşiv</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus size={20} weight="bold" />
          Yeni Kampanya
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="relative">
              <Checkbox
                className="absolute top-2 right-2 z-10 bg-white rounded"
                checked={selectedIds.has(campaign.id)}
                onCheckedChange={(checked) => handleSelectOne(campaign.id, checked as boolean)}
              />
              <CampaignCard campaign={campaign} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <CurrencyDollar size={48} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz kampanya bulunmuyor</h3>
            <p className="text-muted-foreground mb-4">İlk kampanyanızı oluşturarak başlayın</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={20} weight="bold" />
              Yeni Kampanya Oluştur
            </Button>
          </div>
        </Card>
      )}

      <CreateCampaignDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['qurban-campaigns'] })
          queryClient.invalidateQueries({ queryKey: ['qurban-campaigns-stats'] })
        }}
      />

      <CampaignDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        campaign={selectedCampaign}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={(options) =>
          handleExport({
            ...options,
            selectedIds: options.type === 'selected' ? Array.from(selectedIds) : undefined,
          })
        }
        totalCount={allCampaigns.length}
        filteredCount={filteredCampaigns.length}
        selectedCount={selectedIds.size}
        hasFilters={yearFilter !== 'all' || statusFilter !== 'all'}
      />
    </div>
  )
}
