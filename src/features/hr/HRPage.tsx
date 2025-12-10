import { useQuery } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  User, 
  CalendarBlank, 
  ClockCounterClockwise, 
  Wallet,
  Buildings,
  ArrowRight,
  UserCircle,
  Clock,
  CheckCircle
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { employeeService } from '@/services/employeeService'
import { leaveService } from '@/services/leaveService'
import { attendanceService } from '@/services/attendanceService'
import { Skeleton } from '@/components/ui/skeleton'

export function HRPage() {
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  })

  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => leaveService.getLeaves(),
  })

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceService.getAttendanceRecords({}),
  })

  const modules = [
    {
      title: 'Çalışanlar',
      description: 'Personel kayıtları ve bilgileri',
      icon: User,
      link: '/hr/employees',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'İzin Talepleri',
      description: 'İzin yönetimi ve onay süreçleri',
      icon: CalendarBlank,
      link: '/hr/leaves',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Devamsızlık',
      description: 'Devam takibi ve mesai kayıtları',
      icon: ClockCounterClockwise,
      link: '/hr/attendance',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Bordro',
      description: 'Maaş bordrosu ve ödeme yönetimi',
      icon: Wallet,
      link: '/hr/payroll',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Departmanlar',
      description: 'Organizasyon yapısı yönetimi',
      icon: Buildings,
      link: '/hr/departments',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  const activeEmployees = employees?.filter(e => e.status === 'active').length || 0
  const pendingLeaves = leaves?.filter(l => l.status === 'pending').length || 0
  const presentToday = attendance?.filter(a => {
    const today = new Date().toISOString().split('T')[0]
    return a.date === today && a.status === 'present'
  }).length || 0

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">İnsan Kaynakları</h1>
          <p className="text-muted-foreground mt-1">
            Personel yönetimi ve bordro işlemleri
          </p>
        </div>
      </div>

      {employeesLoading || leavesLoading || attendanceLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Toplam Çalışan</p>
                  <p className="text-2xl font-bold">
                    {employees?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Aktif Çalışan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {activeEmployees}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <UserCircle size={24} className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bekleyen İzinler</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {pendingLeaves}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Clock size={24} className="text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bugün Mevcut</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {presentToday}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <CheckCircle size={24} className="text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.link} to={module.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl ${module.bgColor} flex items-center justify-center`}>
                      <Icon size={24} weight="duotone" className={module.color} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
