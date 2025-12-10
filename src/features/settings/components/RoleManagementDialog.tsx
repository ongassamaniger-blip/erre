import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash } from '@phosphor-icons/react'
import { branchUserManagementService } from '@/services/branchUserManagementService'
import type { BranchRoleDefinition, BranchUserPermissions } from '@/types/branchUserManagement'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

const roleSchema = z.object({
  name: z.string().min(1, 'Rol adı zorunludur'),
  description: z.string().min(1, 'Açıklama zorunludur'),
})

type RoleFormData = z.infer<typeof roleSchema>

interface RoleManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: BranchRoleDefinition[]
  onSuccess: () => void
}

export function RoleManagementDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: RoleManagementDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [editingRole, setEditingRole] = useState<BranchRoleDefinition | null>(null)
  const [permissions, setPermissions] = useState<BranchUserPermissions | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const handleCreateRole = () => {
    setEditingRole(null)
    setPermissions({
      finance: { view: false, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: false, create: false, edit: false, delete: false, approve: false },
      qurban: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: false, create: false, export: false },
      approvals: { view: false, approve: false, reject: false },
      calendar: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, edit: false },
    })
    reset({ name: '', description: '' })
  }

  const handleEditRole = (role: BranchRoleDefinition) => {
    setEditingRole(role)
    setPermissions(role.permissions)
    reset({
      name: role.name,
      description: role.description,
    })
  }

  const handleDeleteRole = async (id: string) => {
    try {
      await branchUserManagementService.deleteRole(id)
      toast.success('Rol başarıyla silindi')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Rol silinirken bir hata oluştu')
    }
  }

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (editingRole) {
        await branchUserManagementService.updateRole(editingRole.id, {
          ...data,
          permissions: permissions || editingRole.permissions,
        })
        toast.success('Rol başarıyla güncellendi')
      } else {
        await branchUserManagementService.createRole(selectedFacility?.id || '', {
          ...data,
          name: data.name as any,
          permissions: permissions || {
            finance: { view: false, create: false, edit: false, delete: false, approve: false },
            hr: { view: false, create: false, edit: false, delete: false, approve: false },
            projects: { view: false, create: false, edit: false, delete: false, approve: false },
            qurban: { view: false, create: false, edit: false, delete: false, approve: false },
            reports: { view: false, create: false, export: false },
            approvals: { view: false, approve: false, reject: false },
            calendar: { view: false, create: false, edit: false, delete: false },
            settings: { view: false, edit: false },
          },
        })
        toast.success('Rol başarıyla oluşturuldu')
      }
      onSuccess()
      setEditingRole(null)
      setPermissions(null)
      reset({ name: '', description: '' })
    } catch (error) {
      toast.error('İşlem başarısız oldu')
    }
  }

  const handlePermissionChange = (
    module: keyof BranchUserPermissions,
    permission: string,
    value: boolean
  ) => {
    if (!permissions) return

    setPermissions({
      ...permissions,
      [module]: {
        ...permissions[module],
        [permission]: value,
      } as any,
    })
  }

  const customRoles = roles.filter(r => !r.isSystemRole)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rol Yönetimi</DialogTitle>
          <DialogDescription>
            Şube için özel roller oluşturun ve izinleri yönetin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Yeni Rol Oluşturma Butonu - Üstte */}
          {!editingRole && !permissions && (
            <div className="flex justify-end">
              <Button onClick={handleCreateRole} className="gap-2">
                <Plus size={16} />
                Yeni Rol Oluştur
              </Button>
            </div>
          )}

          {/* Rol Oluşturma/Düzenleme Formu - Üstte göster */}
          {(editingRole || permissions) && (
            <>
              <div className="border rounded-lg p-6 bg-muted/50">
                <h3 className="font-semibold mb-4">
                  {editingRole ? 'Rol Düzenle' : 'Yeni Rol Oluştur'}
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleName">Rol Adı *</Label>
                      <Input
                        id="roleName"
                        {...register('name')}
                        placeholder="Örn: Satış Müdürü"
                        disabled={!!editingRole?.isSystemRole}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roleDescription">Açıklama *</Label>
                      <Textarea
                        id="roleDescription"
                        {...register('description')}
                        placeholder="Rol açıklaması"
                        rows={2}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description.message}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-4">İzinler</h4>
                    <div className="space-y-4">
                      {permissions &&
                        Object.entries(permissions).map(([module, perms]) => (
                          <div key={module} className="border rounded-lg p-4 bg-background">
                            <h5 className="font-medium mb-3 capitalize">{module}</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {Object.entries(perms).map(([perm, value]) => (
                                <div key={perm} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`role-${module}-${perm}`}
                                    checked={value as boolean}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        module as keyof BranchUserPermissions,
                                        perm,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`role-${module}-${perm}`}
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
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingRole(null)
                        setPermissions(null)
                        reset({ name: '', description: '' })
                      }}
                    >
                      İptal
                    </Button>
                    <Button type="submit">
                      {editingRole ? 'Güncelle' : 'Oluştur'}
                    </Button>
                  </div>
                </form>
              </div>
              <Separator />
            </>
          )}

          {/* Rol Listesi */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Mevcut Roller</h3>
              {!editingRole && !permissions && (
                <Button onClick={handleCreateRole} size="sm" variant="outline" className="gap-2">
                  <Plus size={16} />
                  Yeni Rol
                </Button>
              )}
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>İzinler</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        {role.isSystemRole ? (
                          <Badge variant="secondary">Sistem</Badge>
                        ) : (
                          <Badge variant="outline">Özel</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {Object.values(role.permissions).filter(p => p.view || p.create || p.edit).length} modül
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!role.isSystemRole && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditRole(role)}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <Trash size={16} className="text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}

