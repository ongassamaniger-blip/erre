import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { roleManagementService, type Role, type RolePermission } from '@/services/roleManagementService'
import { CheckCircle, XCircle } from '@phosphor-icons/react'
import { TableSkeleton } from '@/components/common/skeletons'

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

const permissionLabels: Record<string, string> = {
  canView: 'Görüntüle',
  canCreate: 'Oluştur',
  canEdit: 'Düzenle',
  canDelete: 'Sil',
  canApprove: 'Onayla',
  canExport: 'Dışa Aktar',
  canReject: 'Reddet',
}

interface RoleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

export function RoleDetailDialog({ open, onOpenChange, role }: RoleDetailDialogProps) {
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions', role.id],
    queryFn: () => roleManagementService.getRolePermissions(role.id),
    enabled: open && !!role.id,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{role.name}</DialogTitle>
          <DialogDescription>
            {role.description || 'Rol detayları ve izinleri'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={role.isSystemRole ? 'default' : 'secondary'}>
              {role.isSystemRole ? 'Sistem Rolü' : 'Özel Rol'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Oluşturulma: {new Date(role.createdAt).toLocaleDateString('tr-TR')}
            </span>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Modül İzinleri</h3>
            {isLoading ? (
              <TableSkeleton />
            ) : permissions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Henüz izin tanımlanmamış</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {permissions.map((perm: RolePermission) => (
                    <div key={perm.id} className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">{moduleLabels[perm.module] || perm.module}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(perm).map(([key, value]) => {
                          if (key === 'id' || key === 'roleId' || key === 'module' || key === 'projectAccessType') {
                            return null
                          }
                          if (typeof value !== 'boolean') return null

                          return (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              {value ? (
                                <CheckCircle size={16} className="text-green-600" />
                              ) : (
                                <XCircle size={16} className="text-gray-400" />
                              )}
                              <span className={value ? 'font-medium' : 'text-muted-foreground'}>
                                {permissionLabels[key] || key}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                      {perm.module === 'projects' && perm.projectAccessType && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-sm text-muted-foreground">
                            Proje Erişim Tipi: <strong>{perm.projectAccessType}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

