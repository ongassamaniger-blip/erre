import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery } from '@tanstack/react-query'
import { roleManagementService } from '@/services/roleManagementService'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { userManagementService, type SystemUser, type SystemRole, type UpdateUserData } from '@/services/userManagementService'
import type { Facility } from '@/types'
import { toast } from 'sonner'
import { Building } from '@phosphor-icons/react'

const editUserSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  status: z.enum(['active', 'inactive', 'suspended']),
  facilityIds: z.array(z.string()).min(1, 'En az bir tesis seçmelisiniz'),
  facilityRoles: z.record(z.string(), z.string()).optional(), // facilityId -> roleId mapping
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: SystemUser
  facilities: Facility[]
  onSuccess: () => void
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  facilities,
  onSuccess,
}: EditUserDialogProps) {
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [facilityRoles, setFacilityRoles] = useState<Record<string, string>>({}) // facilityId -> roleId
  const [isLoading, setIsLoading] = useState(false)

  // Rolleri getir
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleManagementService.getRoles(),
  })

  // Kullanıcının mevcut tesis bazlı rollerini getir
  const { data: userFacilityRoles = [] } = useQuery({
    queryKey: ['user-facility-roles', user.id],
    queryFn: () => roleManagementService.getUserFacilityRoles(user.id),
    enabled: open && !!user.id,
  })

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      role: user.role,
      status: user.status,
      facilityIds: user.facilities.map(f => f.id),
    },
  })

  useEffect(() => {
    if (user) {
      const facilityIds = user.facilities.map(f => f.id)
      form.reset({
        name: user.name,
        status: user.status,
        facilityIds,
        facilityRoles: {},
      })
      setSelectedFacilities(facilityIds)
    }
  }, [user, form])

  // Kullanıcının mevcut tesis bazlı rollerini yükle
  useEffect(() => {
    if (userFacilityRoles.length > 0) {
      const rolesMap: Record<string, string> = {}
      userFacilityRoles.forEach(ufr => {
        rolesMap[ufr.facilityId] = ufr.roleId
      })
      setFacilityRoles(rolesMap)
    }
  }, [userFacilityRoles])

  const onSubmit = async (data: EditUserFormData) => {
    try {
      setIsLoading(true)

      // Sistem rolünü tesis bazlı rollerden belirle
      let systemRole = user.role // Mevcut rolü koru
      if (data.facilityIds.length > 0 && facilityRoles[data.facilityIds[0]]) {
        const firstRoleId = facilityRoles[data.facilityIds[0]]
        const selectedRole = roles.find(r => r.id === firstRoleId)
        
        // Eğer sistem rolü seçildiyse onu kullan
        if (selectedRole) {
          const systemRoleNames = ['Super Admin', 'Admin', 'Manager', 'User']
          if (systemRoleNames.includes(selectedRole.name)) {
            systemRole = selectedRole.name as any
          }
        }
      }

      const updateData: UpdateUserData = {
        name: data.name,
        role: systemRole,
        status: data.status,
        facilityIds: data.facilityIds,
      }

      await userManagementService.updateUser(user.id, updateData)

      // Tesis bazlı roller güncelle
      // Önce mevcut rollerini kaldır
      const currentRoles = await roleManagementService.getUserFacilityRoles(user.id)
      for (const ufr of currentRoles) {
        try {
          await roleManagementService.removeRoleFromUser(user.id, ufr.facilityId, ufr.roleId)
        } catch (error) {
          // Hata olsa bile devam et
        }
      }

      // Yeni roller atanıyor (rol seçilmemişse varsayılan rol kullan)
      for (const facilityId of data.facilityIds) {
        let roleId = facilityRoles[facilityId]
        
        // Eğer rol seçilmemişse, sistem rolü bul (User rolü)
        if (!roleId) {
          const defaultRole = roles.find(r => r.name === 'User')
          if (defaultRole) {
            roleId = defaultRole.id
          } else {
            // User rolü yoksa ilk rolü kullan
            roleId = roles[0]?.id
          }
        }
        
        if (roleId) {
          try {
            await roleManagementService.assignRoleToUser(user.id, facilityId, roleId)
          } catch (error: any) {
            console.error(`Rol atama hatası (${facilityId}):`, error)
            toast.error(`${facilityId} tesisine rol atanırken hata oluştu`)
          }
        }
      }

      toast.success('Kullanıcı başarıyla güncellendi')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Kullanıcı güncellenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities(prev => {
      const newFacilities = prev.includes(facilityId)
        ? prev.filter(id => id !== facilityId)
        : [...prev, facilityId]
      form.setValue('facilityIds', newFacilities)
      
      // Tesis seçimi kaldırıldıysa rolünü de kaldır
      if (!newFacilities.includes(facilityId)) {
        setFacilityRoles(prev => {
          const newRoles = { ...prev }
          delete newRoles[facilityId]
          return newRoles
        })
      }
      
      return newFacilities
    })
  }

  const handleRoleChange = (facilityId: string, roleId: string) => {
    setFacilityRoles(prev => ({
      ...prev,
      [facilityId]: roleId,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          <DialogDescription>
            {user.name} kullanıcısının bilgilerini düzenleyin
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İsim Soyisim *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ahmet Yılmaz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Pasif</SelectItem>
                      <SelectItem value="suspended">Askıda</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facilityIds"
              render={() => (
                <FormItem>
                  <FormLabel>Tesis Erişimleri ve Rolleri *</FormLabel>
                  <FormControl>
                    <ScrollArea className="h-64 border rounded-md p-4">
                      <div className="space-y-4">
                        {facilities.map((facility) => {
                          const isSelected = selectedFacilities.includes(facility.id)
                          const selectedRoleId = facilityRoles[facility.id]
                          
                          return (
                            <div key={facility.id} className="space-y-2 border-b pb-3 last:border-0">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`facility-${facility.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => toggleFacility(facility.id)}
                                />
                                <Label
                                  htmlFor={`facility-${facility.id}`}
                                  className="flex items-center gap-2 cursor-pointer flex-1"
                                >
                                  <Building size={16} />
                                  <span className="font-medium">{facility.name}</span>
                                  <span className="text-muted-foreground">({facility.code})</span>
                                </Label>
                              </div>
                              
                              {isSelected && (
                                <div className="ml-6">
                                  <Label className="text-sm text-muted-foreground mb-1 block">
                                    Bu tesiste rol:
                                  </Label>
                                  <Select
                                    value={selectedRoleId || ''}
                                    onValueChange={(value) => handleRoleChange(facility.id, value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Rol seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                          {role.name}
                                          {role.isSystemRole && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                              (Sistem)
                                            </span>
                                          )}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

