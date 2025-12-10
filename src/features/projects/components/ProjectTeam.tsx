import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, User, Trash, X } from '@phosphor-icons/react'
import { projectService } from '@/services/projects/projectService'
import { employeeService } from '@/services/hr/employeeService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

interface ProjectTeamProps {
  projectId: string
  compact?: boolean
}

export function ProjectTeam({ projectId, compact = false }: ProjectTeamProps) {
  const queryClient = useQueryClient()
  const { selectedFacility } = useAuthStore()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [role, setRole] = useState('')
  const [allocation, setAllocation] = useState('100')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['project-team', projectId],
    queryFn: () => projectService.getTeamMembers(projectId),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', selectedFacility?.id],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id && isAddDialogOpen,
  })

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      const employee = employees.find(e => e.id === selectedEmployeeId)
      if (!employee) throw new Error('Çalışan seçilmedi')

      return projectService.addTeamMember({
        projectId,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        role: role || employee.position,
        allocation: parseInt(allocation) || 100
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] })
      toast.success('Takım üyesi eklendi')
      setIsAddDialogOpen(false)
      setSelectedEmployeeId('')
      setRole('')
      setAllocation('100')
    },
    onError: (error) => {
      toast.error('Ekleme hatası: ' + error.message)
    }
  })

  const removeMemberMutation = useMutation({
    mutationFn: (id: string) => projectService.removeTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] })
      toast.success('Takım üyesi çıkarıldı')
    }
  })

  const TeamDialog = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Takım Üyesi Ekle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Çalışan</Label>
            {employees.length === 0 ? (
              <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/50">
                Bu tesiste eklenebilecek çalışan bulunamadı. Lütfen İK modülünden çalışan ekleyin.
              </div>
            ) : (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Çalışan Seç" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Proje Rolü</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Örn: Yazılımcı, Analist (Boş bırakılırsa pozisyon kullanılır)"
            />
          </div>
          <div className="space-y-2">
            <Label>Katılım Oranı (%)</Label>
            <Input
              type="number"
              value={allocation}
              onChange={(e) => setAllocation(e.target.value)}
              min="0"
              max="100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>İptal</Button>
          <Button onClick={() => addMemberMutation.mutate()} disabled={!selectedEmployeeId || addMemberMutation.isPending}>
            Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (compact) {
    return (
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Takım Üyeleri</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setIsAddDialogOpen(true)}>
                <Plus size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Yükleniyor...</div>
            ) : members.length > 0 ? (
              <div className="space-y-3">
                {members.slice(0, 4).map((member) => (
                  <div key={member.id} className="group flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {member.employeeName.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{member.employeeName}</div>
                        <div className="text-xs text-muted-foreground truncate">{member.role}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                {members.length > 4 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    +{members.length - 4} kişi daha
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Henüz üye eklenmemiş</div>
            )}
          </CardContent>
        </Card>
        {TeamDialog}
      </>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Takım Üyeleri</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus size={18} />
            Üye Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
        ) : members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-sm">Çalışan</th>
                  <th className="text-left p-3 font-medium text-sm">Rol</th>
                  <th className="text-left p-3 font-medium text-sm">Allocation</th>
                  <th className="text-left p-3 font-medium text-sm">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback>
                            {member.employeeName.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.employeeName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{member.role}</td>
                    <td className="p-3 text-sm">{member.allocation}%</td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                      >
                        <Trash size={16} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Henüz takım üyesi eklenmemiş
          </div>
        )}
        {TeamDialog}
      </CardContent>
    </Card>
  )
}
