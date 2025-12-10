import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, User, Building } from '@phosphor-icons/react'
import { branchUserManagementService } from '@/services/branchUserManagementService'
import type { BranchUser, BranchRole, BranchRoleDefinition } from '@/types/branchUserManagement'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

const userSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  name: z.string().min(1, 'İsim zorunludur'),
  role: z.string().min(1, 'Rol zorunludur'),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  reportsTo: z.string().optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: BranchUser | null
  users: BranchUser[]
  roles: BranchRoleDefinition[]
  onSuccess: () => void
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  users,
  roles,
  onSuccess,
}: UserDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [activeTab, setActiveTab] = useState('general')
  const [customPermissions, setCustomPermissions] = useState<BranchUser['permissions'] | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      name: '',
      role: '',
      department: '',
      position: '',
      phone: '',
      isActive: true,
      reportsTo: '',
    },
  })

  const selectedRole = watch('role')
  const selectedRoleDef = roles.find(r => r.name === selectedRole)

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
        isActive: user.isActive,
        reportsTo: user.reportsTo || '',
      })
      setCustomPermissions(user.permissions)
    } else {
      reset({
        email: '',
        name: '',
        role: '',
        department: '',
        position: '',
        phone: '',
        isActive: true,
        reportsTo: '',
      })
      setCustomPermissions(null)
    }
  }, [user, reset])

  // Rol değiştiğinde izinleri güncelle
  useEffect(() => {
    if (selectedRoleDef && !customPermissions) {
      setCustomPermissions(selectedRoleDef.permissions)
    }
  }, [selectedRoleDef, customPermissions])

  const onSubmit = async (data: UserFormData) => {
    try {
      const permissions = customPermissions || selectedRoleDef?.permissions || {
        finance: { view: false, create: false, edit: false, delete: false, approve: false },
        hr: { view: false, create: false, edit: false, delete: false, approve: false },
        projects: { view: false, create: false, edit: false, delete: false, approve: false },
        qurban: { view: false, create: false, edit: false, delete: false, approve: false },
        reports: { view: false, create: false, export: false },
        approvals: { view: false, approve: false, reject: false },
        calendar: { view: false, create: false, edit: false, delete: false },
        settings: { view: false, edit: false },
      }

      if (user) {
        await branchUserManagementService.updateUser(user.id, {
          ...data,
          permissions,
        })
        toast.success('Kullanıcı başarıyla güncellendi')
      } else {
        await branchUserManagementService.createUser(selectedFacility?.id || '', {
          ...data,
          permissions,
        })
        toast.success('Kullanıcı başarıyla oluşturuldu')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  const handlePermissionChange = (
    module: keyof BranchUser['permissions'],
    permission: string,
    value: boolean
  ) => {
    if (!customPermissions) return

    setCustomPermissions({
      ...customPermissions,
      [module]: {
        ...customPermissions[module],
        [permission]: value,
      } as any,
    })
  }

  const managers = users.filter(u => u.id !== user?.id && u.isActive)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
          <DialogDescription>
            {user ? 'Kullanıcı bilgilerini güncelleyin' : 'Yeni bir kullanıcı oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="general">Genel Bilgiler</TabsTrigger>
              <TabsTrigger value="permissions">İzinler</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">İsim *</Label>
                  <Input id="name" {...register('name')} placeholder="Ad Soyad" />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select
                    value={watch('role')}
                    onValueChange={(value) => {
                      setValue('role', value)
                      setCustomPermissions(null) // Rol değişince izinleri sıfırla
                    }}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportsTo">Üst Yönetici</Label>
                  <Select
                    value={watch('reportsTo') || 'none'}
                    onValueChange={(value) => setValue('reportsTo', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger id="reportsTo">
                      <SelectValue placeholder="Üst yönetici seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yok</SelectItem>
                      {managers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} ({manager.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departman</Label>
                  <Input id="department" {...register('department')} placeholder="Departman" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Pozisyon</Label>
                  <Input id="position" {...register('position')} placeholder="Pozisyon" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" {...register('phone')} placeholder="+90 212 123 45 67" />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Aktif Kullanıcı
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              {selectedRoleDef ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm">
                      <strong>Varsayılan Rol:</strong> {selectedRoleDef.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedRoleDef.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(customPermissions || selectedRoleDef.permissions).map(
                      ([module, perms]) => (
                        <div key={module} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 capitalize">{module}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(perms).map(([perm, value]) => (
                              <div key={perm} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${module}-${perm}`}
                                  checked={value as boolean}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(
                                      module as keyof BranchUser['permissions'],
                                      perm,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`${module}-${perm}`}
                                  className="text-sm cursor-pointer capitalize"
                                >
                                  {perm === 'view' && 'Görüntüle'}
                                  {perm === 'create' && 'Oluştur'}
                                  {perm === 'edit' && 'Düzenle'}
                                  {perm === 'delete' && 'Sil'}
                                  {perm === 'approve' && 'Onayla'}
                                  {perm === 'reject' && 'Reddet'}
                                  {perm === 'export' && 'Dışa Aktar'}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Önce bir rol seçin
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">{user ? 'Güncelle' : 'Oluştur'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

