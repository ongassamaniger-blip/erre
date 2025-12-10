import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  PencilSimple,
  Archive,
  User,
  CalendarBlank,
  ArrowRight,
  CheckCircle,
  Clock,
  Warning
} from '@phosphor-icons/react'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { projectService } from '@/services/projects/projectService'
import { employeeService } from '@/services/employeeService'
import { ProjectTeam } from './components/ProjectTeam'
import { ProjectTasks } from './components/ProjectTasks'
import { ProjectMilestones } from './components/ProjectMilestones'
import { ProjectDocuments } from './components/ProjectDocuments'
import { ProjectActivities } from './components/ProjectActivities'
import { ProjectFinance } from './components/ProjectFinance'
import { CreateProjectDialog } from './components/CreateProjectDialog'
import { BudgetTransferDialog } from '@/features/finance/budget-transfers/components/BudgetTransferDialog'
import { LoadingScreen } from '@/components/common/LoadingScreen'

const statusColors = {
  planning: 'bg-blue-500/10 text-blue-700 border-blue-200',
  active: 'bg-green-500/10 text-green-700 border-green-200',
  'on-hold': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-500/10 text-gray-700 border-gray-200',
  cancelled: 'bg-red-500/10 text-red-700 border-red-200',
}

const statusLabels = {
  planning: 'Planlama',
  active: 'Aktif',
  'on-hold': 'Beklemede',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const activeTab = searchParams.get('tab') || 'overview'
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [budgetTransferOpen, setBudgetTransferOpen] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id!),
    enabled: !!id,
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  })

  const updateManagerMutation = useMutation({
    mutationFn: (managerId: string) => {
      const manager = employees.find(e => e.id === managerId)
      return projectService.updateProject(id!, {
        managerId,
        managerName: manager ? `${manager.firstName} ${manager.lastName}` : undefined
      })
    },
    onSuccess: () => {
      toast.success('Proje yöneticisi güncellendi')
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    },
    onError: () => {
      toast.error('Yönetici güncellenirken bir hata oluştu')
    }
  })

  const markAsCompleteMutation = useMutation({
    mutationFn: () => projectService.updateProject(id!, { status: 'completed' }),
    onSuccess: () => {
      toast.success('Proje tamamlandı olarak işaretlendi')
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => {
      toast.error('Proje güncellenirken bir hata oluştu')
    }
  })

  const handleExportPDF = async () => {
    const element = document.getElementById('project-detail-content')
    if (!element) return

    try {
      toast.info('PDF hazırlanıyor...')
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      })

      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${project?.name || 'proje'}-detay.pdf`)
      toast.success('PDF indirildi')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('PDF oluşturulurken bir hata oluştu')
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Proje Bulunamadı</h2>
        <p className="text-muted-foreground">
          Aradığınız proje mevcut değil veya erişim izniniz yok.
        </p>
        <Button onClick={() => navigate('/projects')}>
          Projelere Dön
        </Button>
      </div>
    )
  }

  return (
    <div id="project-detail-content" className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className={statusColors[project.status]}>
                {statusLabels[project.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{project.code}</p>
          </div>

          <div className="flex gap-2">
            {project.status !== 'completed' && (
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => markAsCompleteMutation.mutate()}
                disabled={markAsCompleteMutation.isPending}
                data-html2canvas-ignore
              >
                <CheckCircle size={18} className="mr-2" />
                {markAsCompleteMutation.isPending ? 'İşleniyor...' : 'Proje Bitti'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditDialogOpen(true)} data-html2canvas-ignore>
              <PencilSimple size={18} />
              Düzenle
            </Button>
            <Button variant="outline" onClick={handleExportPDF} data-html2canvas-ignore>
              <Archive size={18} />
              Arşivle (PDF)
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Proje İlerlemesi</span>
                <span className="text-lg font-semibold">
                  {project.taskCount > 0
                    ? Math.round((project.completedTasks / project.taskCount) * 100)
                    : 0}%
                </span>
              </div>
              <Progress
                value={project.taskCount > 0
                  ? Math.round((project.completedTasks / project.taskCount) * 100)
                  : 0}
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="tasks">Görevler</TabsTrigger>
          <TabsTrigger value="milestones">Kilometre Taşları</TabsTrigger>
          <TabsTrigger value="team">Takım</TabsTrigger>
          <TabsTrigger value="documents">Belgeler</TabsTrigger>
          <TabsTrigger value="finance">Finansal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Proje Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Proje Kodu</div>
                      <div className="font-medium">{project.code}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Durum</div>
                      <Badge variant="outline" className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Proje Yöneticisi</div>
                      <div className="flex items-center gap-2">
                        <User size={16} weight="duotone" />
                        <Select
                          value={project.managerId}
                          onValueChange={(value) => updateManagerMutation.mutate(value)}
                        >
                          <SelectTrigger className="h-8 border-none bg-transparent p-0 hover:bg-transparent focus:ring-0 w-auto min-w-[150px] font-medium">
                            <SelectValue placeholder="Yönetici Seç" />
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
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Takım Üyesi</div>
                      <div className="font-medium">{project.teamSize} kişi</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Başlangıç Tarihi</div>
                      <div className="flex items-center gap-2">
                        <CalendarBlank size={16} />
                        <span className="font-medium">
                          {format(new Date(project.startDate), 'dd MMMM yyyy', { locale: tr })}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Bitiş Tarihi</div>
                      <div className="flex items-center gap-2">
                        <CalendarBlank size={16} />
                        <span className="font-medium">
                          {format(new Date(project.endDate), 'dd MMMM yyyy', { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {project.description && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground mb-2">Açıklama</div>
                      <p className="text-sm">{project.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Toplam Görev</div>
                    <div className="text-2xl font-bold">{project.taskCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Tamamlanan</div>
                    <div className="text-2xl font-bold text-green-600">{project.completedTasks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Geciken</div>
                    <div className="text-2xl font-bold text-red-600">{project.overdueTasks}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm text-muted-foreground mb-1">Bütçe Kullanımı</div>
                    <div className="text-2xl font-bold">
                      {project.budget > 0
                        ? Math.round((project.spent / project.budget) * 100)
                        : 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <ProjectTeam projectId={project.id} compact />
              <ProjectActivities projectId={project.id} managerName={project.managerName} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <ProjectTasks projectId={project.id} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <ProjectMilestones projectId={project.id} />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <ProjectTeam projectId={project.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <ProjectDocuments projectId={project.id} />
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Proje Finansal Yönetimi</h3>
              <p className="text-sm text-muted-foreground">
                Proje bütçesi ve finansal işlemler
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setBudgetTransferOpen(true)}
            >
              <ArrowRight size={18} className="mr-2" />
              Bütçe Aktar
            </Button>
          </div>
          {project.status === 'completed' && (
            <div className="mb-4 p-4 rounded-lg bg-gray-100 border border-gray-200">
              <p className="text-sm text-gray-600">
                ⚠️ Bu proje tamamlandı. Yeni finansal işlem eklenemez.
              </p>
            </div>
          )}
          <ProjectFinance
            projectId={project.id}
            projectBudget={project.budget}
            projectSpent={project.spent}
            currency={project.currency}
            isCompleted={project.status === 'completed'}
          />
        </TabsContent>
      </Tabs>

      <BudgetTransferDialog
        open={budgetTransferOpen}
        onOpenChange={setBudgetTransferOpen}
        projectId={project.id}
        projectName={project.name}
        currentBudget={project.budget}
        currency={project.currency}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['project', id] })
          queryClient.invalidateQueries({ queryKey: ['budgets'] })
        }}
      />

      <CreateProjectDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={() => {
          setEditDialogOpen(false)
          queryClient.invalidateQueries({ queryKey: ['project', id] })
        }}
        project={project}
      />
    </div>
  )
}
