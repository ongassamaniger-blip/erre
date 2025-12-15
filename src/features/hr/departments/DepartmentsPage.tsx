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

/* ------------------------------------------------------------------------ */
/* ----------------------------- Dialog Component -------------------------- */
/* ------------------------------------------------------------------------ */

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
    name: department?.name || '',
    code: department?.code || '',
    managerId: department?.managerId,
    managerName: department?.managerName,
    description: department?.description || '',
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
    } catch (error: any) {
      toast.error(`Bir hata oluştu: ${error?.message}`)
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
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Kod *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={e =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                maxLength={10}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Müdür</Label>
            <Select
              value={formData.managerId || 'none'}
              onValueChange={value => {
                if (value === 'none') {
                  setFormData({
                    ...formData,
                    managerId: undefined,
                    managerName: undefined,
                  })
                } else {
                  const m = employees?.find(e => e.id === value)
                  setFormData({
                    ...formData,
                    managerId: value,
                    managerName: m ? `${m.firstName} ${m.lastName}` : undefined,
                  })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Müdür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Müdür yok</SelectItem>
                {employees
                  ?.filter(e => e.status === 'active')
                  .map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} – {emp.position}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit}>{isEditing ? 'Güncelle' : 'Oluştur'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------------ */
/* --------------------------- Main Page Component ------------------------- */
/* ------------------------------------------------------------------------ */

export function DepartmentsPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | undefined>()
  const [viewMode, setViewMode] = useState<'active' | 'quarantined'>('active')

  const { data: departments, isLoading, refetch } = useQuery({
    queryKey: ['departments', selectedFacility?.id, viewMode],
    queryFn: () =>
      departmentService.getDepartments({
        facilityId: selectedFacility?.id,
        isActive: viewMode === 'active',
      }),
    enabled: !!selectedFacility?.id,
  })

  const { data: quarantinedCount } = useQuery({
    queryKey: ['departments-quarantined-count', selectedFacility?.id],
    queryFn: async () => {
      const depts = await departmentService.getDepartments({
        facilityId: selectedFacility?.id,
        isActive: false,
      })
      return depts.length
    },
    enabled: !!selectedFacility?.id,
  })

  const handleSave = async (data: Partial<Department>) => {
    if (editingDept) {
      await departmentService.updateDepartment(editingDept.id, data)
    } else {
      await departmentService.createDepartment({
        ...data,
        facilityId: selectedFacility?.id!,
      })
    }
    refetch()
  }

  const filteredDepartments =
    departments?.filter(d => {
      const q = searchQuery.toLowerCase()
      return (
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.managerName?.toLowerCase().includes(q)
      )
    }) || []

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Departmanlar</h1>

        <div className="flex gap-2">
          <div className="bg-muted p-1 rounded-lg flex">
            <button
              onClick={() => setViewMode('active')}
              className={`px-3 py-1.5 rounded-md ${
                viewMode === 'active'
                  ? 'bg-background shadow'
                  : 'text-muted-foreground'
              }`}
            >
              Aktif
            </button>

            <button
              onClick={() => setViewMode('quarantined')}
              className={`px-3 py-1.5 rounded-md ${
                viewMode === 'quarantined'
                  ? 'bg-background shadow'
                  : 'text-muted-foreground'
              }`}
            >
              Karantinadaki{' '}
              {quarantinedCount !== undefined && (
                <Badge className="ml-1">{quarantinedCount}</Badge>
              )}
            </button>
          </div>

          <Button onClick={() => {
            setEditingDept(undefined)
            setDialogOpen(true)
          }}>
            <Plus size={20} className="mr-2" />
            Yeni Departman
          </Button>
        </div>
      </div>

      {/* ─────────────────── Search Bar ─────────────────── */}
      <div className="max-w-md relative">
        <MagnifyingGlass
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Departman adı, kod veya müdür ile ara..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ─────────────────── Table ─────────────────── */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-14" />
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
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredDepartments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Sonuç bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartments.map(dept => (
                      <TableRow key={dept.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Buildings size={18} />
                            {dept.name}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">{dept.code}</Badge>
                        </TableCell>

                        <TableCell>
                          {dept.managerName || '-'}
                        </TableCell>

                        <TableCell>{dept.employeeCount}</TableCell>

                        <TableCell className="truncate max-w-xs">
                          {dept.description || '-'}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            {viewMode === 'active' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingDept(dept)
                                    setDialogOpen(true)
                                  }}
                                >
                                  <Pencil size={18} />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => departmentService.deleteDepartment(dept.id)}
                                >
                                  <Archive size={18} />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => departmentService.restoreDepartment(dept.id)}
                                >
                                  <ArrowCounterClockwise size={18} />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => departmentService.hardDeleteDepartment(dept.id)}
                                >
                                  <Trash size={18} />
                                </Button>
                              </>
                            )}
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

      {/* Dialog */}
      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editingDept}
        onSave={handleSave}
      />
    </div>
  )
}

