import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { CampaignsTab } from './components/CampaignsTab'
import { DonationsTab } from './components/DonationsTab'
import { ScheduleTab } from './components/ScheduleTab'
import { DistributionTab } from './components/DistributionTab'
import { useQuery } from '@tanstack/react-query'
import { campaignService, donationService } from '@/services/qurban/qurbanService'
import { useAuthStore } from '@/store/authStore'
import { CurrencyDollar, Users, CalendarBlank, Package } from '@phosphor-icons/react'

export function QurbanPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)

  const { data: campaigns = [] } = useQuery({
    queryKey: ['qurban-campaigns-stats', selectedFacility?.id],
    queryFn: () => campaignService.getCampaigns({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const { data: donations = [] } = useQuery({
    queryKey: ['qurban-donations-stats', selectedFacility?.id],
    queryFn: () => donationService.getDonations({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalDonations = donations.filter(d => d.paymentStatus === 'paid').length
  const totalCollected = donations.reduce((sum, d) => sum + (d.paymentStatus === 'paid' ? d.amount : 0), 0)
  const pendingDonations = donations.filter(d => d.paymentStatus === 'pending').length

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    totalDonations,
    totalCollected,
    pendingDonations,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Kurban Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Kurban kampanyaları, bağışlar ve dağıtım yönetimi
          </p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Kampanya</p>
                <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeCampaigns} aktif
                </p>
              </div>
              <CalendarBlank size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Bağış</p>
                <p className="text-2xl font-bold">{stats.totalDonations}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingDonations} bekleyen
                </p>
              </div>
              <Users size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplanan Tutar</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalCollected)}
                </p>
              </div>
              <CurrencyDollar size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aktif Kampanyalar</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeCampaigns}</p>
              </div>
              <Package size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Kampanyalar</TabsTrigger>
          <TabsTrigger value="donations">Bağışlar</TabsTrigger>
          <TabsTrigger value="schedule">Kesim Programı</TabsTrigger>
          <TabsTrigger value="distribution">Et Dağıtımı</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>

        <TabsContent value="donations">
          <DonationsTab />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTab />
        </TabsContent>

        <TabsContent value="distribution">
          <DistributionTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
