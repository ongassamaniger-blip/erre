import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UserList,
  Plus,
  MagnifyingGlass,
  FunnelSimple,
  Building,
  User,
  Envelope,
  Phone,
  MapPin,
  IdentificationCard,
  Pencil,
  Trash,
  ArrowCounterClockwise,
  Archive
} from '@phosphor-icons/react'
import { vendorsCustomersService } from '@/services/finance/vendorsCustomersService'
import type { VendorCustomer } from '@/types/finance'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VendorCustomerDialog } from './components/VendorCustomerDialog'
import { useTranslation } from '@/hooks/useTranslation'

function VendorCustomerCard({
  vc,
  onEdit,
  onDelete
}: {
  vc: VendorCustomer
  onEdit: (vc: VendorCustomer) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {vc.type === 'vendor' ? (
                <Building size={24} weight="duotone" className="text-primary" />
              ) : (
                <User size={24} weight="duotone" className="text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{vc.name}</h3>
              <Badge variant={vc.type === 'vendor' ? 'default' : 'secondary'} className="mt-1">
                {vc.type === 'vendor' ? t('Tedarikçi') : t('Müşteri')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(vc)}
            >
              <Pencil size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(vc.id)}
            >
              <Trash size={18} className="text-destructive" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {vc.taxNumber && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IdentificationCard size={16} />
              <span>{vc.taxNumber}</span>
            </div>
          )}
          {vc.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Envelope size={16} />
              <span>{vc.email}</span>
            </div>
          )}
          {vc.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={16} />
              <span>{vc.phone}</span>
            </div>
          )}
          {vc.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={16} />
              <span>{vc.address}{vc.city && `, ${vc.city}`}</span>
            </div>
          )}
          {vc.contactPerson && (
            <div className="text-muted-foreground mt-2">
              <span className="font-medium">{t('İletişim')}:</span> {vc.contactPerson}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function VendorsCustomersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<'all' | 'vendor' | 'customer' | 'quarantine'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVC, setEditingVC] = useState<VendorCustomer | undefined>()

  const { data: vendorsCustomers, isLoading, refetch } = useQuery({
    queryKey: ['vendors-customers', typeFilter, searchQuery],
    queryFn: () => vendorsCustomersService.getVendorsCustomers({
      type: (typeFilter === 'all' || typeFilter === 'quarantine') ? undefined : typeFilter,
      search: searchQuery || undefined,
      isActive: typeFilter === 'quarantine' ? false : true,
      status: typeFilter === 'quarantine' ? 'archived' : 'approved'
    }),
  })

  const handleCreate = () => {
    setEditingVC(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (vc: VendorCustomer) => {
    setEditingVC(vc)
    setDialogOpen(true)
  }

  const selectedFacility = useAuthStore(state => state.selectedFacility)

  const handleSave = async (data: Partial<VendorCustomer>) => {
    if (editingVC) {
      await vendorsCustomersService.updateVendorCustomer(editingVC.id, data)
      toast.success(t('Kayıt güncellendi'))
    } else {
      if (!selectedFacility?.id) {
        toast.error(t('Tesis seçimi yapılamadı'))
        return
      }
      await vendorsCustomersService.createVendorCustomer({
        ...data,
        facility_id: selectedFacility.id
      })
      await queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
      // Toast is handled in dialog for creation
    }
    refetch()
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('Bu kaydı karantinaya almak istediğinize emin misiniz?'))) {
      try {
        await vendorsCustomersService.deleteVendorCustomer(id)
        toast.success(t('Karantinaya alındı'))
        await refetch()
      } catch (error: any) {
        console.error('Delete error:', error)
        toast.error(t('Karantinaya alınırken hata oluştu') + ': ' + (error.message || t('Bilinmeyen hata')))
      }
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await vendorsCustomersService.restoreVendorCustomer(id)
      toast.success(t('Kayıt geri yüklendi'))
      refetch()
    } catch (error) {
      toast.error(t('Geri yükleme başarısız'))
    }
  }

  const vendors = vendorsCustomers?.filter(vc => vc.type === 'vendor') || []
  const customers = vendorsCustomers?.filter(vc => vc.type === 'customer') || []

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{t('Tedarikçiler & Müşteriler')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('Tedarikçi ve müşteri bilgileri yönetimi')}
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus size={20} className="mr-2" />
            {t('Yeni Kayıt')}
          </Button>
        </div>
      </div>

      {vendorsCustomers && vendorsCustomers.length > 0 && typeFilter !== 'quarantine' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('Toplam Kayıt')}</p>
                  <p className="text-2xl font-bold">
                    {vendorsCustomers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('Tedarikçiler')}</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {vendors.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('Müşteriler')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {customers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder={t("Ad, e-posta, telefon veya vergi no ile ara...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelSimple size={20} className="text-muted-foreground" />
              <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">{t('Tümü')}</TabsTrigger>
                  <TabsTrigger value="vendor">{t('Tedarikçiler')}</TabsTrigger>
                  <TabsTrigger value="customer">{t('Müşteriler')}</TabsTrigger>
                  <TabsTrigger value="quarantine" className="text-orange-600 data-[state=active]:text-orange-700">
                    <Archive size={16} className="mr-2" />
                    {t('Karantina')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorsCustomers?.map(vc => (
                    <VendorCustomerCard
                      key={vc.id}
                      vc={vc}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {vendorsCustomers?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {t('Kayıt bulunamadı')}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="vendor" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map(vc => (
                    <VendorCustomerCard
                      key={vc.id}
                      vc={vc}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {vendors.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {t('Tedarikçi bulunamadı')}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="customer" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map(vc => (
                    <VendorCustomerCard
                      key={vc.id}
                      vc={vc}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {customers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {t('Müşteri bulunamadı')}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="quarantine" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorsCustomers?.map(vc => (
                    <Card key={vc.id} className="hover:shadow-md transition-shadow border-orange-200 bg-orange-50/30">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                              {vc.type === 'vendor' ? (
                                <Building size={24} weight="duotone" className="text-orange-600" />
                              ) : (
                                <User size={24} weight="duotone" className="text-orange-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">{vc.name}</h3>
                              <Badge variant="outline" className="mt-1 border-orange-200 text-orange-700">
                                {vc.type === 'vendor' ? t('Tedarikçi') : t('Müşteri')}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestore(vc.id)}
                            title={t("Geri Yükle")}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <ArrowCounterClockwise size={20} />
                          </Button>
                        </div>

                        <div className="space-y-2 text-sm opacity-75">
                          {vc.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Envelope size={16} />
                              <span>{vc.email}</span>
                            </div>
                          )}
                          {vc.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone size={16} />
                              <span>{vc.phone}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {vendorsCustomers?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {t('Karantinada kayıt bulunamadı')}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <VendorCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendorCustomer={editingVC}
        onSave={handleSave}
      />
    </div>
  )
}
