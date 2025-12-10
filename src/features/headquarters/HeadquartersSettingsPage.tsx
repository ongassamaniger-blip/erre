import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Buildings,
  Gear,
  MagnifyingGlass,
  Pencil,
  Eye,
  CheckCircle,
  XCircle,
  Phone,
  Envelope,
  Globe,
  CurrencyDollar,
  Bell,
  Shield,
  FileText,
  Printer,
  Users,
  ArrowRight,
  FloppyDisk,
  Building as BuildingIcon,
} from '@phosphor-icons/react'
import { facilityService } from '@/services/facilityService'
import { branchSettingsService } from '@/services/branchSettingsService'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Facility, ModuleType } from '@/types'
import type { BranchSettings } from '@/types/branchSettings'
import { BranchManagementDialog } from '@/features/dashboard/components/BranchManagementDialog'
import { GeneralSettingsTab } from '@/features/settings/components/GeneralSettingsTab'
import { ContactSettingsTab } from '@/features/settings/components/ContactSettingsTab'
import { FinancialSettingsTab } from '@/features/settings/components/FinancialSettingsTab'
import { RegionalSettingsTab } from '@/features/settings/components/RegionalSettingsTab'
import { NotificationSettingsTab } from '@/features/settings/components/NotificationSettingsTab'
import { ReportSettingsTab } from '@/features/settings/components/ReportSettingsTab'
import { SecuritySettingsTab } from '@/features/settings/components/SecuritySettingsTab'
import { UserManagementTab } from '@/features/settings/components/UserManagementTab'
import { PrintExportSettingsTab } from '@/features/settings/components/PrintExportSettingsTab'

