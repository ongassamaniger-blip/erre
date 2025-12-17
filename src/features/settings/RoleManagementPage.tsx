import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Shield,
  CheckCircle,
  XCircle,
  DotsThree,
  Eye,
} from '@phosphor-icons/react'
import { roleManagementService, type Role, type RolePermission } from '@/services/roleManagementService'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { TableSkeleton } from '@/components/common/skeletons'
import { useTranslation } from '@/hooks/useTranslation'
import { CreateRoleDialog } from './components/CreateRoleDialog'
import { EditRoleDialog } from './components/EditRoleDialog'
import { RoleDetailDialog } from './components/RoleDetailDialog'

const moduleLabels: Record<string, string> = {
  finance: 'Finans',
  hr: 'İnsan Kaynakları',
  projects: 'Projeler',
  qurban: 'Kurban',
  reports: 'Raporlar',
  approvals: 'Onaylar',
  calendar: 'Takvim',
  settings: 'Ayarlar',
}

export function RoleManagementPage() {
  const { t } = useTranslation()
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // Permission kontrolü: Sadece Super Admin erişebilir
  if (currentUser?.role !== 'Super Admin') {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Shield size={64} className="text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Erişim Reddedildi</h2>
          <p className="text-muted-foreground">
            Bu sayfaya erişmek için Super Admin yetkisine sahip olmanız gerekmektedir.
          </p>
        </div>
      </div>
    )
  }

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleManagementService.getRoles(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roleManagementService.deleteRole(id),
    onSuccess: () => {
      toast.success('Rol başarıyla silindi')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Rol silinirken hata oluştu')
    },
  })

  const handleDelete = async (role: Role) => {
    if (role.isSystemRole) {
      toast.error('Sistem rolleri silinemez')
      return
    }

    if (!confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz?`)) {
      return
    }

    deleteMutation.mutate(role.id)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setEditDialogOpen(true)
  }

  const handleView = async (role: Role) => {
    setSelectedRole(role)
    setDetailDialogOpen(true)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PageBreadcrumb />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rol Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Sistem rolleri oluşturun, düzenleyin ve yönetin
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus size={20} className="mr-2" />
          Yeni Rol Oluştur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roller</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Henüz rol oluşturulmamış
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isSystemRole ? 'default' : 'secondary'}>
                          {role.isSystemRole ? 'Sistem Rolü' : 'Özel Rol'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(role.createdAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <DotsThree size={20} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(role)}>
                              <Eye size={16} className="mr-2" />
                              Detayları Görüntüle
                            </DropdownMenuItem>
                            {!role.isSystemRole && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEdit(role)}>
                                  <Pencil size={16} className="mr-2" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(role)}
                                  className="text-destructive"
                                >
                                  <Trash size={16} className="mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['roles'] })
        }}
      />

      {selectedRole && (
        <>
          <EditRoleDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            role={selectedRole}
            onSuccess={() => {
              setEditDialogOpen(false)
              setSelectedRole(null)
              queryClient.invalidateQueries({ queryKey: ['roles'] })
            }}
          />

          <RoleDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            role={selectedRole}
          />
        </>
      )}
    </div>
  )
}

