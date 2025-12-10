import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Users,
  UserCircle,
  CalendarBlank,
  ClockCounterClockwise,
  Wallet,
  Buildings,
  MagnifyingGlass,
  FileArrowDown,
  Download,
} from '@phosphor-icons/react'
import { facilityService } from '@/services/facilityService'
import { employeeService } from '@/services/employeeService'
import { leaveService } from '@/services/leaveService'
import { attendanceService } from '@/services/attendanceService'
import { payrollService } from '@/services/payrollService'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import * as XLSX from 'xlsx'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function HeadquartersHRPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<'employees' | 'leaves' | 'attendance' | 'payroll' | 'summary'>('employees')

  if (selectedFacility?.type !== 'headquarters') {
    return null
  }

  const { data: branches = [] } = useQuery({
    queryKey: ['facilities', 'branches'],
    queryFn: () => facilityService.getBranches(),
  })

  const { data: allEmployees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['headquarters', 'employees', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(async branch => {
            const employees = await employeeService.getEmployees({ facilityId: branch.id }).catch(() => [])
            return employees.map(emp => ({
              ...emp,
              branchId: branch.id,
              branchName: branch.name,
            }))
          })
        )
        return results.flat()
      } else {
        const employees = await employeeService.getEmployees({ facilityId: selectedBranchId })
        const branch = branches.find(b => b.id === selectedBranchId)
        return employees.map(emp => ({
          ...emp,
          branchId: selectedBranchId,
          branchName: branch?.name,
        }))
      }
    },
    enabled: branches.length > 0,
  })

  const { data: allLeaves = [] } = useQuery({
    queryKey: ['headquarters', 'leaves', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(branch =>
            leaveService.getLeaves({ facilityId: branch.id }).catch(() => [])
          )
        )
        return results.flat()
      } else {
        return leaveService.getLeaves({ facilityId: selectedBranchId })
      }
    },
    enabled: branches.length > 0,
  })

  const { data: allAttendance = [] } = useQuery({
    queryKey: ['headquarters', 'attendance', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(branch =>
            attendanceService.getAttendanceRecords({ facilityId: branch.id }).catch(() => [])
          )
        )
        return results.flat()
      } else {
        return attendanceService.getAttendanceRecords({ facilityId: selectedBranchId })
      }
    },
    enabled: branches.length > 0,
  })

  const { data: allPayroll = [] } = useQuery({
    queryKey: ['headquarters', 'payroll', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(branch =>
            payrollService.getPayrollRecords({ facilityId: branch.id }).catch(() => [])
          )
        )
        return results.flat()
      } else {
        return payrollService.getPayrollRecords({ facilityId: selectedBranchId })
      }
    },
    enabled: branches.length > 0,
  })

  const filteredEmployees = allEmployees.filter(emp => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp as any).branchName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // İstatistikler
  const totalEmployees = allEmployees.length
  const activeEmployees = allEmployees.filter(e => e.status === 'active').length
  const pendingLeaves = allLeaves.filter(l => l.status === 'pending').length
  const totalPayroll = allPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0)

  // Şube bazlı istatistikler
  const branchStats = branches.map(branch => {
    const branchEmployees = allEmployees.filter(e => (e as any).branchId === branch.id)
    const branchLeaves = allLeaves.filter(l => l.facilityId === branch.id)
    const branchPayroll = allPayroll.filter(p => p.facilityId === branch.id)

    return {
      name: branch.name.replace(' Şubesi', ''),
      employees: branchEmployees.length,
      activeEmployees: branchEmployees.filter(e => e.status === 'active').length,
      pendingLeaves: branchLeaves.filter(l => l.status === 'pending').length,
      totalPayroll: branchPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0),
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleExportEmployees = () => {
    const data = filteredEmployees.map(emp => ({
      'Şube': (emp as any).branchName || '-',
      'Personel No': emp.employeeId || '-',
      'Ad': emp.firstName,
      'Soyad': emp.lastName,
      'E-posta': emp.email || '-',
      'Telefon': emp.phone || '-',
      'Departman': emp.department || '-',
      'Pozisyon': emp.position || '-',
      'Maaş': emp.salary?.amount || 0,
      'Durum': emp.status === 'active' ? 'Aktif' : 'Pasif',
      'İşe Başlama': emp.hireDate && !isNaN(new Date(emp.hireDate).getTime()) ? format(new Date(emp.hireDate), 'dd.MM.yyyy', { locale: tr }) : '-',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Personeller')
    XLSX.writeFile(wb, `genel_merkez_personel_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success('Excel dosyası indirildi')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Genel Merkez - İK Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Tüm şubelerin insan kaynakları işlemlerini görüntüleyin ve yönetin
            </p>
          </div>
          <Button variant="outline" onClick={handleExportEmployees} className="gap-2">
            <FileArrowDown size={16} />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Personel</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
              <Users size={24} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aktif Personel</p>
                <p className="text-2xl font-bold text-green-600">{activeEmployees}</p>
              </div>
              <UserCircle size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bekleyen İzinler</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingLeaves}</p>
              </div>
              <CalendarBlank size={24} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Bordro</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPayroll)}
                </p>
              </div>
              <Wallet size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="employees">Personeller</TabsTrigger>
          <TabsTrigger value="leaves">İzinler</TabsTrigger>
          <TabsTrigger value="attendance">Devamsızlık</TabsTrigger>
          <TabsTrigger value="payroll">Bordro</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personel Listesi</CardTitle>
                  <CardDescription>
                    Tüm şubelerin personel bilgileri
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Şube Seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Şubeler</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Personel ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Şube</TableHead>
                        <TableHead>Personel</TableHead>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead>Pozisyon</TableHead>
                        <TableHead>Maaş</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Personel bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <TableRow key={employee.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Buildings size={16} className="text-muted-foreground" />
                                <span className="font-medium">
                                  {(employee as any).branchName || '-'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {employee.avatar ? (
                                  <img
                                    src={employee.avatar}
                                    alt={`${employee.firstName} ${employee.lastName}`}
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <UserCircle size={20} className="text-primary" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">
                                    {employee.firstName} {employee.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {employee.employeeId}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{employee.email}</TableCell>
                            <TableCell>{employee.department || '-'}</TableCell>
                            <TableCell>{employee.position || '-'}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(employee.salary?.amount || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={employee.status === 'active' ? 'default' : 'secondary'}
                              >
                                {employee.status === 'active' ? 'Aktif' : 'Pasif'}
                              </Badge>
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
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>İzin Talepleri</CardTitle>
              <CardDescription>
                Tüm şubelerin izin talepleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Personel</TableHead>
                      <TableHead>İzin Tipi</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>Gün</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLeaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          İzin talebi bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      allLeaves.map((leave) => {
                        const employee = allEmployees.find(e => e.id === leave.employeeId)
                        const branch = branches.find(b => b.id === leave.facilityId)
                        return (
                          <TableRow key={leave.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Buildings size={16} className="text-muted-foreground" />
                                <span>{branch?.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {employee ? `${employee.firstName} ${employee.lastName}` : '-'}
                            </TableCell>
                            <TableCell>{leave.leaveType}</TableCell>
                            <TableCell>
                              {leave.startDate && !isNaN(new Date(leave.startDate).getTime()) ? format(new Date(leave.startDate), 'dd MMM yyyy', { locale: tr }) : '-'}
                            </TableCell>
                            <TableCell>
                              {leave.endDate && !isNaN(new Date(leave.endDate).getTime()) ? format(new Date(leave.endDate), 'dd MMM yyyy', { locale: tr }) : '-'}
                            </TableCell>
                            <TableCell>{leave.totalDays} gün</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  leave.status === 'approved'
                                    ? 'default'
                                    : leave.status === 'pending'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {leave.status === 'approved'
                                  ? 'Onaylandı'
                                  : leave.status === 'pending'
                                    ? 'Bekliyor'
                                    : 'Reddedildi'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Devamsızlık Kayıtları</CardTitle>
              <CardDescription>
                Tüm şubelerin devamsızlık kayıtları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Personel</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Giriş</TableHead>
                      <TableHead>Çıkış</TableHead>
                      <TableHead>Toplam Süre</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Devamsızlık kaydı bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      allAttendance.slice(0, 50).map((record) => {
                        const employee = allEmployees.find(e => e.id === record.employeeId)
                        const branch = branches.find(b => b.id === record.facilityId)
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Buildings size={16} className="text-muted-foreground" />
                                <span>{branch?.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {employee ? `${employee.firstName} ${employee.lastName}` : '-'}
                            </TableCell>
                            <TableCell>
                              {record.date && !isNaN(new Date(record.date).getTime()) ? format(new Date(record.date), 'dd MMM yyyy', { locale: tr }) : '-'}
                            </TableCell>
                            <TableCell>
                              {record.checkIn && !isNaN(new Date(record.checkIn).getTime()) ? format(new Date(record.checkIn), 'HH:mm', { locale: tr }) : '-'}
                            </TableCell>
                            <TableCell>
                              {record.checkOut && !isNaN(new Date(record.checkOut).getTime()) ? format(new Date(record.checkOut), 'HH:mm', { locale: tr }) : '-'}
                            </TableCell>
                            <TableCell>{record.workingHours || 0} saat</TableCell>
                            <TableCell>
                              <Badge
                                variant={record.status === 'present' ? 'default' : 'secondary'}
                              >
                                {record.status === 'present' ? 'Mevcut' : record.status === 'absent' ? 'Yok' : 'Geç'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bordro Kayıtları</CardTitle>
              <CardDescription>
                Tüm şubelerin bordro kayıtları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Personel</TableHead>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Brüt Maaş</TableHead>
                      <TableHead>Kesintiler</TableHead>
                      <TableHead>Net Maaş</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayroll.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Bordro kaydı bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      allPayroll.map((payroll) => {
                        const employee = allEmployees.find(e => e.id === payroll.employeeId)
                        const branch = branches.find(b => b.id === payroll.facilityId)
                        return (
                          <TableRow key={payroll.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Buildings size={16} className="text-muted-foreground" />
                                <span>{branch?.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {employee ? `${employee.firstName} ${employee.lastName}` : '-'}
                            </TableCell>
                            <TableCell>
                              {payroll.period ? format(new Date(payroll.period + '-01'), 'MMMM yyyy', { locale: tr }) : '-'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(payroll.grossSalary || 0)}
                            </TableCell>
                            <TableCell className="text-red-600">
                              {formatCurrency(payroll.totalDeductions || 0)}
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              {formatCurrency(payroll.netSalary || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  payroll.status === 'paid'
                                    ? 'default'
                                    : payroll.status === 'approved'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {payroll.status === 'paid'
                                  ? 'Ödendi'
                                  : payroll.status === 'approved'
                                    ? 'Onaylandı'
                                    : 'Bekliyor'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şube Bazlı Özet</CardTitle>
              <CardDescription>
                Her şubenin İK performans özeti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Toplam Personel</TableHead>
                      <TableHead>Aktif Personel</TableHead>
                      <TableHead>Bekleyen İzinler</TableHead>
                      <TableHead>Toplam Bordro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="font-semibold">{stat.employees}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {stat.activeEmployees}
                        </TableCell>
                        <TableCell className="text-yellow-600 font-semibold">
                          {stat.pendingLeaves}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {formatCurrency(stat.totalPayroll)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Şube Personel Dağılımı</CardTitle>
              <CardDescription>
                Şubeler arası personel sayısı karşılaştırması
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="employees" fill="#3b82f6" name="Toplam Personel" />
                  <Bar dataKey="activeEmployees" fill="#10b981" name="Aktif Personel" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

