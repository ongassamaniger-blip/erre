import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { employeeService } from '@/services/hr/employeeService'
import { departmentService } from '@/services/departmentService'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, MagnifyingGlass, SquaresFour, ListBullets, Eye, CalendarPlus, Phone, Envelope, Pencil, Trash } from '@phosphor-icons/react'
import type { Employee, EmploymentType, EmployeeStatus } from '@/types/hr'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { EmployeeDialog } from './components/EmployeeDialog'
import { useDebounce } from '@/hooks/use-debounce'

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'full-time', label: 'Tam Zamanlı' },
  { value: 'part-time', label: 'Yarı Zamanlı' },
  { value: 'contract', label: 'Sözleşmeli' },
]

const statuses: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'on-leave', label: 'İzinli' },
  { value: 'inactive', label: 'Pasif' },
]

export function EmployeesPage() {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState<string>('all')
  const [employmentType, setEmploymentType] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()

  // Debounce search input - performans optimizasyonu
  const debouncedSearch = useDebounce(search, 300)

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', { search: debouncedSearch, department, employmentType, status, facilityId: selectedFacility?.id }],
    queryFn: () => employeeService.getEmployees({
      search: debouncedSearch,
      department: department === 'all' ? undefined : department,
      employmentType: employmentType === 'all' ? undefined : employmentType,
      status: status === 'all' ? undefined : status,
      facilityId: selectedFacility?.id,
    }),
    enabled: !!selectedFacility?.id,
    staleTime: 2 * 60 * 1000, // 2 dakika cache
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', selectedFacility?.id],
    queryFn: () => departmentService.getDepartments({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  // Memoized helper functions - performans optimizasyonu
  const getInitials = useCallback((firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }, [])

  const getStatusBadge = useCallback((status: EmployeeStatus) => {
    const variants = {
      active: 'default',
      'on-leave': 'secondary',
      inactive: 'outline',
    } as const

    const labels = {
      active: 'Aktif',
      'on-leave': 'İzinli',
      inactive: 'Pasif',
    }

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }, [])

  const getEmploymentTypeLabel = useCallback((type: EmploymentType) => {
    const labels = {
      'full-time': 'Tam Zamanlı',
      'part-time': 'Yarı Zamanlı',
      'contract': 'Sözleşmeli',
    }
    return labels[type]
  }, [])

  const handleCreate = useCallback(() => {
    setEditingEmployee(undefined)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((employee: Employee) => {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(async (data: Partial<Employee>) => {
    if (!selectedFacility?.id) {
      toast.error('Lütfen önce bir tesis seçin')
      return
    }

    if (editingEmployee) {
      await employeeService.updateEmployee(editingEmployee.id, {
        ...data,
        facilityId: selectedFacility.id
      })
    } else {
      await employeeService.createEmployee({
        ...data,
        facilityId: selectedFacility.id
      } as Partial<Employee>)
    }
    queryClient.invalidateQueries({ queryKey: ['employees'] })
    queryClient.invalidateQueries({ queryKey: ['departments'] })
  }, [editingEmployee, selectedFacility?.id, queryClient])

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Bu çalışanı silmek istediğinize emin misiniz?')) {
      try {
        await employeeService.deleteEmployee(id)
        toast.success('Çalışan silindi')
        queryClient.invalidateQueries({ queryKey: ['employees'] })
        queryClient.invalidateQueries({ queryKey: ['departments'] })
      } catch (error) {
        toast.error('Bir hata oluştu')
      }
    }
  }, [queryClient])

  // Memoized filtered employees
  const filteredEmployees = useMemo(() => {
    return employees?.filter(employee => employee && employee.id) || []
  }, [employees])

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Çalışanlar</h1>
            <p className="text-muted-foreground mt-1">
              Personel bilgilerini görüntüleyin ve yönetin
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus size={20} weight="bold" />
            Yeni Çalışan
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder="İsim, kod veya e-posta ile ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('card')}
                >
                  <SquaresFour size={20} />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('table')}
                >
                  <ListBullets size={20} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Departmanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Departmanlar</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="İstihdam Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setDepartment('all')
                  setEmploymentType('all')
                  setStatus('all')
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <motion.div
              key={employee.id}
              whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                        {getInitials(employee.firstName, employee.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {employee.position}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {employee.department}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone size={16} />
                      <span className="truncate">{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Envelope size={16} />
                      <span className="truncate">{employee.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {getStatusBadge(employee.status)}
                    <div className="flex gap-2">
                      <Link to={`/hr/employees/${employee.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye size={16} />
                          Detay
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Çalışan</TableHead>
                  <TableHead>Pozisyon</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead>İstihdam</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {employee.code}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getEmploymentTypeLabel(employee.employmentType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="truncate max-w-[200px]">{employee.email}</div>
                        <div className="text-muted-foreground">{employee.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/hr/employees/${employee.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye size={16} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(employee)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(employee.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && employees?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Çalışan bulunamadı</p>
          </CardContent>
        </Card>
      )}

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingEmployee(undefined)
          }
        }}
        employee={editingEmployee}
        onSave={handleSave}
      />
    </div>
  )
}
