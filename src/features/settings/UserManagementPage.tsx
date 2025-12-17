import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Pencil,
  Trash,
  User,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Key,
  FunnelSimple,
  X,
  Building,
  Mail,
  Calendar,
} from '@phosphor-icons/react'
import { userManagementService, type SystemUser, type SystemRole } from '@/services/userManagementService'
import { facilityService } from '@/services/facilityService'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { TableSkeleton } from '@/components/common/skeletons'
import { CreateUserDialog } from './components/CreateUserDialog'
import { EditUserDialog } from './components/EditUserDialog'
import { UserDetailDialog } from './components/UserDetailDialog'
import { useTranslation } from '@/hooks/useTranslation'

const roleColors: Record<SystemRole, string> = {
  'Super Admin': 'bg-red-500/10 text-red-700 border-red-200',
  'Admin': 'bg-purple-500/10 text-purple-700 border-purple-200',
  'Manager': 'bg-blue-500/10 text-blue-700 border-blue-200',
  'User': 'bg-gray-500/10 text-gray-700 border-gray-200',
}

const statusColors: Record<SystemUser['status'], string> = {
  active: 'bg-green-500/10 text-green-700 border-green-200',
  inactive: 'bg-gray-500/10 text-gray-700 border-gray-200',
  suspended: 'bg-red-500/10 text-red-700 border-red-200',
}

export function UserManagementPage() {
  const { t } = useTranslation()
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['system-users'],
    queryFn: () => userManagementService.getUsers(),
  })

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => facilityService.getFacilities(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userManagementService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      toast.success('Kullanıcı başarıyla silindi')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kullanıcı silinirken hata oluştu')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => userManagementService.suspendUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      toast.success('Kullanıcı askıya alındı')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kullanıcı askıya alınırken hata oluştu')
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => userManagementService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] })
      toast.success('Kullanıcı aktif edildi')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kullanıcı aktif edilirken hata oluştu')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => userManagementService.resetUserPassword(email),
    onSuccess: () => {
      toast.success('Şifre sıfırlama e-postası gönderildi')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Şifre sıfırlama e-postası gönderilemedi')
    },
  })

  // Filtreleme
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleCreateUser = () => {
    setSelectedUser(null)
    setCreateDialogOpen(true)
  }

  const handleEditUser = (user: SystemUser) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleViewUser = (user: SystemUser) => {
    setSelectedUser(user)
    setDetailDialogOpen(true)
  }

  const handleDeleteUser = (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      toast.error('Kendi hesabınızı silemezsiniz')
      return
    }
    if (confirm(`"${user.name}" kullanıcısını silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const handleSuspendUser = (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      toast.error('Kendi hesabınızı askıya alamazsınız')
      return
    }
    if (confirm(`"${user.name}" kullanıcısını askıya almak istediğinize emin misiniz?`)) {
      suspendMutation.mutate(user.id)
    }
  }

  const handleActivateUser = (user: SystemUser) => {
    activateMutation.mutate(user.id)
  }

  const handleResetPassword = (user: SystemUser) => {
    if (confirm(`"${user.email}" adresine şifre sıfırlama e-postası gönderilsin mi?`)) {
      resetPasswordMutation.mutate(user.email)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('Kullanıcı Yönetimi')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Sistem kullanıcılarını yönetin, roller ve yetkileri düzenleyin')}
            </p>
          </div>
          <Button onClick={handleCreateUser}>
            <Plus size={20} className="mr-2" />
            {t('Yeni Kullanıcı')}
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder={t('Kullanıcı ara (isim, e-posta)...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('Rol')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Tüm Roller')}</SelectItem>
                  <SelectItem value="Super Admin">Super Admin</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('Durum')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Tüm Durumlar')}</SelectItem>
                  <SelectItem value="active">{t('Aktif')}</SelectItem>
                  <SelectItem value="inactive">{t('Pasif')}</SelectItem>
                  <SelectItem value="suspended">{t('Askıda')}</SelectItem>
                </SelectContent>
              </Select>
              {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setRoleFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  <X size={16} className="mr-2" />
                  {t('Temizle')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kullanıcı Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            {t('Kullanıcılar')} ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>{t('Kullanıcı bulunamadı')}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Kullanıcı')}</TableHead>
                    <TableHead>{t('E-posta')}</TableHead>
                    <TableHead>{t('Rol')}</TableHead>
                    <TableHead>{t('Tesisler')}</TableHead>
                    <TableHead>{t('Durum')}</TableHead>
                    <TableHead>{t('Son Giriş')}</TableHead>
                    <TableHead className="text-right">{t('İşlemler')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {t('Siz')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role]}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.facilities.length > 0 ? (
                            user.facilities.slice(0, 2).map((facility) => (
                              <Badge key={facility.id} variant="secondary" className="text-xs">
                                <Building size={12} className="mr-1" />
                                {facility.code}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                          {user.facilities.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{user.facilities.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[user.status]}>
                          {user.status === 'active' && <CheckCircle size={12} className="mr-1" />}
                          {user.status === 'suspended' && <XCircle size={12} className="mr-1" />}
                          {user.status === 'active' ? t('Aktif') : 
                           user.status === 'suspended' ? t('Askıda') : t('Pasif')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar size={14} />
                            {format(new Date(user.lastLogin), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Pencil size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(user)}>
                              <Eye size={16} className="mr-2" />
                              {t('Detayları Görüntüle')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Pencil size={16} className="mr-2" />
                              {t('Düzenle')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <Key size={16} className="mr-2" />
                              {t('Şifre Sıfırla')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => handleSuspendUser(user)}
                                className="text-orange-600"
                              >
                                <XCircle size={16} className="mr-2" />
                                {t('Askıya Al')}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleActivateUser(user)}
                                className="text-green-600"
                              >
                                <CheckCircle size={16} className="mr-2" />
                                {t('Aktif Et')}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive"
                            >
                              <Trash size={16} className="mr-2" />
                              {t('Sil')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        facilities={facilities}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['system-users'] })
          setCreateDialogOpen(false)
        }}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            user={selectedUser}
            facilities={facilities}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['system-users'] })
              setEditDialogOpen(false)
              setSelectedUser(null)
            }}
          />

          <UserDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            user={selectedUser}
            facilities={facilities}
          />
        </>
      )}
    </div>
  )
}

