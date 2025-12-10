import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Pencil,
  Trash,
  User,
  Users,
  Tree,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  FileArrowDown,
  Key,
  Envelope,
  FunnelSimple,
  X,
  ArrowClockwise,
} from '@phosphor-icons/react'
import { useAuthStore } from '@/store/authStore'
import { branchUserManagementService } from '@/services/branchUserManagementService'
import type { BranchUser, BranchRole, BranchUserHierarchy } from '@/types/branchUserManagement'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { UserDialog } from './UserDialog'
import { RoleManagementDialog } from './RoleManagementDialog'
import { HierarchyView } from './HierarchyView'
import { UserDetailDialog } from './UserDetailDialog'
import { exportUsersToExcel } from '@/utils/userExport'

export function UserManagementTab() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<BranchUser | null>(null)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [activeView, setActiveView] = useState<'users' | 'hierarchy' | 'roles'>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<BranchUser | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['branch-users', selectedFacility?.id],
    queryFn: () => branchUserManagementService.getUsers(selectedFacility?.id || ''),
    enabled: !!selectedFacility?.id,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['branch-roles', selectedFacility?.id],
    queryFn: () => branchUserManagementService.getRoles(selectedFacility?.id || ''),
    enabled: !!selectedFacility?.id,
  })

  const { data: hierarchy = [] } = useQuery({
    queryKey: ['branch-hierarchy', selectedFacility?.id],
    queryFn: () => branchUserManagementService.getUserHierarchy(selectedFacility?.id || ''),
    enabled: !!selectedFacility?.id && activeView === 'hierarchy',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchUserManagementService.deleteUser(id),
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla silindi')
      queryClient.invalidateQueries({ queryKey: ['branch-users'] })
      queryClient.invalidateQueries({ queryKey: ['branch-hierarchy'] })
    },
    onError: () => {
      toast.error('Kullanıcı silinirken bir hata oluştu')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      branchUserManagementService.updateUser(id, { isActive }),
    onSuccess: () => {
      toast.success('Kullanıcı durumu güncellendi')
      queryClient.invalidateQueries({ queryKey: ['branch-users'] })
      queryClient.invalidateQueries({ queryKey: ['branch-hierarchy'] })
    },
  })

  const bulkToggleActiveMutation = useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      Promise.all(ids.map(id => branchUserManagementService.updateUser(id, { isActive }))),
    onSuccess: () => {
      toast.success(`${selectedUserIds.size} kullanıcının durumu güncellendi`)
      queryClient.invalidateQueries({ queryKey: ['branch-users'] })
      queryClient.invalidateQueries({ queryKey: ['branch-hierarchy'] })
      setSelectedUserIds(new Set())
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => branchUserManagementService.deleteUser(id))),
    onSuccess: () => {
      toast.success(`${selectedUserIds.size} kullanıcı silindi`)
      queryClient.invalidateQueries({ queryKey: ['branch-users'] })
      queryClient.invalidateQueries({ queryKey: ['branch-hierarchy'] })
      setSelectedUserIds(new Set())
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Şifre sıfırlama işlemi (gerçek uygulamada API çağrısı)
      await new Promise(resolve => setTimeout(resolve, 500))
      return { success: true, tempPassword: 'Temp123!' }
    },
    onSuccess: (data, userId) => {
      toast.success(`Şifre sıfırlandı. Geçici şifre: ${data.tempPassword}`)
    },
  })

  const sendWelcomeEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Hoş geldin e-postası gönderme (gerçek uygulamada API çağrısı)
      await new Promise(resolve => setTimeout(resolve, 500))
    },
    onSuccess: () => {
      toast.success('Hoş geldin e-postası gönderildi')
    },
  })

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)))
    } else {
      setSelectedUserIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedUserIds(newSelected)
  }

  const handleBulkActivate = () => {
    bulkToggleActiveMutation.mutate({
      ids: Array.from(selectedUserIds),
      isActive: true,
    })
  }

  const handleBulkDeactivate = () => {
    bulkToggleActiveMutation.mutate({
      ids: Array.from(selectedUserIds),
      isActive: false,
    })
  }

  const handleBulkDelete = () => {
    if (confirm(`${selectedUserIds.size} kullanıcıyı silmek istediğinize emin misiniz?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedUserIds))
    }
  }

  const handleResetPassword = () => {
    if (selectedUserForDetail) {
      resetPasswordMutation.mutate(selectedUserForDetail.id)
    }
  }

  const handleSendWelcomeEmail = (userId: string) => {
    sendWelcomeEmailMutation.mutate(userId)
  }

  const uniqueRoles = Array.from(new Set(users.map(u => u.role)))

  const handleCreateUser = () => {
    setSelectedUser(null)
    setUserDialogOpen(true)
  }

  const handleEditUser = (user: BranchUser) => {
    setSelectedUser(user)
    setUserDialogOpen(true)
  }

  const handleDeleteUser = async (id: string) => {
    if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id)
    }
  }

  const getRoleColor = (role: BranchRole) => {
    if (role.includes('Manager')) return 'bg-blue-500/10 text-blue-700 border-blue-200'
    if (role === 'Accountant' || role === 'HR Specialist' || role === 'Project Coordinator') return 'bg-purple-500/10 text-purple-700 border-purple-200'
    if (role === 'Staff') return 'bg-green-500/10 text-green-700 border-green-200'
    return 'bg-gray-500/10 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Kullanıcı Yönetimi</h3>
          <p className="text-sm text-muted-foreground">
            Şube kullanıcılarını, rolleri ve hiyerarşiyi yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRoleDialogOpen(true)} className="gap-2">
            <Shield size={16} />
            Rolleri Yönet
          </Button>
          <Button onClick={handleCreateUser} className="gap-2">
            <Plus size={16} />
            Yeni Kullanıcı
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users size={16} />
            Kullanıcılar ({users.length})
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2">
            <Tree size={16} />
            Hiyerarşi
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield size={16} />
            Roller ({roles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <Input
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelSimple size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedUserIds.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkActivate}
                    className="gap-2"
                  >
                    <CheckCircle size={16} />
                    Aktif Yap ({selectedUserIds.size})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeactivate}
                    className="gap-2"
                  >
                    <XCircle size={16} />
                    Pasif Yap ({selectedUserIds.size})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <Trash size={16} />
                    Sil ({selectedUserIds.size})
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportUsersToExcel(filteredUsers)}
                className="gap-2"
              >
                <FileArrowDown size={16} />
                Excel İndir
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filtreler</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFilterRole('all')
                    setFilterStatus('all')
                    setSearchQuery('')
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Roller" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Roller</SelectItem>
                      {uniqueRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Kullanıcı bulunamadı
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Departman</TableHead>
                    <TableHead>Üst Yönetici</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Son Giriş</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => {
                    const manager = users.find(u => u.id === user.reportsTo)
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setSelectedUserForDetail(user)
                              setDetailDialogOpen(true)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                                ) : (
                                  <User size={20} className="text-primary" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.department || '-'}</TableCell>
                        <TableCell>{manager?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: user.id, isActive: checked })
                              }
                            />
                            {user.isActive ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <XCircle size={16} className="text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin
                            ? format(new Date(user.lastLogin), 'dd.MM.yyyy HH:mm', { locale: tr })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUserForDetail(user)
                                setDetailDialogOpen(true)
                              }}
                              title="Detay"
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              title="Düzenle"
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendWelcomeEmail(user.id)}
                              title="Hoş Geldin E-postası Gönder"
                            >
                              <Envelope size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user.id)}
                              title="Sil"
                            >
                              <Trash size={16} className="text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hierarchy">
          <HierarchyView 
            hierarchy={hierarchy} 
            users={users}
            facilityName={selectedFacility?.name}
            onUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['branch-hierarchy'] })
            }}
          />
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{role.name}</h4>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                  {role.isSystemRole && (
                    <Badge variant="secondary">Sistem</Badge>
                  )}
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  {Object.values(role.permissions).filter(p => p.view || p.create || p.edit).length} modül izni
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <UserDialog
        open={userDialogOpen}
        onOpenChange={(open) => {
          setUserDialogOpen(open)
          if (!open) setSelectedUser(null)
        }}
        user={selectedUser}
        users={users}
        roles={roles}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['branch-users'] })
          queryClient.invalidateQueries({ queryKey: ['branch-hierarchy'] })
        }}
      />

      <RoleManagementDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        roles={roles}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['branch-roles'] })
        }}
      />

      <UserDetailDialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open)
          if (!open) setSelectedUserForDetail(null)
        }}
        user={selectedUserForDetail}
        onEdit={() => {
          setDetailDialogOpen(false)
          handleEditUser(selectedUserForDetail!)
        }}
        onResetPassword={handleResetPassword}
      />
    </div>
  )
}

