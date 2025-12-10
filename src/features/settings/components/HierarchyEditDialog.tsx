import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { branchUserManagementService } from '@/services/branchUserManagementService'
import type { BranchUser } from '@/types/branchUserManagement'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface HierarchyEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: BranchUser | null
  allUsers: BranchUser[]
  onSuccess: () => void
}

export function HierarchyEditDialog({
  open,
  onOpenChange,
  user,
  allUsers,
  onSuccess,
}: HierarchyEditDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [selectedManager, setSelectedManager] = useState<string>(
    user?.reportsTo || 'none'
  )

  const updateMutation = useMutation({
    mutationFn: ({ userId, managerId }: { userId: string; managerId?: string }) =>
      branchUserManagementService.updateUser(userId, {
        reportsTo: managerId === 'none' ? undefined : managerId,
      }),
    onSuccess: () => {
      toast.success('Hiyerarşi başarıyla güncellendi')
      queryClient.invalidateQueries({ queryKey: ['branch-users'] })
      queryClient.invalidateQueries({ queryKey: ['branch-hierarchy'] })
      onSuccess()
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Hiyerarşi güncellenirken bir hata oluştu')
    },
  })

  // Kullanıcının kendisi ve altındakileri hariç tut
  const getAvailableManagers = () => {
    if (!user) return []
    
    const excludeIds = new Set([user.id])
    
    // Alt hiyerarşideki tüm kullanıcıları bul
    const getSubordinates = (userId: string): string[] => {
      const subordinates: string[] = []
      allUsers.forEach(u => {
        if (u.reportsTo === userId) {
          subordinates.push(u.id)
          subordinates.push(...getSubordinates(u.id))
        }
      })
      return subordinates
    }
    
    const subordinates = getSubordinates(user.id)
    subordinates.forEach(id => excludeIds.add(id))
    
    return allUsers.filter(
      u => u.facilityId === selectedFacility?.id && !excludeIds.has(u.id)
    )
  }

  const availableManagers = getAvailableManagers()

  const handleSubmit = () => {
    if (!user) return
    
    updateMutation.mutate({
      userId: user.id,
      managerId: selectedManager === 'none' ? undefined : selectedManager,
    })
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hiyerarşi Düzenle</DialogTitle>
          <DialogDescription>
            {user.name} için üst yönetici atayın veya değiştirin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Kullanıcı</Label>
            <div className="p-3 rounded-lg bg-muted">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager">Üst Yönetici</Label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger id="manager">
                <SelectValue placeholder="Üst yönetici seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Yok (En Üst Seviye)</SelectItem>
                {availableManagers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name} ({manager.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableManagers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Uygun üst yönetici bulunamadı
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

