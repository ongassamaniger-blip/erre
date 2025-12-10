import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { facilityService } from '@/services/facilityService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Buildings, MapPin, ArrowRight, Plus, Trash, Warning, CurrencyDollar, Users, Cow, FolderOpen } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Facility, ModuleType } from '@/types'

export function TenantSelectPage() {
  const navigate = useNavigate()
  const { user, selectFacility, loadUserFacilities } = useAuthStore()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newFacility, setNewFacility] = useState({
    name: '',
    code: '',
    location: '',
    type: 'branch' as 'headquarters' | 'branch'
  })
  const [enabledModules, setEnabledModules] = useState<ModuleType[]>(['hr']) // Default HR selected

  const moduleOptions: { value: ModuleType; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'finance', label: 'Finans Modülü', icon: CurrencyDollar },
    { value: 'hr', label: 'İnsan Kaynakları Modülü', icon: Users },
    { value: 'qurban', label: 'Kurban Modülü', icon: Cow },
    { value: 'projects', label: 'Projeler Modülü', icon: FolderOpen },
  ]

  const handleModuleToggle = (module: ModuleType) => {
    const newModules = enabledModules.includes(module)
      ? enabledModules.filter(m => m !== module)
      : [...enabledModules, module]
    setEnabledModules(newModules)
  }

  // Delete Modal State
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadFacilities()
    }
  }, [user?.id])

  const loadFacilities = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // Reload user facilities from store/DB to ensure fresh data
      await loadUserFacilities()

      // Get full facility details
      const allFacilities = await facilityService.getFacilities()

      // Filter facilities user has access to
      const userFacilities = allFacilities.filter(f =>
        user.facilityAccess.includes(f.code) || user.role === 'Super Admin'
      )

      setFacilities(userFacilities)
    } catch (error) {
      console.error('Error loading facilities:', error)
      toast.error('Tesisler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (facility: Facility) => {
    try {
      selectFacility(facility)
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error selecting facility:', error)
      navigate('/login', { replace: true })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFacility.name || !newFacility.code || !newFacility.location) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    setIsCreating(true)
    try {
      await facilityService.createFacility({
        ...newFacility,
        enabledModules: enabledModules
      })

      toast.success('Tesis başarıyla oluşturuldu')
      setIsCreateOpen(false)
      setNewFacility({ name: '', code: '', location: '', type: 'branch' })
      setEnabledModules(['hr']) // Reset with HR as default
      loadFacilities() // Refresh list
    } catch (error: any) {
      console.error('Create facility error:', error)
      toast.error('Tesis oluşturulurken hata: ' + error.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== 'onaylıyorum') return
    if (!facilityToDelete) return

    setIsDeleting(true)
    try {
      await facilityService.deleteFacility(facilityToDelete.id)
      toast.success('Tesis ve tüm verileri silindi')
      setFacilityToDelete(null)
      setDeleteConfirmation('')
      loadFacilities() // Refresh list
    } catch (error: any) {
      console.error('Delete facility error:', error)
      toast.error('Silme işlemi başarısız: ' + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-12 mt-8 gap-4"
        >
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2">Tesis Seçimi</h1>
            <p className="text-muted-foreground text-lg">Yönetmek istediğiniz tesisi seçin</p>
          </div>

          {user.role === 'Super Admin' && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2 shadow-lg">
                  <Plus size={20} weight="bold" />
                  Yeni Tesis Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Tesis Oluştur</DialogTitle>
                  <DialogDescription>
                    Yeni bir şube veya merkez oluşturun.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tesis Adı</Label>
                    <Input
                      placeholder="Örn: Ankara Şubesi"
                      value={newFacility.name}
                      onChange={e => setNewFacility({ ...newFacility, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kod</Label>
                      <Input
                        placeholder="Örn: TR-06"
                        value={newFacility.code}
                        onChange={e => setNewFacility({ ...newFacility, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tip</Label>
                      <Select
                        value={newFacility.type}
                        onValueChange={(val: any) => setNewFacility({ ...newFacility, type: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="branch">Şube</SelectItem>
                          <SelectItem value="headquarters">Genel Merkez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Konum</Label>
                    <Input
                      placeholder="Örn: Ankara, Türkiye"
                      value={newFacility.location}
                      onChange={e => setNewFacility({ ...newFacility, location: e.target.value })}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Aktif Modüller</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Bu tesiste aktif olacak modülleri seçin.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {moduleOptions.map(option => {
                        const Icon = option.icon
                        const isEnabled = enabledModules.includes(option.value)

                        return (
                          <div
                            key={option.value}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg border transition-colors relative
                              ${isEnabled ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}
                            `}
                          >
                            <Checkbox
                              checked={isEnabled}
                              onCheckedChange={() => handleModuleToggle(option.value)}
                              id={`module-${option.value}`}
                            />
                            <Label
                              htmlFor={`module-${option.value}`}
                              className="flex items-center gap-2 cursor-pointer flex-1 absolute inset-0 pl-10"
                            >
                              <Icon size={20} className={isEnabled ? 'text-primary' : 'text-muted-foreground'} />
                              <span className={isEnabled ? 'font-medium' : ''}>{option.label}</span>
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {facilities.map((facility, index) => (
                <motion.div
                  key={facility.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Buildings size={24} weight="duotone" className="text-primary" />
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{facility.code}</Badge>
                          {user.role === 'Super Admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFacilityToDelete(facility)
                              }}
                            >
                              <Trash size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-xl">{facility.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-base">
                        <MapPin size={16} weight="fill" />
                        {facility.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rolünüz:</span>
                        <Badge variant="outline" className="font-medium">
                          {user.role}
                        </Badge>
                      </div>
                      <Button
                        className="w-full group"
                        onClick={() => handleSelect(facility)}
                      >
                        Seç
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!facilityToDelete} onOpenChange={(open) => !open && setFacilityToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <Warning size={24} />
                Tesisi Sil
              </DialogTitle>
              <DialogDescription>
                Bu işlem geri alınamaz! <strong>{facilityToDelete?.name}</strong> tesisini ve ona bağlı
                TÜM verileri (çalışanlar, işlemler, projeler vb.) kalıcı olarak silecektir.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Label>Onaylamak için aşağıya <strong>onaylıyorum</strong> yazın:</Label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="onaylıyorum"
                className="border-destructive/50 focus-visible:ring-destructive"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setFacilityToDelete(null)}>İptal</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirmation !== 'onaylıyorum' || isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : 'Tesisi ve Tüm Verileri Sil'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
