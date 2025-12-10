import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Buildings,
  Plus,
  Pencil,
  Trash,
  Users,
  UserCircle,
  MagnifyingGlass,
  Archive,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { departmentService } from '@/services/departmentService'
import { employeeService } from '@/services/employeeService'
import type { Department } from '@/types/hr'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department
  onSave: (data: Partial<Department>) => Promise<void>
}) {
  const [formData, setFormData] = useState<Partial<Department>>({
    name: '',
    code: '',
    managerId: undefined,
    managerName: '',
    description: '',
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  })

  const isEditing = !!department

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Ad ve kod alanları zorunludur')
      return
    }

    try {
      await onSave(formData)
      toast.success(isEditing ? 'Güncellendi' : 'Oluşturuldu')
      onOpenChange(false)
      setFormData({
        name: '',
        code: '',
        managerId: '',
        managerName: '',
        description: '',
      })
    } catch (error: any) {
      console.error('Department save error:', error)
      toast.error(`Bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Departman Düzenle' : 'Yeni Departman'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Departman bilgilerini güncelleyin' : 'Yeni departman ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Departman Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Finans"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Örn: FIN"
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Müdür</Label>
            <Select
              value={formData.managerId || 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  setFormData({ ...formData, managerId: undefined, managerName: undefined })
                } else {
                  const manager = employees?.find(e => e.id === value)
                  setFormData({
                    ...formData,
                    managerId: value,
                    managerName: manager ? `${manager.firstName} ${manager.lastName}` : undefined
                  })
                }
              }}
            >
              <SelectTrigger id="manager">
                <SelectValue placeholder="Müdür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Müdür yok</SelectItem>
                {employees
                  ?.filter(emp => emp.status === 'active' && !emp.code?.includes('_deleted_'))
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Departman açıklaması..."
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

export function DepartmentsPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | undefined>()
  const [viewMode, setViewMode] = useState<'active' | 'quarantined'>('active')

  const { data: departments, isLoading, refetch } = useQuery({
    queryKey: ['departments', selectedFacility?.id, viewMode],
    queryFn: () => departmentService.getDepartments({
      facilityId: selectedFacility?.id,
      isActive: viewMode === 'active'
    }),
    enabled: !!selectedFacility?.id
  })

  // Fetch quarantined count separately for the badge
  const { data: quarantinedCount } = useQuery({
    queryKey: ['departments-quarantined-count', selectedFacility?.id],
    queryFn: async () => {
      const depts = await departmentService.getDepartments({
        facilityId: selectedFacility?.id,
        isActive: false
      })
      return depts.length
    },
    enabled: !!selectedFacility?.id
  })

  const handleCreate = () => {
    setEditingDept(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setDialogOpen(true)
  }

  const handleSave = async (data: Partial<Department>) => {
    if (editingDept) {
      await departmentService.updateDepartment(editingDept.id, data)
    } else {
      if (!selectedFacility?.id) {
        toast.error('Lütfen bir tesis seçin')
        return
      }
      await departmentService.createDepartment({ ...data, facilityId: selectedFacility.id })
    }
    refetch()
  }

  const handleQuarantine = async (id: string) => {
    if (confirm('Bu departmanı karantinaya almak istediğinize emin misiniz?')) {
      try {
        await departmentService.deleteDepartment(id)
        toast.success('Departman karantinaya alındı')
        refetch()
        queryClient.invalidateQueries({ queryKey: ['departments-quarantined-count'] })
      } catch (error) {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const handleRestore = async (id: string) => {
    if (confirm('Bu departmanı geri yüklemek istediğinize emin misiniz?')) {
      try {
        await departmentService.restoreDepartment(id)
        toast.success('Departman geri yüklendi')
        refetch()
        queryClient.invalidateQueries({ queryKey: ['departments-quarantined-count'] })
      } catch (error) {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const handleHardDelete = async (id: string) => {
    if (confirm('Bu departmanı KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        await departmentService.hardDeleteDepartment(id)
        toast.success('Departman kalıcı olarak silindi')
        refetch()
        queryClient.invalidateQueries({ queryKey: ['departments-quarantined-count'] })
      } catch (error) {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const handleCleanupQuarantine = async () => {
    if (!selectedFacility?.id) return
    if (confirm('Karantina\'daki TÜM departmanları kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      try {
        const count = await departmentService.cleanupQuarantinedDepartments(selectedFacility.id)
        toast.success(`${count} departman kalıcı olarak silindi`)
        refetch()
        queryClient.invalidateQueries({ queryKey: ['departments-quarantined-count'] })
      } catch (error) {
        toast.error('Bir hata oluştu')
      }
    }
  }

  const filteredDepartments = departments?.filter(dept => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.code.toLowerCase().includes(query) ||
      dept.managerName?.toLowerCase().includes(query)
    )
  }) || []

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Departmanlar</h1>
            <p className="text-muted-foreground mt-1">
              Departman yapısı ve organizasyon yönetimi
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-muted p-1 rounded-lg flex">
              <button
                onClick={() => setViewMode('active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'active'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Aktif
              </button>
            </div>
            <Button onClick={handleCreate}>
              <Plus size={20} className="mr-2" />
              Yeni Departman
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Departman</p>
                  <p className="text-2xl font-bold">{departments?.length || 0}</p>
                </div>
                <Buildings size={24} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Çalışan</p>
                  <p className="text-2xl font-bold">
                    {departments?.reduce((sum, dept) => sum + dept.employeeCount, 0) || 0}
                  </p>
                </div>
                <Users size={24} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ortalama Çalışan</p>
                  <p className="text-2xl font-bold">
                    {departments && departments.length > 0
                      ? (departments.reduce((sum, dept) => sum + dept.employeeCount, 0) / departments.length).toFixed(1)
                      : '0'}
                  </p>
                </div>
                <UserCircle size={24} className="text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlass
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Departman adı, kod veya müdür ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Departman</TableHead>
                      <TableHead>Kod</TableHead>
                      <TableHead>Müdür</TableHead>
                      <TableHead>Çalışan Sayısı</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? 'Arama sonucu bulunamadı' : 'Departman bulunamadı'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDepartments.map(dept => (
                        <TableRow key={dept.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Buildings size={18} className="text-muted-foreground" />
                              <span className="font-medium">{dept.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{dept.code}</Badge>
                          </TableCell>
                          <TableCell>
                            {dept.managerName ? (
                              <div className="flex items-center gap-2">
                                <UserCircle size={16} className="text-muted-foreground" />
                                <span>{dept.managerName}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-muted-foreground" />
                              <span className="font-medium">{dept.employeeCount}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {dept.description || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {viewMode === 'active' ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(dept)}
                                  >
                                    <Pencil size={18} />
                                  </Button>
                                </>
                            </div>
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

        <DepartmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          department={editingDept}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
