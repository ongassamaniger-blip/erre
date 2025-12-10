import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { employeeService } from '@/services/hr/employeeService'
import { leaveService } from '@/services/leaveService'
import { attendanceService } from '@/services/attendanceService'
import { payrollService } from '@/services/payrollService'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { NewLeaveDialog } from '@/features/hr/leaves/NewLeaveDialog'
import { EmployeeDialog } from './components/EmployeeDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Pencil,
  CalendarPlus,
  Wallet,
  User,
  Briefcase,
  Phone,
  Envelope,
  MapPin,
  CalendarBlank,
  Clock,
  CurrencyDollar,
  FileText,
  Note,
  Plus,
  Trash,
} from '@phosphor-icons/react'
import type { Employee, EmployeeStatus } from '@/types/hr'

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isFireDialogOpen, setIsFireDialogOpen] = useState(false)
  const [fireConfirmText, setFireConfirmText] = useState('')

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getEmployeeById(id!),
    enabled: !!id,
  })

  const { data: leaves } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: () => leaveService.getLeaves({ employeeId: id }),
    enabled: !!id,
  })

  const { data: attendanceRecords } = useQuery({
    queryKey: ['employee-attendance', id],
    queryFn: () => attendanceService.getAttendanceByEmployee(id!),
    enabled: !!id,
  })

  const { data: payrolls } = useQuery({
    queryKey: ['employee-payrolls', id],
    queryFn: () => payrollService.getPayrollRecords({ employeeId: id, includeCancelled: true }),
    enabled: !!id,
  })

  const handleEdit = () => {
    setIsEditDialogOpen(true)
  }

  const handleSave = async (data: Partial<Employee>) => {
    try {
      if (!employee?.id) return
      await employeeService.updateEmployee(employee.id, data)
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsEditDialogOpen(false)
      toast.success('Çalışan bilgileri güncellendi')
    } catch (error: any) {
      console.error('Update error:', error)
      toast.error(`Güncelleme hatası: ${error.message || 'Bilinmeyen hata'}`)
    }
  }

  const handleFireEmployee = async () => {
    if (fireConfirmText !== 'onaylıyorum') return
    try {
      if (!employee?.id) return
      await employeeService.hardDeleteEmployee(employee.id)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Çalışan işten çıkarıldı ve kayıtları silindi')
      navigate('/hr/employees')
    } catch (error: any) {
      console.error('Fire employee error:', error)
      toast.error(`İşten çıkarma hatası: ${error.message || 'Bilinmeyen hata'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <PageBreadcrumb />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <PageBreadcrumb />
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Çalışan bulunamadı</p>
            <Link to="/hr/employees">
              <Button className="mt-4">Çalışan Listesine Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?'
  }

  // Safe date formatting helper - handles invalid dates
  const safeFormatDate = (dateString: string | undefined | null, formatStr: string = 'dd MMMM yyyy'): string => {
    if (!dateString) return '-'
    // Check if date contains _deleted_ suffix (soft deleted employee fields)
    if (dateString.includes('_deleted_')) return '-'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '-'
      return format(date, formatStr, { locale: tr })
    } catch {
      return '-'
    }
  }

  // Safe date calculation helper
  const safeCalculateYears = (dateString: string | undefined | null): number => {
    if (!dateString || dateString.includes('_deleted_')) return 0
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 0
      return Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365))
    } catch {
      return 0
    }
  }

  // Clean _deleted_ suffix from strings
  const cleanDeletedSuffix = (value: string | undefined | null): string => {
    if (!value) return '-'
    return value.replace(/_deleted_\d+/g, '')
  }

  const getStatusBadge = (status: EmployeeStatus) => {
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
  }

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      annual: 'Yıllık İzin',
      sick: 'Hastalık İzni',
      unpaid: 'Ücretsiz İzin',
      maternity: 'Doğum İzni',
      paternity: 'Babalık İzni',
      other: 'Diğer',
    }
    return labels[type] || type
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageBreadcrumb />

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {getInitials(employee.firstName, employee.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  {employee.position}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-sm text-muted-foreground">{employee.department}</p>
                  <Separator orientation="vertical" className="h-4" />
                  <p className="text-sm text-muted-foreground">{cleanDeletedSuffix(employee.code)}</p>
                  <Separator orientation="vertical" className="h-4" />
                  {getStatusBadge(employee.status)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Pencil size={20} />
                Düzenle
              </Button>
              {employee.status !== 'inactive' && (
                <Button onClick={() => setIsLeaveDialogOpen(true)}>
                  <CalendarPlus size={20} />
                  İzin Ver
                </Button>
              )}
              {employee.status === 'inactive' && (
                <Button
                  variant="destructive"
                  onClick={() => setIsFireDialogOpen(true)}
                >
                  <Trash size={20} />
                  İşten Çıkar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="employment">İş Bilgileri</TabsTrigger>
          <TabsTrigger value="salary">Maaş & Ödemeler</TabsTrigger>
          <TabsTrigger value="leaves">İzinler</TabsTrigger>
          <TabsTrigger value="attendance">Devamsızlık</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Çalışma Süresi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {safeCalculateYears(employee.hireDate)} yıl
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {safeFormatDate(employee.hireDate)} tarihinden beri
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Kullanılan İzin (Bu Yıl)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leaves?.filter(l =>
                    l.status === 'approved' &&
                    new Date(l.startDate).getFullYear() === new Date().getFullYear()
                  ).reduce((acc, curr) => acc + curr.totalDays, 0) || 0} gün
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tüm izin tipleri dahil
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Yıllık İzin Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employee.leaveEntitlements?.find(e => e.type === 'annual')?.usedDays || 0} / {employee.leaveEntitlements?.find(e => e.type === 'annual')?.totalDays || 14}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kullanılan / Toplam Gün
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maaş
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employee.salary.amount.toLocaleString('tr-TR')} {employee.salary.currency}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {employee.salary.paymentDate ? `Her ayın ${employee.salary.paymentDate}. günü` : 'Ödeme günü girilmedi'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Kişisel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">TC Kimlik No</p>
                    <p className="font-medium">{cleanDeletedSuffix(employee.nationalId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Doğum Tarihi</p>
                    <p className="font-medium">
                      {safeFormatDate(employee.dateOfBirth)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cinsiyet</p>
                    <p className="font-medium">
                      {employee.gender === 'male' ? 'Erkek' : employee.gender === 'female' ? 'Kadın' : 'Diğer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Medeni Durum</p>
                    <p className="font-medium">
                      {employee.maritalStatus === 'single' ? 'Bekar' :
                        employee.maritalStatus === 'married' ? 'Evli' :
                          employee.maritalStatus === 'divorced' ? 'Boşanmış' : 'Dul'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Uyruk</p>
                    <p className="font-medium">{employee.nationality}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone size={20} />
                  İletişim Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Telefon</p>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-muted-foreground" />
                    <p className="font-medium">{employee.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">E-posta</p>
                  <div className="flex items-center gap-2">
                    <Envelope size={16} className="text-muted-foreground" />
                    <p className="font-medium">{cleanDeletedSuffix(employee.email)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Adres</p>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-muted-foreground mt-1" />
                    <p className="font-medium">{employee.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acil Durum İletişim</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">İsim</p>
                <p className="font-medium">{employee.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yakınlık</p>
                <p className="font-medium">{employee.emergencyContact.relationship}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{employee.emergencyContact.phone}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase size={20} />
                İş Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Çalışan Kodu</p>
                <p className="font-medium">{cleanDeletedSuffix(employee.code)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departman</p>
                <p className="font-medium">{employee.department}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pozisyon</p>
                <p className="font-medium">{employee.position}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">İstihdam Tipi</p>
                <p className="font-medium">
                  {employee.employmentType === 'full-time' ? 'Tam Zamanlı' :
                    employee.employmentType === 'part-time' ? 'Yarı Zamanlı' : 'Sözleşmeli'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">İşe Giriş Tarihi</p>
                <p className="font-medium">
                  {safeFormatDate(employee.hireDate)}
                </p>
              </div>
              {employee.probationEndDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Deneme Süresi Bitişi</p>
                  <p className="font-medium">
                    {safeFormatDate(employee.probationEndDate)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Durum</p>
                {getStatusBadge(employee.status)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar size={20} />
                Maaş Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Maaş Tutarı</p>
                <p className="text-2xl font-bold">
                  {employee.salary.amount.toLocaleString('tr-TR')} {employee.salary.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ödeme Sıklığı</p>
                <p className="font-medium">
                  {employee.salary.frequency === 'monthly' ? 'Aylık' :
                    employee.salary.frequency === 'bi-weekly' ? 'İki Haftada Bir' : 'Haftalık'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Banka Bilgileri</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleEdit} title="Düzenle">
                <Pencil size={18} />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Banka Adı</p>
                <p className="font-medium">{employee.bankName || '-'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">IBAN</p>
                <p className="font-medium font-mono">{employee.iban || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bordro Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {payrolls && payrolls.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dönem</TableHead>
                        <TableHead>Brüt Maaş</TableHead>
                        <TableHead>Net Maaş</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Ödeme Tarihi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrolls.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell>
                            {format(new Date(payroll.period + '-01'), 'MMMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>
                            {payroll.grossSalary.toLocaleString('tr-TR', { style: 'currency', currency: payroll.currency })}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {payroll.netSalary.toLocaleString('tr-TR', { style: 'currency', currency: payroll.currency })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              payroll.status === 'paid' ? 'default' :
                                payroll.status === 'approved' ? 'secondary' :
                                  payroll.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {payroll.status === 'paid' ? 'Ödendi' :
                                payroll.status === 'approved' ? 'Onaylandı' :
                                  payroll.status === 'cancelled' ? 'İptal Edildi' : 'Taslak'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payroll.paymentDate ? format(new Date(payroll.paymentDate), 'dd MMM yyyy', { locale: tr }) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Bordro kaydı bulunamadı</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {employee.leaveEntitlements?.filter(e => e && e.type).map((entitlement) => (
              <Card key={entitlement.type}>
                <CardHeader>
                  <CardTitle className="text-base">{getLeaveTypeLabel(entitlement.type)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kullanılan / Toplam</span>
                      <span className="font-medium">
                        {entitlement.usedDays} / {entitlement.totalDays} gün
                      </span>
                    </div>
                    <Progress
                      value={(entitlement.usedDays / entitlement.totalDays) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Kalan: </span>
                    <span className="font-semibold">{entitlement.remainingDays} gün</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>İzin Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {leaves && leaves.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>İzin Tipi</TableHead>
                        <TableHead>Başlangıç</TableHead>
                        <TableHead>Bitiş</TableHead>
                        <TableHead>Süre</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Açıklama</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.filter(leave => leave && leave.id).map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">{getLeaveTypeLabel(leave.leaveType)}</TableCell>
                          <TableCell>{format(new Date(leave.startDate), 'dd MMM yyyy', { locale: tr })}</TableCell>
                          <TableCell>{format(new Date(leave.endDate), 'dd MMM yyyy', { locale: tr })}</TableCell>
                          <TableCell>{leave.totalDays} gün</TableCell>
                          <TableCell>
                            <Badge variant={
                              leave.status === 'approved' ? 'default' :
                                leave.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {leave.status === 'approved' ? 'Onaylandı' :
                                leave.status === 'rejected' ? 'Reddedildi' : 'Beklemede'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                            {leave.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">İzin kaydı bulunamadı</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Devamsızlık Geçmişi</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecords && attendanceRecords.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Giriş</TableHead>
                        <TableHead>Çıkış</TableHead>
                        <TableHead>Çalışma Saati</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Notlar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell>
                            {format(new Date(rec.date), 'dd MMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>
                            {rec.checkIn ? <span className="font-mono">{rec.checkIn}</span> : '-'}
                          </TableCell>
                          <TableCell>
                            {rec.checkOut ? <span className="font-mono">{rec.checkOut}</span> : '-'}
                          </TableCell>
                          <TableCell>
                            {rec.workingHours ? <span>{rec.workingHours.toFixed(1)} saat</span> : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              rec.status === 'present' ? 'default' :
                                rec.status === 'absent' ? 'destructive' :
                                  rec.status === 'late' ? 'secondary' : 'outline'
                            }>
                              {rec.status === 'present' ? 'Mevcut' :
                                rec.status === 'absent' ? 'Yok' :
                                  rec.status === 'late' ? 'Geç' :
                                    rec.status === 'half-day' ? 'Yarım Gün' : rec.status}
                              {rec.lateMinutes && rec.lateMinutes > 0 && ` (${rec.lateMinutes} dk)`}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {rec.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Devamsızlık kaydı bulunamadı</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isLeaveDialogOpen && (
        <NewLeaveDialog
          open={isLeaveDialogOpen}
          onOpenChange={setIsLeaveDialogOpen}
          defaultEmployeeId={id}
        />
      )}

      <EmployeeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        employee={employee}
        onSave={handleSave}
      />

      {/* İşten Çıkarma Onay Dialog'u */}
      <Dialog open={isFireDialogOpen} onOpenChange={setIsFireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">İşten Çıkarma Onayı</DialogTitle>
            <DialogDescription>
              <strong>{employee.firstName} {employee.lastName}</strong> adlı çalışanı işten çıkarmak ve tüm kayıtlarını kalıcı olarak silmek üzeresiniz.
              <br /><br />
              Bu işlem geri alınamaz. Çalışana ait tüm veriler (bordro, izin, devamsızlık kayıtları) silinecektir.
              <br /><br />
              Onaylamak için aşağıya <strong>"onaylıyorum"</strong> yazın:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder='onaylıyorum'
              value={fireConfirmText}
              onChange={(e) => setFireConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsFireDialogOpen(false)
              setFireConfirmText('')
            }}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleFireEmployee}
              disabled={fireConfirmText !== 'onaylıyorum'}
            >
              <Trash size={18} className="mr-2" />
              İşten Çıkar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
