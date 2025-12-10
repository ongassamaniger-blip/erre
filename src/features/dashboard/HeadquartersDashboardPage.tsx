import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Buildings,
  Plus,
  Pencil,
  Trash,
  Eye,
  CurrencyDollar,
  Users,
  FolderOpen,
  ChartBar,
  ArrowRight,
  MagnifyingGlass,
  FunnelSimple,
  CheckCircle,
  XCircle,
  Clock,
  Gear,
  FileArrowDown,
  Download,
} from '@phosphor-icons/react'
import type { Facility, ModuleType } from '@/types'
import { BranchManagementDialog } from './components/BranchManagementDialog'
import { facilityService } from '@/services/facilityService'
import { transactionService } from '@/services/finance/transactionService'
import { employeeService } from '@/services/employeeService'
import { projectService } from '@/services/projects/projectService'
import { budgetTransferService } from '@/services/finance/budgetTransferService'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/format'
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
  LineChart,
  Line,
} from 'recharts'
import { useTranslation } from '@/hooks/useTranslation'

interface BranchStats {
  facility: Facility
  totalRevenue: number
  budgetFromHeadquarters: number
  totalExpense: number
  netIncome: number
  employeeCount: number
  projectCount: number
  activeProjects: number
  pendingTransfers: number
  completedTransfers: number
  totalTransferred: number
  lastActivity?: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function HeadquartersDashboardPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<'overview' | 'branches' | 'analytics'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterModule, setFilterModule] = useState<'all' | ModuleType>('all')
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Facility | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<{ id: string, name: string } | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  // Queries
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['facilities', 'branches'],
    queryFn: () => facilityService.getBranches()
  })

  const { data: pendingTransfers = [], isLoading: transfersLoading } = useQuery({
    queryKey: ['budget-transfers', 'pending'],
    queryFn: () => budgetTransferService.getBudgetTransfers({ status: 'pending' })
  })

  const { data: allTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: () => transactionService.getAllTransactions()
  })

  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: () => employeeService.getEmployees() // Temporarily removed status filter for debugging
  })

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectService.getProjects()
  })

  // Derived State & Calculations
  // Helper function to get amount in TRY
  const getAmountInTRY = (tx: any): number => {
    const amount = tx.amount || 0
    const currency = tx.currency || 'TRY'
    const exchangeRate = tx.exchangeRate || 1

    if (currency === 'TRY') {
      return amount
    }
    // Convert foreign currency to TRY using the stored exchange rate
    return amount * exchangeRate
  }

  const branchStats: BranchStats[] = (branches || []).map(branch => {
    const branchTx = (allTransactions || []).filter(t => t.facilityId === branch.id)
    const branchEmployees = (employees || []).filter(e => e.facilityId === branch.id)
    const branchProjects = (projects || []).filter(p => p.facilityId === branch.id)

    const allIncome = branchTx
      .filter(t => t.type === 'income' && t.status === 'approved')

    const budgetFromHeadquarters = allIncome
      .filter(t => t.description?.includes('Bütçe Aktarımı'))
      .reduce((sum, t) => sum + getAmountInTRY(t), 0)

    const operationalRevenue = allIncome
      .filter(t => !t.description?.includes('Bütçe Aktarımı'))
      .reduce((sum, t) => sum + getAmountInTRY(t), 0)

    const totalExpense = branchTx
      .filter(t => t.type === 'expense' && t.status === 'approved')
      .reduce((sum, t) => sum + getAmountInTRY(t), 0)

    const completedTransfers = (allTransactions || [])
      .filter(t => t.facilityId === branch.id && t.description?.includes('Bütçe Aktarımı'))
      .length

    return {
      facility: branch,
      totalRevenue: operationalRevenue, // Only operational revenue in TRY
      budgetFromHeadquarters,
      totalExpense,
      netIncome: operationalRevenue - totalExpense,
      employeeCount: branchEmployees.length,
      projectCount: branchProjects.length,
      activeProjects: branchProjects.filter(p => p.status === 'active').length,
      pendingTransfers: (pendingTransfers || []).filter(t => t.toFacilityId === branch.id).length,
      completedTransfers,
      totalTransferred: 0 // Calculated separately if needed
    }
  })

  const totalStats = {
    totalBranches: (branches || []).length,
    totalEmployees: (employees || []).length,
    totalTransferred: branchStats.reduce((sum, b) => sum + (b.budgetFromHeadquarters || 0), 0),
    totalIncome: branchStats.reduce((sum, b) => sum + (b.totalRevenue || 0), 0),
    totalExpense: branchStats.reduce((sum, b) => sum + (b.totalExpense || 0), 0)
  }

  const netIncome = branchStats.reduce((sum, b) => sum + b.netIncome, 0)

  const filteredBranches = branchStats.filter(stat => {
    const matchesSearch = stat.facility?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stat.facility?.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesModule = filterModule === 'all' || stat.facility?.enabledModules?.includes(filterModule)
    return matchesSearch && matchesModule
  })

  const revenueChartData = branchStats.map(b => ({
    name: b.facility?.name || 'Bilinmeyen',
    gelir: b.totalRevenue || 0,
    gider: b.totalExpense || 0,
    net: b.netIncome || 0
  }))

  const moduleChartData = [
    { name: t('Finans'), value: (branches || []).filter(b => b.enabledModules?.includes('finance')).length },
    { name: t('İK'), value: (branches || []).filter(b => b.enabledModules?.includes('hr')).length },
    { name: t('Kurban'), value: (branches || []).filter(b => b.enabledModules?.includes('qurban')).length },
    { name: t('Projeler'), value: (branches || []).filter(b => b.enabledModules?.includes('projects')).length }
  ].filter(d => d.value > 0)

  const isLoading = branchesLoading || transfersLoading || txLoading || employeesLoading || projectsLoading

  // Handlers
  const handleViewBranch = (branch: Facility) => {
    // Navigate to branch dashboard or details
    // For now, maybe just open edit dialog or do nothing if not implemented
    setSelectedBranch(branch)
    setBranchDialogOpen(true)
  }

  const handleModuleClick = (branch: Facility, module: string) => {
    // Navigate to specific module of that branch if needed
    // For now, just toast
    toast.info(`${branch.name} - ${module} ${t('modülüne gidiliyor...')}`)
  }

  const handleDeleteBranch = (id: string, name: string) => {
    setBranchToDelete({ id, name })
    setDeleteConfirmation('')
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!branchToDelete) return

    try {
      await facilityService.deleteFacility(branchToDelete.id)
      toast.success(t('Şube başarıyla silindi'))
      setDeleteDialogOpen(false)
      setBranchToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['facilities'] })
    } catch (error) {
      console.error('Delete branch error:', error)
      toast.error(t('Şube silinirken bir hata oluştu'))
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('Genel Merkez Yönetimi')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Tüm şubeleri yönetin, izleyin ve kontrol edin')}
            </p>
          </div>
          <Button onClick={() => {
            setSelectedBranch(null)
            setBranchDialogOpen(true)
          }} className="gap-2">
            <Plus size={20} />
            {t('Yeni Şube Oluştur')}
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <ChartBar size={16} />
            {t('Genel Bakış')}
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-2">
            <Buildings size={16} />
            {t('Şube Yönetimi')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <ChartBar size={16} />
            {t('Analitik')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Toplam İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('Toplam Şube')}</p>
                    <p className="text-3xl font-bold">{totalStats.totalBranches}</p>
                  </div>
                  <Buildings size={32} className="text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('Toplam Gelir')}</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(totalStats.totalIncome)}
                    </p>
                  </div>
                  <CurrencyDollar size={32} className="text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('Toplam Personel')}</p>
                    <p className="text-3xl font-bold">{totalStats.totalEmployees}</p>
                  </div>
                  <Users size={32} className="text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('Toplam Gider')}</p>
                    <p className="text-3xl font-bold text-red-600">
                      {formatCurrency(totalStats.totalExpense)}
                    </p>
                  </div>
                  <CurrencyDollar size={32} className="text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bekleyen İşlemler */}
          {pendingTransfers.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('Bekleyen Bütçe Aktarım Talepleri')}</CardTitle>
                    <CardDescription>
                      {pendingTransfers.length} {t('adet bekleyen talep')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/finance/budget-transfers')}
                    className="gap-2"
                  >
                    {t('Tümünü Gör')}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingTransfers.slice(0, 5).map(transfer => {
                    const branch = branches.find(b => b.id === transfer.toFacilityId)
                    return (
                      <div
                        key={transfer.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Clock size={20} className="text-yellow-600" />
                          <div>
                            <p className="font-medium">{branch?.name || 'Bilinmeyen Şube'}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(transfer.amount)} • {transfer.code}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{t('Bekliyor')}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Şube Özet Kartları */}
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('Şube Özetleri')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))
              ) : (
                branchStats.slice(0, 6).map((branch, index) => (
                  <motion.div
                    key={branch.facility.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => handleViewBranch(branch.facility)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Buildings size={24} className="text-primary" weight="duotone" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold">{branch.facility.name}</CardTitle>
                              <CardDescription>{branch.facility.location}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {branch.facility.enabledModules?.map(module => (
                              <div
                                key={module}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleModuleClick(branch.facility, module)
                                }}
                                className="w-9 h-9 rounded-xl border bg-background shadow-sm flex items-center justify-center hover:bg-accent cursor-pointer transition-all hover:scale-105"
                                title={
                                  module === 'finance' ? 'Finans' :
                                    module === 'hr' ? 'İnsan Kaynakları' :
                                      module === 'qurban' ? 'Kurban' : 'Projeler'
                                }
                              >
                                <span className="text-lg leading-none select-none">
                                  {module === 'finance' ? '💰' :
                                    module === 'hr' ? '👥' :
                                      module === 'qurban' ? '🐄' :
                                        '📁'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('Gelir')}</span>
                            <span className="font-semibold text-green-600 text-base">
                              {formatCurrency(branch.totalRevenue)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('GM Bütçesi')}</span>
                            <span className="font-semibold text-blue-600 text-base">
                              {formatCurrency(branch.budgetFromHeadquarters)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('Gider')}</span>
                            <span className="font-semibold text-red-600 text-base">
                              {formatCurrency(branch.totalExpense)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <span className="font-medium">{t('Net')}</span>
                            <span
                              className={`font-bold text-lg ${branch.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                              {formatCurrency(branch.netIncome)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t('Personel')}</p>
                            <div className="flex items-center gap-2">
                              <Users size={20} className="text-muted-foreground" weight="duotone" />
                              <span className="text-lg font-semibold">{branch.employeeCount}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t('Projeler')}</p>
                            <div className="flex items-center gap-2">
                              <FolderOpen size={20} className="text-muted-foreground" weight="duotone" />
                              <span className="text-lg font-semibold">{branch.activeProjects}/{branch.projectCount}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </TabsContent >

        <TabsContent value="branches" className="space-y-6 mt-6">
          {/* Filtreler ve Arama */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Şube Listesi')}</CardTitle>
              <CardDescription>
                {t('Tüm şubeleri görüntüleyin, düzenleyin ve yönetin')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("Şube ara...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterModule} onValueChange={(v) => setFilterModule(v as any)}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder={t("Modül Filtrele")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('Tüm Modüller')}</SelectItem>
                    <SelectItem value="finance">{t('Finans')}</SelectItem>
                    <SelectItem value="hr">{t('İnsan Kaynakları')}</SelectItem>
                    <SelectItem value="qurban">{t('Kurban')}</SelectItem>
                    <SelectItem value="projects">{t('Projeler')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                        <TableHead>{t('Şube')}</TableHead>
                        <TableHead>{t('Konum')}</TableHead>
                        <TableHead>{t('Aktif Modüller')}</TableHead>
                        <TableHead>{t('Personel')}</TableHead>
                        <TableHead>{t('Projeler')}</TableHead>
                        <TableHead>{t('Net Gelir')}</TableHead>
                        <TableHead className="text-right">{t('İşlemler')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBranches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {t('Şube bulunamadı')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBranches.map((branch) => (
                          <TableRow key={branch.facility.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Buildings size={20} className="text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{branch.facility.name}</div>
                                  <div className="text-sm text-muted-foreground">{branch.facility.code}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{branch.facility.location}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {branch.facility.enabledModules?.map(module => (
                                  <Badge key={module} variant="outline" className="text-xs">
                                    {module === 'finance' ? '💰 Finans' :
                                      module === 'hr' ? '👥 İK' :
                                        module === 'qurban' ? '🐄 Kurban' :
                                          module === 'projects' ? '📁 Projeler' : module}
                                  </Badge>
                                ))}
                                {(!branch.facility.enabledModules || branch.facility.enabledModules.length === 0) && (
                                  <span className="text-xs text-muted-foreground">{t('Modül yok')}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users size={16} className="text-muted-foreground" />
                                <span className="font-medium">{branch.employeeCount}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FolderOpen size={16} className="text-muted-foreground" />
                                <span className="font-medium">{branch.activeProjects}/{branch.projectCount}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${branch.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                              >
                                {formatCurrency(branch.netIncome)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewBranch(branch.facility)}
                                  title={t("Detay")}
                                >
                                  <Eye size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedBranch(branch.facility)
                                    setBranchDialogOpen(true)
                                  }}
                                  title={t("Düzenle")}
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteBranch(branch.facility.id, branch.facility.name)}
                                  title={t("Sil")}
                                >
                                  <Trash size={16} className="text-destructive" />
                                </Button>
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          {/* Finansal Karşılaştırma */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Şube Finansal Karşılaştırması')}</CardTitle>
              <CardDescription>{t('Gelir, gider ve net karşılaştırması')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="gelir" fill="#10b981" name="Gelir" />
                    <Bar dataKey="gider" fill="#ef4444" name="Gider" />
                    <Bar dataKey="net" fill="#3b82f6" name="Net" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Modül Dağılımı */}
          <Card>
            <CardHeader>
              <CardTitle>{t('Modül Dağılımı')}</CardTitle>
              <CardDescription>{t('Şubelerde aktif modüllerin dağılımı')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moduleChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {moduleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >

      <BranchManagementDialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        branch={selectedBranch}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['facilities'] })
          queryClient.invalidateQueries({ queryKey: ['headquarters'] })
          // Force reload to ensure everything is up to date as requested
          window.location.reload()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${deleteDialogOpen ? 'block' : 'hidden'}`}>
        <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-lg font-semibold mb-2">Şubeyi Sil</h3>
          <p className="text-muted-foreground mb-4">
            Bu şubeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve şubeye ait tüm veriler (işlemler, personel, projeler vb.) kalıcı olarak silinecektir.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Onaylamak için "onaylıyorum" yazın:
              </label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="onaylıyorum"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteConfirmation !== 'onaylıyorum'}
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
