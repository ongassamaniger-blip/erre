import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { branchSettingsService } from '@/services/branchSettingsService'
import { toast } from 'sonner'
import {
  Building,
  Phone,
  CurrencyDollar,
  Globe,
  Bell,
} from '@phosphor-icons/react'
import { GeneralSettingsTab } from './components/GeneralSettingsTab'
import { ContactSettingsTab } from './components/ContactSettingsTab'
import { FinancialSettingsTab } from './components/FinancialSettingsTab'
import { RegionalSettingsTab } from './components/RegionalSettingsTab'
import { NotificationSettingsTab } from './components/NotificationSettingsTab'
import { useTranslation } from '@/hooks/useTranslation'


export function BranchSettingsPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const { t } = useTranslation()

  // Sadece şubeler erişebilir
  if (selectedFacility?.type === 'headquarters') {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('Bu sayfa sadece şubeler için kullanılabilir.')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: ['branch-settings', selectedFacility?.id],
    queryFn: () => branchSettingsService.getSettings(selectedFacility?.id || ''),
    enabled: !!selectedFacility?.id && selectedFacility?.type === 'branch',
  })

  const updateMutation = useMutation({
    mutationFn: (updates: any) =>
      branchSettingsService.updateSettings(selectedFacility?.id || '', updates),
    onSuccess: () => {
      toast.success(t('Ayarlar başarıyla güncellendi'))
      queryClient.invalidateQueries({ queryKey: ['branch-settings'] })
    },
    onError: () => {
      toast.error(t('Ayarlar güncellenirken bir hata oluştu'))
    },
  })

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {t('Ayarlar yüklenemedi.')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t('Şube Ayarları')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('Şube bilgileri ve sistem ayarlarını yönetin')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Ayarlar')}</CardTitle>
          <CardDescription>
            {t('Şube ile ilgili tüm ayarları buradan yönetebilirsiniz')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex-wrap h-auto p-1 gap-1">
              <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
                <Building size={14} />
                <span className="hidden sm:inline">{t('Genel')}</span>
                <span className="sm:hidden">{t('Genel')}</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5 text-xs sm:text-sm">
                <Phone size={14} />
                <span className="hidden sm:inline">{t('İletişim')}</span>
                <span className="sm:hidden">{t('İletişim')}</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-1.5 text-xs sm:text-sm">
                <CurrencyDollar size={14} />
                <span className="hidden sm:inline">{t('Finansal')}</span>
                <span className="sm:hidden">{t('Finansal')}</span>
              </TabsTrigger>
              <TabsTrigger value="regional" className="gap-1.5 text-xs sm:text-sm">
                <Globe size={14} />
                <span className="hidden sm:inline">{t('Bölgesel')}</span>
                <span className="sm:hidden">{t('Bölgesel')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm">
                <Bell size={14} />
                <span className="hidden sm:inline">{t('Bildirimler')}</span>
                <span className="sm:hidden">{t('Bildirimler')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <GeneralSettingsTab
                settings={settings}
                onUpdate={(data) => updateMutation.mutate({ general: data })}
              />
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <ContactSettingsTab
                settings={settings}
                onUpdate={(data) => updateMutation.mutate({ contact: data })}
              />
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <FinancialSettingsTab
                settings={settings}
                onUpdate={(data) => updateMutation.mutate({ financial: data })}
              />
            </TabsContent>

            <TabsContent value="regional" className="mt-6">
              <RegionalSettingsTab
                settings={settings}
                onUpdate={(data) => updateMutation.mutate({ regional: data })}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <NotificationSettingsTab
                settings={settings}
                onUpdate={(data) => updateMutation.mutate({ notifications: data })}
              />
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

