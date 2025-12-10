import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, FunnelSimple, Trash, Kanban, FileArrowDown, Printer, FilePdf, CheckCircle } from '@phosphor-icons/react'
import { donationService } from '@/services/qurban/qurbanService'
import { CreateDonationDialog } from './CreateDonationDialog'
import { DonationDetailDialog } from './DonationDetailDialog'
import { ExportDialog } from './ExportDialog'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { exportDonationsToExcel, exportDonationToPDF, printDonation } from '@/utils/qurbanExport'
import type { QurbanDonation } from '@/types'

const qurbanTypeLabels = {
  sheep: 'Koyun',
  goat: 'Keçi',
  'cow-share': 'İnek Hissesi',
  'camel-share': 'Deve Hissesi',
}

const paymentStatusColors = {
  paid: 'bg-green-500/10 text-green-700 border-green-200',
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
}

export function DonationsTab() {
  const queryClient = useQueryClient()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState<QurbanDonation | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  const { data: allDonations = [], isLoading } = useQuery({
    queryKey: ['qurban-donations', selectedFacility?.id],
    queryFn: () => donationService.getDonations({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id
  })

  const filteredDonations = useMemo(() => {
    if (paymentFilter === 'all') return allDonations
    return allDonations.filter(d => d.paymentStatus === paymentFilter)
  }, [allDonations, paymentFilter])

  const donations = filteredDonations

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'paid' }) =>
      donationService.updateDonation(id, { paymentStatus: status }),
    onSuccess: () => {
      toast.success('Bağış durumu güncellendi')
      queryClient.invalidateQueries({ queryKey: ['qurban-donations'] })
      queryClient.invalidateQueries({ queryKey: ['qurban-campaigns-stats'] })
      queryClient.invalidateQueries({ queryKey: ['qurban-donations-stats'] })
    },
    onError: () => {
      toast.error('Durum güncellenirken bir hata oluştu')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => donationService.deleteDonation(id),
    onSuccess: () => {
      toast.success('Bağış silindi')
      queryClient.invalidateQueries({ queryKey: ['qurban-donations'] })
      queryClient.invalidateQueries({ queryKey: ['qurban-donations-stats'] })
      setSelectedIds(new Set())
    },
    onError: () => {
      toast.error('Bağış silinirken bir hata oluştu')
    }
  })

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: 'pending' | 'paid') => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      updateStatusMutation.mutate({ id, status })
    }
    setDraggedId(null)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(donations.map(d => d.id)))
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

  const handleExport = async (options: any) => {
    try {
      if (options.format === 'excel') {
        const dataToExport = options.type === 'selected'
          ? allDonations.filter(d => selectedIds.has(d.id))
          : filteredDonations

        await exportDonationsToExcel(dataToExport)
        toast.success('Excel dosyası indirildi')
      }
      setExportDialogOpen(false)
    } catch (error) {
      toast.error('Dışa aktarma sırasında bir hata oluştu')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const KanbanColumn = ({ status, title, color }: { status: 'pending' | 'paid', title: string, color: string }) => {
    const items = donations.filter(d => d.paymentStatus === status)
    const totalAmount = items.reduce((sum, d) => sum + d.amount, 0)

    return (
      <div
        className="flex-1 min-w-[300px] bg-muted/30 rounded-lg p-4 border-2 border-dashed border-transparent hover:border-primary/20 transition-colors"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className={`flex items-center justify-between mb-4 pb-2 border-b ${color}`}>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <span className="text-sm font-medium">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="space-y-3">
          {items.map(donation => (
            <Card
              key={donation.id}
              className="cursor-move hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => handleDragStart(e, donation.id)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{donation.donorName}</p>
                    <p className="text-xs text-muted-foreground">{donation.campaignName}</p>
                  </div>
                  <Badge variant="outline" className={paymentStatusColors[donation.paymentStatus]}>
                    {donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {qurbanTypeLabels[donation.qurbanType]} ({donation.shareCount})
                  </span>
                  <span className="font-semibold">{formatCurrency(donation.amount, donation.currency)}</span>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <span>{format(new Date(donation.createdDate), 'dd/MM/yyyy')}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedDonation(donation); setDetailDialogOpen(true); }}>
                      <FileArrowDown size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              Sürükleyip bırakın
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <FunnelSimple size={16} className="mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8"
            >
              <Kanban size={16} className="mr-2" />
              Kanban
            </Button>
          </div>

          {viewMode === 'list' && (
            <>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ödeme Durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="paid">Ödendi</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
              >
                <FileArrowDown size={16} />
                Excel İndir
              </Button>
            </>
          )}
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus size={20} weight="bold" />
          Yeni Bağış Kaydı
        </Button>
      </div>

      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <CardTitle>Bağış Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
            ) : donations.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.size === donations.length && donations.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Bağışçı</TableHead>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Kurban Tipi</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Ödeme Durumu</TableHead>
                      <TableHead>Bölge</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Aksiyonlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(donation.id)}
                            onCheckedChange={(checked) => handleSelectOne(donation.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{donation.donorName}</div>
                            <div className="text-xs text-muted-foreground">{donation.donorPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{donation.campaignName}</TableCell>
                        <TableCell className="text-sm">
                          {qurbanTypeLabels[donation.qurbanType]} ({donation.shareCount})
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(donation.amount, donation.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={paymentStatusColors[donation.paymentStatus]}>
                            {donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{donation.distributionRegion}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(donation.createdDate), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {donation.paymentStatus === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ id: donation.id, status: 'paid' })}
                                title="Ödendi Olarak İşaretle"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle size={16} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDonation(donation)
                                setDetailDialogOpen(true)
                              }}
                            >
                              Detay
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                exportDonationToPDF(donation)
                                toast.success('PDF dosyası indiriliyor...')
                              }}
                              title="PDF İndir"
                            >
                              <FilePdf size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                printDonation(donation)
                              }}
                              title="Yazdır"
                            >
                              <Printer size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(donation.id)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">Henüz bağış kaydı bulunmuyor</div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn status="pending" title="Bekleyen Ödemeler" color="border-yellow-500 text-yellow-700" />
          <KanbanColumn status="paid" title="Tamamlanan Ödemeler" color="border-green-500 text-green-700" />
        </div>
      )}

      <CreateDonationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['qurban-donations'] })
          queryClient.invalidateQueries({ queryKey: ['qurban-donations-stats'] })
        }}
      />

      <DonationDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        donation={selectedDonation}
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
        totalCount={allDonations.length}
        filteredCount={filteredDonations.length}
        selectedCount={selectedIds.size}
        hasFilters={paymentFilter !== 'all'}
      />
    </div>
  )
}
