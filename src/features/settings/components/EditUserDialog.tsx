import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  role: z.enum(['Super Admin', 'Admin', 'Manager', 'User']),
  status: z.enum(['active', 'inactive', 'suspended']),
  facilityIds: z.array(z.string()).min(1, 'En az bir tesis seçmelisiniz'),
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
  const [isLoading, setIsLoading] = useState(false)

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
      form.reset({
        name: user.name,
        role: user.role,
        status: user.status,
        facilityIds: user.facilities.map(f => f.id),
      })
      setSelectedFacilities(user.facilities.map(f => f.id))
    }
  }, [user, form])

  const onSubmit = async (data: EditUserFormData) => {
    try {
      setIsLoading(true)

      const updateData: UpdateUserData = {
        name: data.name,
        role: data.role,
        status: data.status,
        facilityIds: data.facilityIds,
      }

      await userManagementService.updateUser(user.id, updateData)
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
      return newFacilities
    })
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Rol seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
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
            </div>

            <FormField
              control={form.control}
              name="facilityIds"
              render={() => (
                <FormItem>
                  <FormLabel>Tesis Erişimleri *</FormLabel>
                  <FormControl>
                    <ScrollArea className="h-48 border rounded-md p-4">
                      <div className="space-y-2">
                        {facilities.map((facility) => (
                          <div key={facility.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`facility-${facility.id}`}
                              checked={selectedFacilities.includes(facility.id)}
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
                        ))}
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

