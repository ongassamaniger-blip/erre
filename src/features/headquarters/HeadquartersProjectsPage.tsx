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
  FolderOpen,
  Buildings,
  MagnifyingGlass,
  FileArrowDown,
  CurrencyDollar,
  Users,
  CalendarBlank,
  CheckCircle,
  Clock,
  XCircle,
} from '@phosphor-icons/react'
import { facilityService } from '@/services/facilityService'
import { projectService } from '@/services/projects/projectService'
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
} from 'recharts'
import * as XLSX from 'xlsx'

export function HeadquartersProjectsPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'active' | 'on-hold' | 'completed'>('all')
  const [activeView, setActiveView] = useState<'projects' | 'summary' | 'analytics'>('projects')

  if (selectedFacility?.type !== 'headquarters') {
    return null
  }

  const { data: branches = [] } = useQuery({
    queryKey: ['facilities', 'branches'],
    queryFn: () => facilityService.getBranches(),
  })

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ['headquarters', 'projects', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(async branch => {
            const projects = await projectService.getProjects(branch.id).catch(() => [])
            return projects.map(proj => ({
              ...proj,
              branchId: branch.id,
              branchName: branch.name,
            }))
          })
        )
        return results.flat()
      } else {
        const projects = await projectService.getProjects(selectedBranchId)
        const branch = branches.find(b => b.id === selectedBranchId)
        return projects.map(proj => ({
          ...proj,
          branchId: selectedBranchId,
          branchName: branch?.name,
        }))
      }
    },
    enabled: branches.length > 0,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredProjects = allProjects.filter(proj => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj as any).branchName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || proj.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // İstatistikler
  const totalProjects = allProjects.length
  const activeProjects = allProjects.filter(p => p.status === 'active').length
  const completedProjects = allProjects.filter(p => p.status === 'completed').length
  const totalBudget = allProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
  const totalSpent = allProjects.reduce((sum, p) => sum + (p.spent || 0), 0)

  // Şube bazlı istatistikler
  const branchStats = branches.map(branch => {
    const branchProjects = allProjects.filter(p => (p as any).branchId === branch.id)
    const active = branchProjects.filter(p => p.status === 'active').length
    const completed = branchProjects.filter(p => p.status === 'completed').length
    const budget = branchProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const spent = branchProjects.reduce((sum, p) => sum + (p.spent || 0), 0)

    return {
      name: branch.name.replace(' Şubesi', ''),
      toplam: branchProjects.length,
      aktif: active,
      tamamlanan: completed,
      bütçe: budget,
      harcanan: spent,
      kalan: budget - spent,
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200'
      case 'completed':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      case 'on-hold':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'planning':
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'completed':
        return 'Tamamlandı'
      case 'on-hold':
        return 'Beklemede'
      case 'planning':
        return 'Planlama'
      default:
        return status
    }
  }

  const handleExportExcel = () => {
    const data = filteredProjects.map(proj => ({
      'Şube': (proj as any).branchName || '-',
      'Kod': proj.code || '-',
      'Proje Adı': proj.name,
      'Durum': getStatusLabel(proj.status),
      'Bütçe': proj.budget || 0,
      'Harcanan': proj.spent || 0,
      'Kalan': (proj.budget || 0) - (proj.spent || 0),
      'Başlangıç': proj.startDate ? format(new Date(proj.startDate), 'dd.MM.yyyy', { locale: tr }) : '-',
      'Bitiş': proj.endDate ? format(new Date(proj.endDate), 'dd.MM.yyyy', { locale: tr }) : '-',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Projeler')
    XLSX.writeFile(wb, `genel_merkez_projeler_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success('Excel dosyası indirildi')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Genel Merkez - Proje Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Tüm şubelerin projelerini görüntüleyin ve yönetin
            </p>
          </div>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
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
                <p className="text-sm text-muted-foreground mb-1">Toplam Proje</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <FolderOpen size={24} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aktif Proje</p>
                <p className="text-2xl font-bold text-green-600">{activeProjects}</p>
              </div>
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tamamlanan</p>
                <p className="text-2xl font-bold text-blue-600">{completedProjects}</p>
              </div>
              <CheckCircle size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Bütçe</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <CurrencyDollar size={24} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="projects">Projeler</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proje Listesi</CardTitle>
                  <CardDescription>
                    Tüm şubelerin projeleri
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
                      placeholder="Proje ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="planning">Planlama</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="on-hold">Beklemede</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
                        <TableHead>Proje</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Bütçe</TableHead>
                        <TableHead>Harcanan</TableHead>
                        <TableHead>Kalan</TableHead>
                        <TableHead>İlerleme</TableHead>
                        <TableHead>Başlangıç</TableHead>
                        <TableHead>Bitiş</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            Proje bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjects.map((project) => {
                          const remaining = (project.budget || 0) - (project.spent || 0)
                          const progress = project.budget ? ((project.spent || 0) / project.budget) * 100 : 0

                          return (
                            <TableRow key={project.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Buildings size={16} className="text-muted-foreground" />
                                  <span className="font-medium">
                                    {(project as any).branchName || '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{project.name}</div>
                                  <div className="text-sm text-muted-foreground">{project.code}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(project.status)}>
                                  {getStatusLabel(project.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(project.budget || 0)}
                              </TableCell>
                              <TableCell className="text-red-600 font-semibold">
                                {formatCurrency(project.spent || 0)}
                              </TableCell>
                              <TableCell className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(remaining)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-12 text-right">
                                    {progress.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {project.startDate
                                  ? format(new Date(project.startDate), 'dd MMM yyyy', { locale: tr })
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {project.endDate
                                  ? format(new Date(project.endDate), 'dd MMM yyyy', { locale: tr })
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şube Bazlı Özet</CardTitle>
              <CardDescription>
                Her şubenin proje performans özeti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Aktif</TableHead>
                      <TableHead>Tamamlanan</TableHead>
                      <TableHead>Bütçe</TableHead>
                      <TableHead>Harcanan</TableHead>
                      <TableHead>Kalan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="font-semibold">{stat.toplam}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {stat.aktif}
                        </TableCell>
                        <TableCell className="text-blue-600 font-semibold">
                          {stat.tamamlanan}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(stat.bütçe)}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(stat.harcanan)}
                        </TableCell>
                        <TableCell
                          className={`font-bold ${stat.kalan >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          {formatCurrency(stat.kalan)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şube Proje Karşılaştırması</CardTitle>
              <CardDescription>
                Şubeler arası proje sayısı ve bütçe karşılaştırması
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
                  <Bar dataKey="toplam" fill="#3b82f6" name="Toplam Proje" />
                  <Bar dataKey="aktif" fill="#10b981" name="Aktif Proje" />
                  <Bar dataKey="tamamlanan" fill="#8b5cf6" name="Tamamlanan" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

