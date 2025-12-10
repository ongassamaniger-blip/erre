import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { projectService } from '@/services/projects/projectService'
import { toast } from 'sonner'
import type { Milestone } from '@/types'

interface CreateMilestoneDialogProps {
    projectId: string
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CreateMilestoneDialog({ projectId, open, onClose, onSuccess }: CreateMilestoneDialogProps) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        targetDate: '',
        status: 'upcoming' as Milestone['status'],
    })

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) =>
            projectService.createMilestone({
                ...data,
                projectId,
            }),
        onSuccess: () => {
            toast.success('Milestone başarıyla oluşturuldu')
            queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] })
            onSuccess()
            setFormData({
                name: '',
                description: '',
                targetDate: '',
                status: 'upcoming',
            })
        },
        onError: (error) => {
            toast.error('Milestone oluşturulurken bir hata oluştu: ' + error.message)
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            toast.error('Milestone adı zorunludur')
            return
        }
        if (!formData.targetDate) {
            toast.error('Hedef tarih zorunludur')
            return
        }
        createMutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Yeni Milestone Oluştur</DialogTitle>
                    <DialogDescription>
                        Projeye yeni bir kilometre taşı ekleyin
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Milestone Adı *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Örn: Temel atma töreni"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Milestone detayları"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetDate">Hedef Tarih *</Label>
                        <Input
                            id="targetDate"
                            type="date"
                            value={formData.targetDate}
                            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Durum</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => setFormData({ ...formData, status: value as Milestone['status'] })}
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="upcoming">Yaklaşan</SelectItem>
                                <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                                <SelectItem value="completed">Tamamlandı</SelectItem>
                                <SelectItem value="delayed">Gecikti</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
