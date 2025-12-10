import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  FunnelSimple,
  X
} from '@phosphor-icons/react'
import { budgetTransferService } from '@/services/finance/budgetTransferService'
import { BudgetTransfer, BudgetTransferFilters } from '@/types/finance'
import { BudgetTransferDialog } from './components/BudgetTransferDialog'
import { BudgetTransferTable } from './components/BudgetTransferTable'
import { BudgetTransferFilterPanel } from './components/BudgetTransferFilterPanel'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { facilityService } from '@/services/facilityService'

export function BudgetTransferPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const user = useAuthStore(state => state.user)
  const queryClient = useQueryClient()

  // Genel Merkez kontrolü
  const isHeadquarters = selectedFacility?.type === 'headquarters'

  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: facilityService.getFacilities,
  })

  const [filters, setFilters] = useState<BudgetTransferFilters>(() => {
    if (selectedFacility?.id) {
      return isHeadquarters
        ? { fromFacilityId: selectedFacility.id }
        : { toFacilityId: selectedFacility.id }
    }
    return {}
  })
  const [showFilters, setShowFilters] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<BudgetTransfer | undefined>(undefined)

  // FacilityId'yi filtreye ekle
  useEffect(() => {
    if (selectedFacility?.id) {
      if (isHeadquarters) {
        setFilters(prev => ({ ...prev, fromFacilityId: selectedFacility.id }))
      } else {
        setFilters(prev => ({ ...prev, toFacilityId: selectedFacility.id }))
      }
    }
  }, [selectedFacility?.id, isHeadquarters])

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['budget-transfers', filters],
    queryFn: () => budgetTransferService.getBudgetTransfers(filters),
    enabled: !!selectedFacility?.id,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => budgetTransferService.approveBudgetTransfer(id, user?.id || 'Unknown'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] })
      toast.success('Bütçe aktarımı onaylandı')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Onaylama işlemi başarısız')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      budgetTransferService.rejectBudgetTransfer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] })
      toast.success('Bütçe aktarımı reddedildi')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Reddetme işlemi başarısız')
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof budgetTransferService.createBudgetTransfer>[0]) =>
      budgetTransferService.createBudgetTransfer(data, selectedFacility?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] })
      setDialogOpen(false)
      toast.success('Bütçe aktarım talebi oluşturuldu')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Bütçe aktarımı oluşturulamadı')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types/finance').BudgetTransferRequest> }) =>
      budgetTransferService.updateBudgetTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transfers'] })
      setDialogOpen(false)
      toast.success('Bütçe aktarımı güncellendi')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Güncelleme başarısız')
    },
  })

  const handleSubmit = (data: any) => {
    if (editingTransfer) {
      updateMutation.mutate({ id: editingTransfer.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleFilterChange = (newFilters: BudgetTransferFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    if (selectedFacility?.id) {
      if (isHeadquarters) {
        setFilters({ fromFacilityId: selectedFacility.id })
      } else {
        setFilters({ toFacilityId: selectedFacility.id })
      }
    } else {
      setFilters({})
    }
  }

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'fromFacilityId' && key !== 'toFacilityId' && value !== undefined
  )

  const handleApprove = (id: string) => {
    approveMutation.mutate(id)
  }

  const handleReject = (id: string, reason?: string) => {
    rejectMutation.mutate({ id, reason })
  }

  const handleOpenDialog = () => {
    setEditingTransfer(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (transfer: BudgetTransfer) => {
    setEditingTransfer(transfer)
    setDialogOpen(true)
  }

  // İstatistikler - TRY tutarlarını kullan
  const stats = transfers
    ? {
      total: transfers.filter(t => t.status !== 'rejected').length,
      pending: transfers.filter(t => t.status === 'pending').length,
      approved: transfers.filter(t => t.status === 'approved' || t.status === 'completed').length,
      completed: transfers.filter(t => t.status === 'completed').length,
      totalAmount: transfers.filter(t => t.status !== 'rejected').reduce((sum, t) => sum + (t.amountInTry || t.amount), 0),
    }
    : null

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bütçe Aktarımları</h1>
            <p className="text-muted-foreground mt-1">
              {isHeadquarters
                ? 'Genel Merkez\'den şubelere bütçe aktarımları'
                : 'Şubeye gelen bütçe aktarımları'}
            </p>
          </div>
          {isHeadquarters && (
            <Button onClick={handleOpenDialog} className="gap-2">
              <Plus size={20} />
              Yeni Aktarım
            </Button>
          )}
        </div>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Toplam Aktarım</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <ArrowRight size={24} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bekleyen</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock size={24} className="text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Onaylanan</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
                </div>
                <CheckCircle size={24} className="text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tamamlanan</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Toplam Tutar</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                      minimumFractionDigits: 0,
                    }).format(stats.totalAmount)}
                  </p>
                </div>
                <ArrowRight size={24} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <FunnelSimple size={20} />
            <CardTitle>Filtreler</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X size={16} />
                Filtreleri Temizle
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Gizle' : 'Göster'}
            </Button>
          </div>
        </CardHeader>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent>
                <BudgetTransferFilterPanel
                  filters={filters}
                  onChange={handleFilterChange}
                  isHeadquarters={isHeadquarters}
                  facilities={facilities || []}
                />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Tablo */}
      <Card>
        <CardContent className="p-0">
          <BudgetTransferTable
            transfers={transfers || []}
            isLoading={isLoading}
            isHeadquarters={isHeadquarters}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
            approveLoading={approveMutation.isPending}
            rejectLoading={rejectMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      {isHeadquarters && (
        <BudgetTransferDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transfer={editingTransfer}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}
