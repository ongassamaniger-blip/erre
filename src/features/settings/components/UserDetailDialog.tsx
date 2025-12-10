import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Envelope,
  Phone,
  Building,
  Briefcase,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Key,
  FileArrowDown,
} from '@phosphor-icons/react'
import type { BranchUser } from '@/types/branchUserManagement'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { exportUserToPDF } from '@/utils/userExport'

interface UserDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: BranchUser | null
  onEdit: () => void
  onResetPassword: () => void
}

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
  onEdit,
  onResetPassword,
}: UserDetailDialogProps) {
  if (!user) return null

  const getRoleColor = (role: string) => {
    if (role.includes('Manager')) return 'bg-blue-500/10 text-blue-700 border-blue-200'
    if (role === 'Accountant' || role === 'HR Specialist' || role === 'Project Coordinator') return 'bg-purple-500/10 text-purple-700 border-purple-200'
    if (role === 'Staff') return 'bg-green-500/10 text-green-700 border-green-200'
    return 'bg-gray-500/10 text-gray-700 border-gray-200'
  }

  const getPermissionCount = () => {
    let count = 0
    Object.values(user.permissions).forEach(module => {
      Object.values(module).forEach(perm => {
        if (perm === true) count++
      })
    })
    return count
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{user.name}</DialogTitle>
              <DialogDescription>Kullanıcı detay bilgileri</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onResetPassword} className="gap-2">
                <Key size={16} />
                Şifre Sıfırla
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                Düzenle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportUserToPDF(user)
                }}
                className="gap-2"
              >
                <FileArrowDown size={16} />
                PDF İndir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
            <TabsTrigger value="permissions">İzinler</TabsTrigger>
            <TabsTrigger value="activity">Aktivite</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Kişisel Bilgiler</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">İsim</p>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Envelope size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">E-posta</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-3">
                        <Phone size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefon</p>
                          <p className="font-medium">{user.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Organizasyon</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Rol</p>
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                    {user.department && (
                      <div className="flex items-center gap-3">
                        <Building size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Departman</p>
                          <p className="font-medium">{user.department}</p>
                        </div>
                      </div>
                    )}
                    {user.position && (
                      <div className="flex items-center gap-3">
                        <Briefcase size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Pozisyon</p>
                          <p className="font-medium">{user.position}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Durum</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {user.isActive ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <XCircle size={20} className="text-red-600" />
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Durum</p>
                        <p className="font-medium">
                          {user.isActive ? 'Aktif' : 'Pasif'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Oluşturulma</p>
                        <p className="font-medium">
                          {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: tr })}
                        </p>
                      </div>
                    </div>
                    {user.lastLogin && (
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Son Giriş</p>
                          <p className="font-medium">
                            {format(new Date(user.lastLogin), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">İzin Özeti</h3>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold">{getPermissionCount()}</p>
                    <p className="text-sm text-muted-foreground">Toplam İzin</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <div className="space-y-4">
              {Object.entries(user.permissions).map(([module, perms]) => (
                <div key={module} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 capitalize">{module}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(perms).map(([perm, value]) => (
                      <div key={perm} className="flex items-center gap-2">
                        {value ? (
                          <CheckCircle size={16} className="text-green-600" />
                        ) : (
                          <XCircle size={16} className="text-gray-400" />
                        )}
                        <span className="text-sm capitalize">
                          {perm === 'view' && 'Görüntüle'}
                          {perm === 'create' && 'Oluştur'}
                          {perm === 'edit' && 'Düzenle'}
                          {perm === 'delete' && 'Sil'}
                          {perm === 'approve' && 'Onayla'}
                          {perm === 'reject' && 'Reddet'}
                          {perm === 'export' && 'Dışa Aktar'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Aktivite geçmişi yakında eklenecek
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

