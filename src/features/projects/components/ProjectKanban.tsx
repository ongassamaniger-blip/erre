import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User, CalendarBlank } from '@phosphor-icons/react'
import type { Project } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface ProjectKanbanProps {
  projects: Project[]
  onStatusChange: (id: string, status: Project['status']) => void
}

const columns: { id: Project['status']; label: string; color: string }[] = [
  { id: 'planning', label: 'Planlama', color: 'bg-blue-500' },
  { id: 'active', label: 'Aktif', color: 'bg-green-500' },
  { id: 'on-hold', label: 'Beklemede', color: 'bg-yellow-500' },
  { id: 'completed', label: 'Tamamlandı', color: 'bg-gray-500' },
]

export function ProjectKanban({ projects, onStatusChange }: ProjectKanbanProps) {
  const navigate = useNavigate()
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedId(projectId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: Project['status']) => {
    e.preventDefault()
    if (draggedId) {
      const project = projects.find((p) => p.id === draggedId)
      if (project && project.status !== status) {
        onStatusChange(draggedId, status)
        toast.success(`Proje durumu "${columns.find((c) => c.id === status)?.label}" olarak güncellendi`)
      }
      setDraggedId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnProjects = projects.filter((p) => p.status === column.id)
        
        return (
          <div key={column.id} className="flex flex-col min-h-[600px]">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {columnProjects.length}
              </Badge>
            </div>

            <div
              className="flex-1 bg-muted/30 rounded-lg p-2 border-2 border-dashed border-transparent transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              style={{
                borderColor: draggedId ? 'hsl(var(--primary))' : 'transparent',
              }}
            >
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {columnProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, project.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="cursor-move hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm">{project.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{project.code}</p>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">İlerleme</span>
                              <span className="font-medium">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-1.5" />
                          </div>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarBlank size={14} />
                            <span>{format(new Date(project.endDate), 'dd MMM', { locale: tr })}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <User size={14} weight="duotone" className="text-muted-foreground" />
                            <span className="text-xs">{project.managerName}</span>
                          </div>

                          <div className="pt-2 border-t text-xs">
                            <div className="text-muted-foreground">Bütçe</div>
                            <div className="font-medium">
                              {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )
      })}
    </div>
  )
}
