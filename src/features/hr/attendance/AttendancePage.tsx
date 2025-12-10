import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  ClockCounterClockwise,
  Plus,
  MagnifyingGlass,
  FunnelSimple,
  CalendarBlank,
  CheckCircle,
  XCircle,
  Clock,
  UserCircle,
  Pencil,
  Trash,
  DotsThree,
  Upload
} from '@phosphor-icons/react'
import { attendanceService, type AttendanceRecord, type AttendanceFilters } from '@/services/attendanceService'
import { employeeService } from '@/services/employeeService'
import { departmentService } from '@/services/departmentService'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AttendanceImportDialog } from './components/AttendanceImportDialog'

const statusLabels: Record<AttendanceRecord['status'], string> = {
  present: 'Mevcut',
  absent: 'Yok',
  late: 'Geç',
  'half-day': 'Yarım Gün',
  leave: 'İzinli',
}

const statusColors: Record<AttendanceRecord['status'], string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  'half-day': 'bg-blue-100 text-blue-800',
  leave: 'bg-purple-100 text-purple-800',
}

function AttendanceDialog({
  open,
  onOpenChange,
  attendance,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendance?: AttendanceRecord
  onSave: (data: Partial<AttendanceRecord>) => Promise<void>
}) {
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'present',
    notes: '',
  })

  const { selectedFacility } = useAuthStore()
  const { data: employees } = useQuery({
    queryKey: ['employees', selectedFacility?.id],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id
  })

  const isEditing = !!attendance

  useEffect(() => {
    if (attendance) {
      setFormData({
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn || '',
        checkOut: attendance.checkOut || '',
        status: attendance.status,
        notes: attendance.notes || '',
      })
    } else {
      setFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        checkIn: '',
        checkOut: '',
        status: 'present',
        notes: '',
      })
    }
  }, [attendance, open])

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.date) {
      toast.error('Çalışan ve tarih alanları zorunludur')
      return
    }

    try {
      await onSave(formData)
      toast.success(isEditing ? 'Güncellendi' : 'Oluşturuldu')
      onOpenChange(false)
    } catch (error) {
      toast.error('Bir hata oluştu')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Devamsızlık Kaydı Düzenle' : 'Yeni Devamsızlık Kaydı'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Devamsızlık kaydını güncelleyin' : 'Yeni devamsızlık kaydı ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Çalışan *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Çalışan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    ?.filter(emp => emp.status === 'active' && !emp.code?.includes('_deleted_'))
                    .map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tarih *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Giriş Saati</Label>
              <Input
                type="time"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Çıkış Saati</Label>
              <Input
                type="time"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Durum *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as AttendanceRecord['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Mevcut</SelectItem>
                  <SelectItem value="absent">Yok</SelectItem>
                  <SelectItem value="late">Geç</SelectItem>
                  <SelectItem value="half-day">Yarım Gün</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notlar..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AttendancePage() {
  const [filters, setFilters] = useState<AttendanceFilters>({})
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | undefined>()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()

  // FacilityId'yi filtreye ekle
  useEffect(() => {
    if (selectedFacility?.id) {
      setFilters(prev => ({ ...prev, facilityId: selectedFacility.id }))
    }
  }, [selectedFacility?.id])

  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['attendance', { ...filters, dateFrom, dateTo }],
    queryFn: () => attendanceService.getAttendanceRecords({
      ...filters,
      dateFrom,
      dateTo,
    }),
    enabled: !!selectedFacility?.id,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees', selectedFacility?.id],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', selectedFacility?.id],
    queryFn: () => departmentService.getDepartments({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const handleFilterChange = (key: keyof AttendanceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }))
  }

  const handleCreate = () => {
    setEditingAttendance(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (attendance: AttendanceRecord) => {
    setEditingAttendance(attendance)
    setDialogOpen(true)
  }

  const handleSave = async (data: Partial<AttendanceRecord>) => {
    const dataWithFacility = {
      ...data,
      facilityId: selectedFacility?.id
    }

    if (editingAttendance) {
      await attendanceService.updateAttendanceRecord(editingAttendance.id, dataWithFacility)
    } else {
      await attendanceService.createAttendanceRecord(dataWithFacility)
    }
    queryClient.invalidateQueries({ queryKey: ['attendance'] })
    queryClient.invalidateQueries({ queryKey: ['employee-attendance'] })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      try {
        await attendanceService.deleteAttendanceRecord(id)
        toast.success('Kayıt silindi')
        queryClient.invalidateQueries({ queryKey: ['attendance'] })
        queryClient.invalidateQueries({ queryKey: ['employee-attendance'] })
      } catch (error) {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const stats = attendanceRecords?.reduce((acc, rec) => {
    acc.total++
    if (rec.status === 'present') acc.present++
    if (rec.status === 'absent') acc.absent++
    if (rec.status === 'late') acc.late++
    return acc
  }, { total: 0, present: 0, absent: 0, late: 0 }) || { total: 0, present: 0, absent: 0, late: 0 }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Devamsızlık</h1>
            <p className="text-muted-foreground mt-1">
              Çalışan devamsızlık kayıtları ve mesai takibi
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload size={20} className="mr-2" />
              İçe Aktar
            </Button>
            <Button onClick={handleCreate}>
              <Plus size={20} className="mr-2" />
              Yeni Kayıt
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Kayıt</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CalendarBlank size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mevcut</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Yok</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <XCircle size={24} className="text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Geç</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
              <Clock size={24} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Çalışan</Label>
                <Select
                  value={filters.employeeId || 'all'}
                  onValueChange={(value) => handleFilterChange('employeeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {employees
                      ?.filter(emp => emp.status === 'active' && !emp.code?.includes('_deleted_'))
                      .map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-2">
                <Label>Departman</Label>
                <Select
                  value={filters.department || 'all'}
                  onValueChange={(value) => handleFilterChange('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {departments?.map(dept => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Giriş</TableHead>
                    <TableHead>Çıkış</TableHead>
                    <TableHead>Çalışma Saati</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Notlar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Kayıt bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceRecords?.map(rec => (
                      <TableRow key={rec.id}>
                        <TableCell>
                          {format(new Date(rec.date), 'dd MMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle size={18} className="text-muted-foreground" />
                            <div>
                              <div className="font-medium">{rec.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{rec.employeeCode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rec.checkIn ? (
                            <span className="font-mono">{rec.checkIn}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rec.checkOut ? (
                            <span className="font-mono">{rec.checkOut}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rec.workingHours ? (
                            <span>{rec.workingHours.toFixed(1)} saat</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[rec.status]}>
                            {statusLabels[rec.status]}
                            {rec.lateMinutes && rec.lateMinutes > 0 && (
                              <span className="ml-1">({rec.lateMinutes} dk)</span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {rec.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <DotsThree size={16} weight="bold" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(rec)}>
                                <Pencil size={16} className="mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(rec.id)}
                                className="text-destructive"
                              >
                                <Trash size={16} className="mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AttendanceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingAttendance(undefined)
          }
        }}
        attendance={editingAttendance}
        onSave={handleSave}
      />

      <AttendanceImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={async (records) => {
          try {
            const result = await attendanceService.bulkImportAttendanceRecords(
              records.map(rec => ({
                ...rec,
                date: rec.date || new Date().toISOString().split('T')[0],
                facilityId: selectedFacility?.id,
              }))
            )

            queryClient.invalidateQueries({ queryKey: ['attendance'] })
            queryClient.invalidateQueries({ queryKey: ['employee-attendance'] })

            if (result.failed > 0) {
              toast.warning(
                `${result.success} kayıt başarılı, ${result.failed} kayıt başarısız. Hatalar: ${result.errors.slice(0, 3).join(', ')}`
              )
            } else {
              toast.success(`${result.success} kayıt başarıyla import edildi`)
            }
          } catch (error: any) {
            toast.error(error.message || 'Import işlemi başarısız')
          }
        }}
      />
    </div>
  )
}
