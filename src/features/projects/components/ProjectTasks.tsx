import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, User, CalendarBlank, Kanban, ListBullets, Trash } from '@phosphor-icons/react'
import { projectService } from '@/services/projects/projectService'
import { CreateTaskDialog } from './CreateTaskDialog'
import type { Task } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ProjectTasksProps {
  projectId: string
}

const priorityColors = {
  low: 'bg-gray-500/10 text-gray-700 border-gray-200',
  medium: 'bg-blue-500/10 text-blue-700 border-blue-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  urgent: 'bg-red-500/10 text-red-700 border-red-200',
}

const priorityLabels = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
}

const statusColumns: { id: Task['status']; label: string; color: string }[] = [
  { id: 'todo', label: 'Yapılacak', color: 'bg-gray-500' },
  { id: 'in-progress', label: 'Devam Ediyor', color: 'bg-blue-500' },
  { id: 'review', label: 'İnceleme', color: 'bg-yellow-500' },
  { id: 'completed', label: 'Tamamlandı', color: 'bg-green-500' },
]

export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => projectService.getTasks(projectId),
  })

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      projectService.updateTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] })
      toast.success('Görev durumu güncellendi')
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] })
      toast.success('Görev silindi')
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    },
    onError: (error) => {
      toast.error('Silme işlemi başarısız: ' + error.message)
    }
  })

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id)
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    if (draggedId) {
      updateTaskMutation.mutate({ id: draggedId, status })
      setDraggedId(null)
    }
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card className="cursor-move hover:shadow-md transition-shadow group relative">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-medium text-sm mb-1">{task.name}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 -mr-2 -mt-2"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteClick(task)
              }}
            >
              <Trash size={14} />
            </Button>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}


          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {priorityLabels[task.priority]}
            </Badge>
            {task.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {task.assigneeName && (
            <div className="flex items-center gap-2 text-xs">
              <User size={14} weight="duotone" />
              <span>{task.assigneeName}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarBlank size={14} />
              <span>{format(new Date(task.dueDate), 'dd MMM yyyy', { locale: tr })}</span>
            </div>
          )}

          {task.progress > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">İlerleme</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div >
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Görevler</CardTitle>
            <div className="flex gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                <TabsList>
                  <TabsTrigger value="kanban" className="gap-2">
                    <Kanban size={16} />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <ListBullets size={16} />
                    Liste
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus size={18} />
                Yeni Görev
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusColumns.map((column) => {
                const columnTasks = tasks.filter((t) => t.status === column.id)

                return (
                  <div key={column.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <h3 className="font-semibold text-sm">{column.label}</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {columnTasks.length}
                      </Badge>
                    </div>

                    <div
                      className="flex-1 bg-muted/30 rounded-lg p-3 min-h-[400px] border-2 border-dashed border-transparent transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                      style={{
                        borderColor: draggedId ? 'hsl(var(--primary))' : 'transparent',
                      }}
                    >
                      <div className="space-y-3">
                        {columnTasks.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                          >
                            <TaskCard task={task} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Görev Adı</th>
                    <th className="text-left p-3 font-medium text-sm">Durum</th>
                    <th className="text-left p-3 font-medium text-sm">Öncelik</th>
                    <th className="text-left p-3 font-medium text-sm">Atanan</th>
                    <th className="text-left p-3 font-medium text-sm">Bitiş Tarihi</th>
                    <th className="text-left p-3 font-medium text-sm">İlerleme</th>
                    <th className="text-left p-3 font-medium text-sm w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-sm">{task.name}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">
                          {statusColumns.find((c) => c.id === task.status)?.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {priorityLabels[task.priority]}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{task.assigneeName || '-'}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {task.dueDate ? format(new Date(task.dueDate), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="h-2 w-20" />
                          <span className="text-xs">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDeleteClick(task)}
                        >
                          <Trash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Henüz görev eklenmemiş
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog
        projectId={projectId}
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] })
        }}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görevi Sil</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. <strong>{taskToDelete?.name}</strong> görevi kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
