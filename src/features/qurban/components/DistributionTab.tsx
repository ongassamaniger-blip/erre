import { useState, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Image as ImageIcon, FileText, FileArrowDown, Eye, List, Kanban, MapPin, CheckCircle } from '@phosphor-icons/react'
import { exportDistributionsToExcel } from '@/utils/qurbanExport'
import { toast } from 'sonner'
import { distributionService } from '@/services/qurban/qurbanService'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { CreateDistributionDialog } from './CreateDistributionDialog'
import { CompleteCampaignDialog } from './CompleteCampaignDialog'
import { ExportDialog } from './ExportDialog'
import { DistributionPhotoDialog } from './DistributionPhotoDialog'
import type { DistributionRecord } from '@/types'

const statusColors = {
  delivered: 'bg-green-500/10 text-green-700 border-green-200',
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
}

const statusLabels = {
  delivered: 'Teslim Edildi',
  pending: 'Beklemede',
}

export function DistributionTab() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedPhotoInfo, setSelectedPhotoInfo] = useState<{
    date: string
    campaignName: string
    region: string
  } | null>(null)
  const [editingDistribution, setEditingDistribution] = useState<DistributionRecord | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: distributions = [], isLoading } = useQuery({
    queryKey: ['qurban-distributions', selectedFacility?.id],
    queryFn: () => distributionService.getDistributions({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DistributionRecord['status'] }) =>
      distributionService.updateDistribution(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qurban-distributions'] })
      toast.success('Durum güncellendi')
    },
    onError: () => {
      toast.error('Durum güncellenemedi')
    }
  })

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: DistributionRecord['status']) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      updateStatusMutation.mutate({ id, status })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(distributions.map((d) => d.id)))
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
    let dataToExport: DistributionRecord[] = []

    if (options.type === 'all' || options.type === 'filtered') {
      dataToExport = distributions
    } else if (options.type === 'selected' && options.selectedIds) {
      dataToExport = distributions.filter((d) => options.selectedIds!.includes(d.id))
    }

    if (dataToExport.length === 0) {
      toast.error('Dışa aktarılacak kayıt bulunamadı')
      return
    }

    exportDistributionsToExcel(dataToExport)
    toast.success(`${dataToExport.length} kayıt Excel dosyası olarak indiriliyor...`)
  }

  const handleCreate = () => {
    setEditingDistribution(undefined)
    setCreateDialogOpen(true)
  }

  const handleEdit = (distribution: DistributionRecord) => {
    setEditingDistribution(distribution)
    setCreateDialogOpen(true)
  }

  const pendingDistributions = distributions.filter(d => d.status === 'pending')
  const deliveredDistributions = distributions.filter(d => d.status === 'delivered')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List size={16} />
              Liste
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="gap-2"
            >
              <Kanban size={16} />
              Kanban
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
          >
            <FileArrowDown size={20} />
            Excel İndir
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
            onClick={() => setCompleteDialogOpen(true)}
          >
            <CheckCircle size={20} className="mr-2" />
            Et Dağıtımını Tamamla
          </Button>
          <Button onClick={handleCreate}>
            <Plus size={20} weight="bold" />
            Yeni Dağıtım Kaydı
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>Et Dağıtım Kayıtları</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
            ) : distributions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.size === distributions.length && distributions.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Bölge</TableHead>
                      <TableHead>Paket Sayısı</TableHead>
                      <TableHead>Toplam Ağırlık (kg)</TableHead>
                      <TableHead>Ortalama / Alıcı</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Fotoğraf</TableHead>
                      <TableHead className="text-right">Aksiyonlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((distribution) => (
                      <TableRow key={distribution.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(distribution.id)}
                            onCheckedChange={(checked) => handleSelectOne(distribution.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(distribution.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-sm">{distribution.campaignName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            distribution.distributionType === 'bulk'
                              ? 'bg-blue-500/10 text-blue-700 border-blue-200'
                              : 'bg-green-500/10 text-green-700 border-green-200'
                          }>
                            {distribution.distributionType === 'bulk' ? 'Toplu' : 'Kişisel'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{distribution.region}</TableCell>
                        <TableCell className="font-medium">
                          {distribution.distributionType === 'bulk'
                            ? distribution.packageCount || 0
                            : distribution.packageNumber ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {distribution.packageNumber}
                              </code>
                            ) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {distribution.distributionType === 'bulk'
                            ? (distribution.totalWeight || 0).toFixed(1)
                            : (distribution.weight || 0).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {distribution.distributionType === 'bulk' && distribution.averageWeightPerPackage
                            ? `${distribution.averageWeightPerPackage.toFixed(2)} kg/paket`
                            : distribution.distributionType === 'individual' && distribution.recipientName
                              ? distribution.recipientName
                              : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[distribution.status]}>
                            {statusLabels[distribution.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {distribution.photo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPhoto(distribution.photo || null)
                                setSelectedPhotoInfo({
                                  date: distribution.date,
                                  campaignName: distribution.campaignName,
                                  region: distribution.region,
                                })
                                setPhotoDialogOpen(true)
                              }}
                              className="flex items-center gap-1"
                            >
                              <ImageIcon size={18} className="text-blue-600" weight="fill" />
                              <Eye size={16} />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {distribution.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => updateStatusMutation.mutate({ id: distribution.id, status: 'delivered' })}
                                title="Teslim Edildi Olarak İşaretle"
                              >
                                <CheckCircle size={20} weight="bold" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(distribution)}
                            >
                              Detay
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Henüz dağıtım kaydı bulunmuyor
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Pending Column */}
          <div
            className="flex flex-col bg-muted/30 rounded-lg p-4 border-2 border-dashed border-transparent hover:border-primary/20 transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'pending')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                Beklemede
              </h3>
              <Badge variant="secondary">{pendingDistributions.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {pendingDistributions.map(distribution => (
                <Card
                  key={distribution.id}
                  className="cursor-move hover:shadow-md transition-shadow"
                  draggable
                  onDragStart={(e) => handleDragStart(e, distribution.id)}
                  onClick={() => handleEdit(distribution)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-xs">
                        {distribution.distributionType === 'bulk' ? 'Toplu' : 'Kişisel'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(distribution.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{distribution.campaignName}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {distribution.region}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                      <span>
                        {distribution.distributionType === 'bulk'
                          ? `${distribution.packageCount} Paket`
                          : distribution.recipientName}
                      </span>
                      <span>
                        {distribution.distributionType === 'bulk'
                          ? `${distribution.totalWeight} kg`
                          : `${distribution.weight} kg`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Delivered Column */}
          <div
            className="flex flex-col bg-muted/30 rounded-lg p-4 border-2 border-dashed border-transparent hover:border-primary/20 transition-colors"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'delivered')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Teslim Edildi
              </h3>
              <Badge variant="secondary">{deliveredDistributions.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {deliveredDistributions.map(distribution => (
                <Card
                  key={distribution.id}
                  className="cursor-move hover:shadow-md transition-shadow opacity-75 hover:opacity-100"
                  draggable
                  onDragStart={(e) => handleDragStart(e, distribution.id)}
                  onClick={() => handleEdit(distribution)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                        {distribution.distributionType === 'bulk' ? 'Toplu' : 'Kişisel'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(distribution.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{distribution.campaignName}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin size={12} />
                        {distribution.region}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                      <span>
                        {distribution.distributionType === 'bulk'
                          ? `${distribution.packageCount} Paket`
                          : distribution.recipientName}
                      </span>
                      {distribution.photo && <ImageIcon size={14} className="text-blue-500" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      <CreateDistributionDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditingDistribution(undefined)
        }}
        onSuccess={() => {
          setCreateDialogOpen(false)
          setEditingDistribution(undefined)
          queryClient.invalidateQueries({ queryKey: ['qurban-distributions'] })
        }}
        distribution={editingDistribution}
      />

      <CompleteCampaignDialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
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
        totalCount={distributions.length}
        filteredCount={distributions.length}
        selectedCount={selectedIds.size}
        hasFilters={false}
      />

      <DistributionPhotoDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        photoUrl={selectedPhoto}
        distributionInfo={selectedPhotoInfo || undefined}
      />
    </div>
  )
}
