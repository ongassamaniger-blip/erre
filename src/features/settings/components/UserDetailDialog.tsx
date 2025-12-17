import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { userManagementService, type SystemUser } from '@/services/userManagementService'
import type { Facility } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Mail,
  Shield,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  User,
} from '@phosphor-icons/react'

interface UserDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: SystemUser
  facilities: Facility[]
}

const roleColors: Record<SystemUser['role'], string> = {
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

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
  facilities,
}: UserDetailDialogProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const facilityNames = user.facilities.map(f => {
    const facility = facilities.find(fac => fac.id === f.id)
    return facility ? `${facility.name} (${facility.code})` : f.code
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{user.name}</div>
              <div className="text-sm font-normal text-muted-foreground">{user.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Kullanıcı detayları ve yetkilendirme bilgileri
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User size={18} />
              Temel Bilgiler
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">E-posta</div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  {user.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Rol</div>
                <Badge variant="outline" className={roleColors[user.role]}>
                  <Shield size={12} className="mr-1" />
                  {user.role}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Durum</div>
                <Badge variant="outline" className={statusColors[user.status]}>
                  {user.status === 'active' && <CheckCircle size={12} className="mr-1" />}
                  {user.status === 'suspended' && <XCircle size={12} className="mr-1" />}
                  {user.status === 'active' ? 'Aktif' : 
                   user.status === 'suspended' ? 'Askıda' : 'Pasif'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Son Giriş</div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  {user.lastLogin 
                    ? format(new Date(user.lastLogin), 'dd MMM yyyy HH:mm', { locale: tr })
                    : 'Henüz giriş yapmadı'}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tesis Erişimleri */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building size={18} />
              Tesis Erişimleri ({user.facilities.length})
            </h3>
            {user.facilities.length > 0 ? (
              <div className="space-y-2">
                {user.facilities.map((facility) => {
                  const fullFacility = facilities.find(f => f.id === facility.id)
                  return (
                    <div
                      key={facility.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Building size={20} className="text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {fullFacility?.name || facility.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {facility.code}
                          </div>
                        </div>
                      </div>
                      {facility.role && (
                        <Badge variant="secondary">{facility.role}</Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building size={48} className="mx-auto mb-4 opacity-50" />
                <p>Bu kullanıcının tesis erişimi yok</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Tarih Bilgileri */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar size={18} />
              Tarih Bilgileri
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Oluşturulma</div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  {format(new Date(user.createdAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Son Güncelleme</div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  {format(new Date(user.updatedAt), 'dd MMM yyyy HH:mm', { locale: tr })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
