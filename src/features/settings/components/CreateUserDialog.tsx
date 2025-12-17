import { useState } from 'react'
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
import { userManagementService, type SystemRole, type CreateUserData } from '@/services/userManagementService'
import type { Facility } from '@/types'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Building } from '@phosphor-icons/react'

const createUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  role: z.enum(['Super Admin', 'Admin', 'Manager', 'User']),
  facilityIds: z.array(z.string()).min(1, 'En az bir tesis seçmelisiniz'),
  sendInviteEmail: z.boolean().optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facilities: Facility[]
  onSuccess: () => void
}

export function CreateUserDialog({
  open,
  onOpenChange,
  facilities,
  onSuccess,
}: CreateUserDialogProps) {
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: 'User' as const,
      facilityIds: [],
      sendInviteEmail: false,
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsLoading(true)

      // Edge Function çağrısı
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        throw new Error('Oturum bulunamadı')
      }

      // Edge Function'ı çağır
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
          facilityIds: data.facilityIds,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      })

      if (functionError) {
        // Edge Function yoksa, alternatif yöntem dene
        // Şimdilik kullanıcıya bilgi ver
        throw new Error('Kullanıcı oluşturma için Edge Function gerekli. Lütfen Supabase Dashboard\'dan kullanıcı oluşturun veya Edge Function ekleyin.')
      }

      if (functionData?.success) {
        toast.success('Kullanıcı başarıyla oluşturuldu')
        form.reset()
        setSelectedFacilities([])
        onSuccess()
      } else {
        throw new Error(functionData?.error || 'Kullanıcı oluşturulamadı')
      }
    } catch (error: any) {
      toast.error(error.message || 'Kullanıcı oluşturulurken hata oluştu')
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
          <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
          <DialogDescription>
            Sisteme yeni bir kullanıcı ekleyin. Kullanıcıya e-posta ile davet gönderilebilir.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ahmet@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="En az 8 karakter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="sendInviteEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Davet e-postası gönder
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Kullanıcıya e-posta ile davet gönderilsin
                    </p>
                  </div>
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
                {isLoading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

