import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { projectService } from '@/services/projects/projectService'
import { employeeService } from '@/services/hr/employeeService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import type { Task } from '@/types'

interface CreateTaskDialogProps {
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}
export function CreateTaskDialog({ projectId, open, onClose, onSuccess }: CreateTaskDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', selectedFacility?.id, 'active'],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id, status: 'active' }),
    enabled: !!selectedFacility?.id,
  })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    assigneeName: '',
    startDate: '',
    dueDate: '',
    tags: '',
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      projectService.createTask({
        ...data,
        projectId,
        tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Görev başarıyla oluşturuldu')
      onSuccess()
      setFormData({
        name: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assigneeId: '',
        assigneeName: '',
        startDate: '',
        dueDate: '',
        tags: '',
      })
    },
    onError: () => {
      toast.error('Görev oluşturulurken bir hata oluştu')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Görev adı zorunludur')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yeni Görev Oluştur</DialogTitle>
          <DialogDescription>
            Projeye yeni bir görev ekleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">Görev Adı *</Label>
            <Input
              id="task-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Görev adını girin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Açıklama</Label>
            <Textarea
              id="task-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Görev açıklaması"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}
              >
                <SelectTrigger id="task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Yapılacak</SelectItem>
                  <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                  <SelectItem value="review">İnceleme</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="urgent">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-assignee">Atanan Kişi</Label>
            <Select
              value={formData.assigneeId}
              onValueChange={(value) => {
                const assignee = employees.find((a) => a.id === value)
                setFormData({
                  ...formData,
                  assigneeId: value,
                  assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : '',
                })
              }}
            >
              <SelectTrigger id="task-assignee">
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-start">Başlangıç Tarihi</Label>
              <Input
                id="task-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due">Bitiş Tarihi</Label>
              <Input
                id="task-due"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-tags">Etiketler</Label>
            <Input
              id="task-tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Etiketleri virgülle ayırın"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Görev Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
