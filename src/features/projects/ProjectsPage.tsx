import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, SquaresFour, ListBullets, Kanban, FunnelSimple, CalendarBlank, User, Trash } from '@phosphor-icons/react'
import { projectService } from '@/services/projects/projectService'
import { CreateProjectDialog } from './components/CreateProjectDialog'
import { ProjectKanban } from './components/ProjectKanban'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Project } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { QuarantinedProjectsDialog } from './components/QuarantinedProjectsDialog'

const statusColors = {
  planning: 'bg-blue-500/10 text-blue-700 border-blue-200',
  active: 'bg-green-500/10 text-green-700 border-green-200',
  'on-hold': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-500/10 text-gray-700 border-gray-200',
}

const statusLabels = {
  planning: 'Planlama',
  active: 'Aktif',
  'on-hold': 'Beklemede',
  completed: 'Tamamlandı',
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'kanban'>('card')
  const [statusFilter, setStatusFilter] = useState<string>('all')


  // ... (inside component)
  const [quarantineDialogOpen, setQuarantineDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  // Realtime subscription for projects
  useRealtimeSubscription({
    table: 'projects',
    queryKey: ['projects'],
  })

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setCreateDialogOpen(true)
      // Clean up URL
      searchParams.delete('action')
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams])

  const selectedFacility = useAuthStore(state => state.selectedFacility)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', statusFilter, selectedFacility?.id],
    queryFn: async () => {
      const data = await projectService.getProjects(selectedFacility?.id)
      if (statusFilter !== 'all') {
        return data.filter(p => p.status === statusFilter)
      }
      return data
    },
    enabled: !!selectedFacility?.id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Project['status'] }) =>
      projectService.updateProject(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      toast.success('Proje karantinaya alındı')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      setDeleteConfirmation('')
    },
    onError: (error) => {
      toast.error('Silme işlemi başarısız: ' + error.message)
    }
  })

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
    setDeleteConfirmation('')
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation !== 'karantina') return
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const ProjectCard = ({ project }: { project: Project }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{project.code}</p>
            </div>
            <Badge variant="outline" className={statusColors[project.status]}>
              {statusLabels[project.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">İlerleme</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarBlank size={16} />
              <span>{format(new Date(project.startDate), 'dd MMM', { locale: tr })}</span>
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarBlank size={16} />
              <span>{format(new Date(project.endDate), 'dd MMM yyyy', { locale: tr })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User size={16} weight="duotone" className="text-muted-foreground" />
            <span className="text-sm font-medium">{project.managerName}</span>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bütçe Kullanımı</span>
              <span className="font-medium">
                {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
              </span>
            </div>
            <Progress value={(project.spent / project.budget) * 100} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                Takım: <span className="font-medium text-foreground">{project.teamSize}</span>
              </span>
              <span className="text-muted-foreground">
                Görevler: <span className="font-medium text-foreground">{project.completedTasks}/{project.taskCount}</span>
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              Detay
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/projects/${project.id}?tab=tasks`)}
            >
              Görevler
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteClick(project)
              }}
            >
              <Trash size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Projeler</h1>
            <p className="text-muted-foreground mt-1">
              Proje yönetimi ve takip sistemi
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setQuarantineDialogOpen(true)} className="gap-2">
              <Trash size={20} />
              Karantina
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={20} weight="bold" />
              Yeni Proje
            </Button>
          </div>
        </div>
      </div>

      <QuarantinedProjectsDialog
        open={quarantineDialogOpen}
        onOpenChange={setQuarantineDialogOpen}
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="w-auto">
          <TabsList>
            <TabsTrigger value="card" className="gap-2">
              <SquaresFour size={18} />
              Kart
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <ListBullets size={18} />
              Liste
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <Kanban size={18} />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 items-center">
          <FunnelSimple size={20} className="text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="planning">Planlama</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="on-hold">Beklemede</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium">Kod</th>
                        <th className="text-left p-4 font-medium">Proje Adı</th>
                        <th className="text-left p-4 font-medium">Durum</th>
                        <th className="text-left p-4 font-medium">Yönetici</th>
                        <th className="text-left p-4 font-medium">Başlangıç</th>
                        <th className="text-left p-4 font-medium">Bitiş</th>
                        <th className="text-left p-4 font-medium">İlerleme</th>
                        <th className="text-left p-4 font-medium">Bütçe</th>
                        <th className="text-left p-4 font-medium">Aksiyonlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr
                          key={project.id}
                          className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <td className="p-4 font-mono text-sm">{project.code}</td>
                          <td className="p-4 font-medium">{project.name}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={statusColors[project.status]}>
                              {statusLabels[project.status]}
                            </Badge>
                          </td>
                          <td className="p-4">{project.managerName}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {format(new Date(project.startDate), 'dd/MM/yyyy')}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {format(new Date(project.endDate), 'dd/MM/yyyy')}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress value={project.progress} className="h-2 w-20" />
                              <span className="text-sm">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/projects/${project.id}`)
                              }}
                            >
                              Detay
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(project)
                              }}
                            >
                              <Trash size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'kanban' && (
            <ProjectKanban
              projects={projects}
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
            />
          )}
        </>
      )}

      {!isLoading && projects.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <SquaresFour size={48} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz proje bulunmuyor</h3>
            <p className="text-muted-foreground mb-4">
              İlk projenizi oluşturarak başlayın
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus size={20} weight="bold" />
              Yeni Proje Oluştur
            </Button>
          </div>
        </Card>
      )}

      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['projects'] })
        }}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeyi Karantinaya Al</DialogTitle>
            <DialogDescription>
              <strong>{projectToDelete?.name}</strong> projesi karantinaya alınacaktır. Proje listelerden gizlenecek ancak veriler silinmeyecektir. İstediğiniz zaman "Karantina" sayfasından geri yükleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Onaylamak için "karantina" yazın</Label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="karantina"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmation !== 'karantina' || deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? 'İşleniyor...' : 'Karantinaya Al'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
