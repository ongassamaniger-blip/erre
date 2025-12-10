import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { projectService } from '@/services/projects/projectService'
import { employeeService } from '@/services/hr/employeeService'
import { definitionService } from '@/services/definitionService'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Plus, X } from '@phosphor-icons/react'
import type { Project } from '@/types'

interface CreateProjectDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  project?: Project // Optional project for editing
}

export function CreateProjectDialog({ open, onClose, onSuccess, project }: CreateProjectDialogProps) {
  const navigate = useNavigate()
  const { selectedFacility } = useAuthStore()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    managerId: '',
    managerName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: '',
    currency: 'TRY',
    type: '',
    category: '',
  })

  // Quick Add States
  const [isAddingType, setIsAddingType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Populate form if editing
  useEffect(() => {
    if (project) {
      const safeDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return ''
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) return ''
          return date.toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'planning',
        managerId: project.managerId || '',
        managerName: project.managerName || '',
        startDate: safeDate(project.startDate),
        endDate: safeDate(project.endDate),
        budget: (project.budget || 0).toString(),
        currency: project.currency || 'TRY',
        type: project.type || '',
        category: project.category || '',
      })
    } else {
      // Reset form for new project
      setFormData({
        name: '',
        description: '',
        status: 'planning',
        managerId: '',
        managerName: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: '',
        currency: 'TRY',
        type: '',
        category: '',
      })
    }
  }, [project, open])

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', selectedFacility?.id],
    queryFn: () => employeeService.getEmployees({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  // Fetch Definitions
  const { data: projectTypes = [] } = useQuery({
    queryKey: ['project-types', selectedFacility?.id],
    queryFn: () => definitionService.getProjectTypes(selectedFacility?.id),
    enabled: !!selectedFacility?.id,
  })

  const { data: projectCategories = [] } = useQuery({
    queryKey: ['project-categories', selectedFacility?.id],
    queryFn: () => definitionService.getProjectCategories(selectedFacility?.id),
    enabled: !!selectedFacility?.id,
  })

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!selectedFacility?.id) {
        throw new Error('Tesis seçili değil')
      }

      const payload = {
        ...data,
        budget: parseFloat(data.budget) || 0,
        facilityId: selectedFacility.id,
      }

      if (project) {
        return projectService.updateProject(project.id, payload)
      } else {
        return projectService.createProject(payload)
      }
    },
    onSuccess: () => {
      toast.success(project ? 'Proje güncellendi' : 'Proje başarıyla oluşturuldu')
      onSuccess()
      if (!project) {
        setFormData({
          name: '',
          description: '',
          status: 'planning',
          managerId: '',
          managerName: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          budget: '',
          currency: 'TRY',
          type: '',
          category: '',
        })
      }
    },
    onError: (error) => {
      toast.error('İşlem başarısız: ' + error.message)
    },
  })

  const handleAddType = async () => {
    if (!newTypeName.trim() || !selectedFacility?.id) return
    try {
      const newType = await definitionService.createProjectType({
        name: newTypeName,
        facility_id: selectedFacility.id
      })
      queryClient.invalidateQueries({ queryKey: ['project-types'] })
      setFormData(prev => ({ ...prev, type: newType.name }))
      setIsAddingType(false)
      setNewTypeName('')
      toast.success('Proje tipi eklendi')
    } catch (error) {
      toast.error('Ekleme başarısız')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedFacility?.id) return
    try {
      const newCat = await definitionService.createProjectCategory({
        name: newCategoryName,
        facility_id: selectedFacility.id
      })
      queryClient.invalidateQueries({ queryKey: ['project-categories'] })
      setFormData(prev => ({ ...prev, category: newCat.name }))
      setIsAddingCategory(false)
      setNewCategoryName('')
      toast.success('Kategori eklendi')
    } catch (error) {
      toast.error('Ekleme başarısız')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Proje adı zorunludur')
      return
    }
    if (!selectedFacility?.id) {
      toast.error('Lütfen önce bir tesis seçin')
      return
    }
    mutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}</DialogTitle>
          <DialogDescription>
            {project ? 'Proje bilgilerini güncelleyin' : 'Yeni bir proje oluşturmak için aşağıdaki formu doldurun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Proje Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Proje adını girin"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Proje açıklaması"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Project['status'] })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planlama</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="on-hold">Beklemede</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Proje Yöneticisi</Label>
              {employees.length === 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/50">
                    Bu tesiste çalışan bulunamadı
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose()
                      navigate('/hr/employees')
                    }}
                  >
                    Çalışan Ekle
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.managerId}
                  onValueChange={(value) => {
                    const manager = employees.find((m) => m.id === value)
                    setFormData({
                      ...formData,
                      managerId: value,
                      managerName: manager ? `${manager.firstName} ${manager.lastName}` : '',
                    })
                  }}
                >
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Yönetici Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Bütçe</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 border-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Bütçe Finans modülünden aktarılacak</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Proje oluşturduktan sonra Finans → Bütçeler kısmından bu projeye bütçe tanımlayabilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Proje Tipi</Label>
              {isAddingType ? (
                <div className="flex gap-2">
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Yeni tip adı"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddType()
                      }
                    }}
                  />
                  <Button type="button" size="icon" onClick={handleAddType}>
                    <Plus weight="bold" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setIsAddingType(false)}>
                    <X weight="bold" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setIsAddingType(true)
                    } else {
                      setFormData({ ...formData, type: value })
                    }
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" className="text-primary font-medium">
                      + Yeni Tip Ekle
                    </SelectItem>
                    {projectTypes.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              {isAddingCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Yeni kategori adı"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCategory()
                      }
                    }}
                  />
                  <Button type="button" size="icon" onClick={handleAddCategory}>
                    <Plus weight="bold" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setIsAddingCategory(false)}>
                    <X weight="bold" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    if (value === 'new') {
                      setIsAddingCategory(true)
                    } else {
                      setFormData({ ...formData, category: value })
                    }
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" className="text-primary font-medium">
                      + Yeni Kategori Ekle
                    </SelectItem>
                    {projectCategories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Kaydediliyor...' : (project ? 'Güncelle' : 'Proje Oluştur')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
