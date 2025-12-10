import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { leaveService } from '@/services/leaveService'
import { employeeService } from '@/services/hr/employeeService'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, ListBullets, CalendarBlank, Eye, Check, X } from '@phosphor-icons/react'
import type { LeaveRequest, LeaveStatus } from '@/types/hr'
import { LeaveDetailModal } from './LeaveDetailModal'
import { NewLeaveDialog } from './NewLeaveDialog'
import { toast } from 'sonner'

const leaveTypes = [
  { value: 'annual', label: 'Yıllık İzin' },
  { value: 'sick', label: 'Hastalık İzni' },
  { value: 'unpaid', label: 'Ücretsiz İzin' },
  { value: 'maternity', label: 'Doğum İzni' },
  { value: 'paternity', label: 'Babalık İzni' },
  { value: 'other', label: 'Diğer' },
]

const statuses: { value: LeaveStatus; label: string }[] = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'approved', label: 'Onaylandı' },
  { value: 'rejected', label: 'Reddedildi' },
]

export function LeavesPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isNewLeaveDialogOpen, setIsNewLeaveDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: leaves, isLoading } = useQuery({
    queryKey: ['leaves', { statusFilter, leaveTypeFilter, employeeFilter, facilityId: selectedFacility?.id }],
    queryFn: () => leaveService.getLeaves({
      status: statusFilter === 'all' ? undefined : (statusFilter as LeaveStatus),
      leaveType: leaveTypeFilter === 'all' ? undefined : leaveTypeFilter,
      employeeId: employeeFilter === 'all' ? undefined : employeeFilter,
      facilityId: selectedFacility?.id,
    }),
    enabled: !!selectedFacility?.id,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees', { facilityId: selectedFacility?.id }],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusBadge = (status: LeaveStatus) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    } as const

    const labels = {
      pending: 'Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
    }

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const getLeaveTypeLabel = (type: string) => {
    return leaveTypes.find(t => t.value === type)?.label || type
  }

  const handleLeaveClick = (leave: LeaveRequest) => {
    setSelectedLeave(leave)
    setIsDetailModalOpen(true)
  }

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await leaveService.approveLeave(leaveId, 'current-user-id', 'Mevcut Kullanıcı')
      toast.success('İzin talebi onaylandı')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['employee-leaves'] })
    } catch (error) {
      toast.error('İzin onaylanırken hata oluştu')
    }
  }

  const handleRejectLeave = async (leaveId: string) => {
    const reason = window.prompt('Red nedeni:')
    if (!reason) return

    try {
      await leaveService.rejectLeave(leaveId, 'current-user-id', 'Mevcut Kullanıcı', reason)
      toast.success('İzin talebi reddedildi')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['employee-leaves'] })
    } catch (error) {
      toast.error('İzin reddedilirken hata oluştu')
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">İzin Talepleri</h1>
            <p className="text-muted-foreground mt-1">
              Çalışan izin taleplerini görüntüleyin ve yönetin
            </p>
          </div>
          <Button onClick={() => setIsNewLeaveDialogOpen(true)}>
            <Plus size={20} weight="bold" />
            Yeni İzin Talebi
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 flex-1 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm İzin Tipleri" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İzin Tipleri</SelectItem>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Çalışanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Çalışanlar</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <ListBullets size={20} />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarBlank size={20} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Çalışan</TableHead>
                  <TableHead>İzin Tipi</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Onaylayan</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves?.map((leave) => (
                  <TableRow key={leave.id} className="cursor-pointer" onClick={() => handleLeaveClick(leave)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials(leave.employeeName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{leave.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getLeaveTypeLabel(leave.leaveType)}</TableCell>
                    <TableCell>
                      {format(new Date(leave.startDate), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.endDate), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell>{leave.totalDays} gün</TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>
                      {leave.approverName || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLeaveClick(leave)
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                        {leave.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproveLeave(leave.id)
                              }}
                              title="Onayla"
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRejectLeave(leave.id)
                              }}
                              title="Reddet"
                            >
                              <X size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarBlank size={64} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Takvim görünümü yakında eklenecek</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && leaves?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">İzin talebi bulunamadı</p>
          </CardContent>
        </Card>
      )}

      {selectedLeave && (
        <LeaveDetailModal
          leave={selectedLeave}
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
        />
      )}

      <NewLeaveDialog
        open={isNewLeaveDialogOpen}
        onOpenChange={setIsNewLeaveDialogOpen}
      />
    </div>
  )
}
