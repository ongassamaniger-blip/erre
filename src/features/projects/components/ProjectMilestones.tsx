import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, CalendarBlank, CheckCircle, Clock, WarningCircle, Trash } from '@phosphor-icons/react'
import { projectService } from '@/services/projects/projectService'
import { CreateMilestoneDialog } from './CreateMilestoneDialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Milestone } from '@/types'

interface ProjectMilestonesProps {
  projectId: string
}

const statusColors = {
  upcoming: 'bg-blue-500/10 text-blue-700 border-blue-200',
  'in-progress': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  completed: 'bg-green-500/10 text-green-700 border-green-200',
  delayed: 'bg-red-500/10 text-red-700 border-red-200',
}

const statusLabels = {
  upcoming: 'Yaklaşan',
  'in-progress': 'Devam Ediyor',
  completed: 'Tamamlandı',
  delayed: 'Gecikti',
}

const statusIcons = {
  upcoming: Clock,
  'in-progress': WarningCircle,
  completed: CheckCircle,
  delayed: WarningCircle,
}

export function ProjectMilestones({ projectId }: ProjectMilestonesProps) {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(null)

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => projectService.getMilestones(projectId),
  })

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones', projectId] })
      toast.success('Milestone silindi')
      setDeleteDialogOpen(false)
      setMilestoneToDelete(null)
    },
    onError: (error) => {
      toast.error('Silme işlemi başarısız: ' + error.message)
    }
  })

  const handleDeleteClick = (milestone: Milestone) => {
    setMilestoneToDelete(milestone)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (milestoneToDelete) {
      deleteMilestoneMutation.mutate(milestoneToDelete.id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kilometre Taşları</CardTitle>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus size={18} />
            Yeni Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
        ) : milestones.length > 0 ? (
          <div className="relative space-y-6">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {milestones.map((milestone, index) => {
              const Icon = statusIcons[milestone.status]

              return (
                <div key={milestone.id} className="relative pl-14">
                  <div className="absolute left-3 top-0 w-6 h-6 rounded-full bg-background border-2 flex items-center justify-center z-10">
                    <Icon size={14} weight="fill" className={statusColors[milestone.status].split(' ')[1]} />
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold">{milestone.name}</h4>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={statusColors[milestone.status]}>
                            {statusLabels[milestone.status]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDeleteClick(milestone)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <CalendarBlank size={16} />
                          <span>Hedef: {format(new Date(milestone.targetDate), 'dd MMM yyyy', { locale: tr })}</span>
                        </div>
                        {milestone.completedDate && (
                          <div className="flex items-center gap-1">
                            <CheckCircle size={16} />
                            <span>Tamamlandı: {format(new Date(milestone.completedDate), 'dd MMM yyyy', { locale: tr })}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Henüz milestone eklenmemiş
          </div>
        )}
      </CardContent>

      <CreateMilestoneDialog
        projectId={projectId}
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => setCreateDialogOpen(false)}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Milestone Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. <strong>{milestoneToDelete?.name}</strong> silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMilestoneMutation.isPending}
            >
              {deleteMilestoneMutation.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