export function HeadquartersSettingsPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterModule, setFilterModule] = useState<ModuleType | 'all'>('all')
  const [activeView, setActiveView] = useState<'overview' | 'modules' | 'settings'>('overview')
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Facility | null>(null)
  const [activeSettingsTab, setActiveSettingsTab] = useState('general')

  if (selectedFacility?.type !== 'headquarters') {
    return null
  }

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['facilities', 'branches'],
    queryFn: () => facilityService.getBranches(),
  })

  // Şube listesi zaten settings verisini içeriyor (select * yapıldığı için)
  const allSettings = branches.map(branch => ({
    settings: branch.settings as BranchSettings | null,
    branch
  })).filter(item => item.settings !== null && Object.keys(item.settings).length > 0)

  const settingsLoading = false

  const filteredBranches = branches.filter(branch => {
    const matchesSearch =
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesModule = filterModule === 'all' ||
      (branch.enabledModules && branch.enabledModules.includes(filterModule))

    return matchesSearch && matchesModule
  })

  const handleViewSettings = (branch: Facility) => {
    setSelectedBranchId(branch.id)
    setSettingsDialogOpen(true)
    setActiveSettingsTab('general')
  }

  const handleEditBranch = (branch: Facility) => {
    setSelectedBranch(branch)
    setBranchDialogOpen(true)
  }

  const isLoading = branchesLoading
  // Settings loading is handled gracefully in the UI components

  // İstatistikler
  const totalBranches = branches.length
  const branchesWithFinance = branches.filter(b => b.enabledModules?.includes('finance')).length
  const branchesWithHR = branches.filter(b => b.enabledModules?.includes('hr')).length
  const branchesWithQurban = branches.filter(b => b.enabledModules?.includes('qurban')).length
  const branchesWithProjects = branches.filter(b => b.enabledModules?.includes('projects')).length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Genel Merkez - Ayarlar Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Tüm şubelerin ayarlarını görüntüleyin ve yönetin
            </p>
          </div>
          <Button onClick={() => {
            setSelectedBranch(null)
            setBranchDialogOpen(true)
          }} className="gap-2">
            <Buildings size={20} />
            Yeni Şube Oluştur
          </Button>
        </div>
      </div>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Şube</p>
                <p className="text-2xl font-bold">{totalBranches}</p>
              </div>
              <Buildings size={24} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Finans Modülü</p>
                <p className="text-2xl font-bold text-blue-600">{branchesWithFinance}</p>
              </div>
              <CurrencyDollar size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">İK Modülü</p>
                <p className="text-2xl font-bold text-green-600">{branchesWithHR}</p>
              </div>
              <Users size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kurban Modülü</p>
                <p className="text-2xl font-bold text-purple-600">{branchesWithQurban}</p>
              </div>
              <FileText size={24} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Projeler Modülü</p>
                <p className="text-2xl font-bold text-orange-600">{branchesWithProjects}</p>
              </div>
              <FileText size={24} className="text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="modules">Modül Yönetimi</TabsTrigger>
          <TabsTrigger value="settings">Şube Ayarları</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Şube Listesi</CardTitle>
                  <CardDescription>
                    Tüm şubeleri görüntüleyin ve yönetin
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={filterModule} onValueChange={(v) => setFilterModule(v as any)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Modül Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Modüller</SelectItem>
                      <SelectItem value="finance">Finans</SelectItem>
                      <SelectItem value="hr">İnsan Kaynakları</SelectItem>
                      <SelectItem value="qurban">Kurban</SelectItem>
                      <SelectItem value="projects">Projeler</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Şube ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
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
                        <TableHead>Konum</TableHead>
                        <TableHead>Aktif Modüller</TableHead>
                        <TableHead>Ayarlar Durumu</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBranches.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Şube bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBranches.map((branch) => {
                          const settings = allSettings.find(s => s.branch.id === branch.id)?.settings
                          const hasSettings = !!settings

                          return (
                            <TableRow key={branch.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Buildings size={20} className="text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{branch.name}</div>
                                    <div className="text-sm text-muted-foreground">{branch.code}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{branch.location}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {branch.enabledModules?.map(module => (
                                    <Badge key={module} variant="outline" className="text-xs">
                                      {module === 'finance' ? '💰 Finans' :
                                        module === 'hr' ? '👥 İK' :
                                          module === 'qurban' ? '🐄 Kurban' :
                                            module === 'projects' ? '📁 Projeler' : module}
                                    </Badge>
                                  ))}
                                  {(!branch.enabledModules || branch.enabledModules.length === 0) && (
                                    <span className="text-xs text-muted-foreground">Modül yok</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {settingsLoading ? (
                                  <Skeleton className="h-5 w-24" />
                                ) : hasSettings ? (
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle size={12} />
                                    Yapılandırıldı
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <XCircle size={12} />
                                    Yapılandırılmadı
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewSettings(branch)}
                                    title="Ayarları Yönet"
                                    className="gap-1"
                                  >
                                    <Gear size={16} />
                                    Ayarları Yönet
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditBranch(branch)}
                                    title="Düzenle"
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                </div>
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

        <TabsContent value="modules" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Modül Dağılımı</CardTitle>
              <CardDescription>
                Şubelerde aktif modüllerin dağılımı ve yönetimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(['finance', 'hr', 'qurban', 'projects'] as ModuleType[]).map(module => {
                  const moduleBranches = branches.filter(b => b.enabledModules?.includes(module))
                  const moduleName =
                    module === 'finance' ? 'Finans Modülü' :
                      module === 'hr' ? 'İnsan Kaynakları Modülü' :
                        module === 'qurban' ? 'Kurban Modülü' :
                          'Projeler Modülü'

                  const moduleIcon =
                    module === 'finance' ? CurrencyDollar :
                      module === 'hr' ? Users :
                        module === 'qurban' ? FileText :
                          FileText

                  const Icon = moduleIcon

                  return (
                    <Card key={module}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon size={24} className="text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{moduleName}</CardTitle>
                              <CardDescription>
                                {moduleBranches.length} şubede aktif
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {totalBranches > 0 ? ((moduleBranches.length / totalBranches) * 100).toFixed(0) : 0}% Kullanım
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {moduleBranches.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Bu modül hiçbir şubede aktif değil
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {moduleBranches.map(branch => (
                              <div
                                key={branch.id}
                                className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                              >
                                <Buildings size={16} className="text-muted-foreground" />
                                <span className="text-sm font-medium">{branch.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şube Ayarları Özeti</CardTitle>
              <CardDescription>
                Tüm şubelerin ayar durumları ve özet bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {allSettings.map(({ settings, branch }) => (
                    <Card key={branch.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Buildings size={20} className="text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{branch.name}</CardTitle>
                              <CardDescription>{branch.location}</CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSettings(branch)}
                            className="gap-2"
                          >
                            <Gear size={16} />
                            Ayarları Yönet
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">İletişim</p>
                            <div className="flex items-center gap-2">
                              {settings.contact.phone ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-gray-400" />
                              )}
                              <span className="text-sm">{settings.contact.phone || 'Yok'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {settings.contact.email ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-gray-400" />
                              )}
                              <span className="text-sm">{settings.contact.email || 'Yok'}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Finansal</p>
                            <div className="flex items-center gap-2">
                              <CurrencyDollar size={16} className="text-muted-foreground" />
                              <span className="text-sm">
                                {settings.financial.defaultCurrency} {settings.financial.currencies ? `(${settings.financial.currencies.length} para birimi)` : ''}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              KDV: %{settings.financial.taxRate || 0}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Bölgesel</p>
                            <div className="flex items-center gap-2">
                              <Globe size={16} className="text-muted-foreground" />
                              <span className="text-sm">{settings.regional.timezone}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {settings.regional.dateFormat} • {settings.regional.timeFormat}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Bildirimler</p>
                            <div className="flex items-center gap-2">
                              {settings.notifications.emailNotifications ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-gray-400" />
                              )}
                              <span className="text-sm">E-posta</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {settings.notifications.smsNotifications ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-gray-400" />
                              )}
                              <span className="text-sm">SMS</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Son güncelleme: {format(new Date(settings.updatedAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                            </span>
                            <span className="text-muted-foreground">
                              Güncelleyen: {settings.updatedBy}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {allSettings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Henüz yapılandırılmış şube ayarı bulunamadı
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Şube Ayarları Yönetim Dialog */}
      {selectedBranchId && (
        <BranchSettingsManagementDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          branchId={selectedBranchId}
          branch={branches.find(b => b.id === selectedBranchId) || null}
        />
      )}

      <BranchManagementDialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        branch={selectedBranch}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['facilities'] })
          queryClient.invalidateQueries({ queryKey: ['headquarters'] })
          queryClient.invalidateQueries({ queryKey: ['headquarters', 'branch-settings'] })
        }}
      />
    </div>
  )
}

// Şube ayarlarını yönetme dialog bileşeni
function BranchSettingsManagementDialog({
  open,
  onOpenChange,
  branchId,
  branch,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  branch: Facility | null
}) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['branch-settings', branchId],
    queryFn: () => branchSettingsService.getSettings(branchId),
    enabled: open && !!branchId,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<BranchSettings>) =>
      branchSettingsService.updateSettings(branchId, updates),
    onSuccess: () => {
      toast.success('Ayarlar başarıyla güncellendi')
      queryClient.invalidateQueries({ queryKey: ['branch-settings'] })
      queryClient.invalidateQueries({ queryKey: ['headquarters', 'branch-settings'] })
    },
    onError: () => {
      toast.error('Ayarlar güncellenirken bir hata oluştu')
    },
  })

  const handleUpdate = (data: any) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <Skeleton className="h-96 w-full" />
        </DialogContent>
      </Dialog>
    )
  }

  if (!settings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8 text-muted-foreground">
            Ayarlar yüklenemedi
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BuildingIcon size={20} />
            {branch?.name} - Ayarlar Yönetimi
          </DialogTitle>
          <DialogDescription>
            Şube ayarlarını buradan yönetebilirsiniz
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="general" className="gap-2 flex-1 min-w-[120px]">
              <BuildingIcon size={14} />
              <span className="hidden sm:inline">Genel</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2 flex-1 min-w-[120px]">
              <Phone size={14} />
              <span className="hidden sm:inline">İletişim</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2 flex-1 min-w-[120px]">
              <CurrencyDollar size={14} />
              <span className="hidden sm:inline">Finansal</span>
            </TabsTrigger>
            <TabsTrigger value="regional" className="gap-2 flex-1 min-w-[120px]">
              <Globe size={14} />
              <span className="hidden sm:inline">Bölgesel</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 flex-1 min-w-[120px]">
              <Bell size={14} />
              <span className="hidden sm:inline">Bildirimler</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2 flex-1 min-w-[120px]">
              <FileText size={14} />
              <span className="hidden sm:inline">Raporlar</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 flex-1 min-w-[120px]">
              <Shield size={14} />
              <span className="hidden sm:inline">Güvenlik</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 flex-1 min-w-[120px]">
              <Users size={14} />
              <span className="hidden sm:inline">Kullanıcılar</span>
            </TabsTrigger>
            <TabsTrigger value="print-export" className="gap-2 flex-1 min-w-[120px]">
              <Printer size={14} />
              <span className="hidden sm:inline">Yazdırma & Export</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <GeneralSettingsTab
              settings={settings}
              onUpdate={(data) => handleUpdate({ general: data })}
            />
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <ContactSettingsTab
              settings={settings}
              onUpdate={(data) => handleUpdate({ contact: data })}
            />
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <FinancialSettingsTab
              settings={settings}
              onUpdate={(data) => handleUpdate({ financial: data })}
            />
          </TabsContent>

          <TabsContent value="regional" className="mt-6">
            <RegionalSettingsTab
              settings={settings}
              onUpdate={(data) => handleUpdate({ regional: data })}
            />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettingsTab
              settings={settings}
              onUpdate={(data) => handleUpdate({ notifications: data })}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportSettingsTab
              settings={settings}
              onUpdate={(data) => handleUpdate({ reports: data })}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettingsTab
              settings={settings}
              onUpdate={(data) => handleUpdate({ security: data })}
            />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="print-export" className="mt-6">
            <PrintExportSettingsTab facilityId={branchId} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
