import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { roleManagementService, type CreateRoleData } from '@/services/roleManagementService'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const createRoleSchema = z.object({
  name: z.string().min(2, 'Rol adı en az 2 karakter olmalı'),
  description: z.string().optional(),
})

type CreateRoleFormData = z.infer<typeof createRoleSchema>

const modules = [
  { id: 'finance', label: 'Finans', permissions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'hr', label: 'İnsan Kaynakları', permissions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'projects', label: 'Projeler', permissions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'qurban', label: 'Kurban', permissions: ['view', 'create', 'edit', 'delete', 'approve'] },
  { id: 'reports', label: 'Raporlar', permissions: ['view', 'export'] },
  { id: 'approvals', label: 'Onaylar', permissions: ['view', 'approve', 'reject'] },
  { id: 'calendar', label: 'Takvim', permissions: ['view', 'create', 'edit', 'delete'] },
  { id: 'settings', label: 'Ayarlar', permissions: ['view', 'edit'] },
] as const

const permissionLabels: Record<string, string> = {
  view: 'Görüntüle',
  create: 'Oluştur',
  edit: 'Düzenle',
  delete: 'Sil',
  approve: 'Onayla',
  export: 'Dışa Aktar',
  reject: 'Reddet',
}

interface CreateRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess }: CreateRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({})
  const [projectAccessType, setProjectAccessType] = useState<'all' | 'assigned' | 'department' | 'facility'>('facility')

  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value,
      },
    }))
  }

  const handleSelectAll = (module: string, value: boolean) => {
    const moduleConfig = modules.find(m => m.id === module)
    if (!moduleConfig) return

    const newPermissions: Record<string, boolean> = {}
    moduleConfig.permissions.forEach(perm => {
      newPermissions[perm] = value
    })

    setPermissions(prev => ({
      ...prev,
      [module]: newPermissions,
    }))
  }

  const onSubmit = async (data: CreateRoleFormData) => {
    try {
      setIsLoading(true)

      // İzinleri formatla
      const formattedPermissions = modules.map(module => {
        const modulePerms = permissions[module.id] || {}
        return {
          module: module.id,
          canView: modulePerms.view || false,
          canCreate: modulePerms.create || false,
          canEdit: modulePerms.edit || false,
          canDelete: modulePerms.delete || false,
          canApprove: modulePerms.approve || false,
          canExport: modulePerms.export || false,
          canReject: modulePerms.reject || false,
          projectAccessType: module.id === 'projects' 
            ? (modulePerms.view ? projectAccessType : 'all') 
            : undefined,
        }
      })

      await roleManagementService.createRole({
        name: data.name,
        description: data.description,
        permissions: formattedPermissions,
      })

      toast.success('Rol başarıyla oluşturuldu')
      form.reset()
      setPermissions({})
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Rol oluşturulurken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Yeni Rol Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir rol tanımlayın ve modül bazlı izinler verin
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol Adı *</FormLabel>
                    <FormControl>
                      <Input placeholder="Muhasebeci" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Input placeholder="Muhasebe işlemlerini yönetir" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Modül İzinleri</h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {modules.map((module) => {
                    const modulePerms = permissions[module.id] || {}
                    const allSelected = module.permissions.every(perm => modulePerms[perm])
                    const someSelected = module.permissions.some(perm => modulePerms[perm])

                    return (
                      <div key={module.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{module.label}</h4>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={(checked) => handleSelectAll(module.id, checked as boolean)}
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate = someSelected && !allSelected
                                }
                              }}
                            />
                            <span className="text-sm text-muted-foreground">Tümünü Seç</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {module.permissions.map((permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${module.id}-${permission}`}
                                checked={modulePerms[permission] || false}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(module.id, permission, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${module.id}-${permission}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {permissionLabels[permission]}
                              </label>
                            </div>
                          ))}
                        </div>

                        {module.id === 'projects' && modulePerms.view && (
                          <div className="mt-3 pt-3 border-t">
                            <FormLabel className="text-sm">Proje Erişim Tipi</FormLabel>
                            <FormDescription className="text-xs mb-2">
                              Bu rol hangi projelere erişebilir?
                            </FormDescription>
                            <Select value={projectAccessType} onValueChange={(value: any) => setProjectAccessType(value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Tüm Projeler</SelectItem>
                                <SelectItem value="assigned">Sadece Atandığı Projeler</SelectItem>
                                <SelectItem value="department">Departman Projeleri</SelectItem>
                                <SelectItem value="facility">Tesis Projeleri</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rol Oluştur
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

