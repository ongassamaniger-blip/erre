import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Cow,
  Buildings,
  MagnifyingGlass,
  FileArrowDown,
  CurrencyDollar,
  Users,
  CalendarBlank,
  CheckCircle,
} from '@phosphor-icons/react'
import { facilityService } from '@/services/facilityService'
import { campaignService, donationService, distributionService } from '@/services/qurban/qurbanService'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import * as XLSX from 'xlsx'

export function HeadquartersQurbanPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<'campaigns' | 'donations' | 'distributions' | 'summary'>('campaigns')

  if (selectedFacility?.type !== 'headquarters') {
    return null
  }

  const { data: branches = [] } = useQuery({
    queryKey: ['facilities', 'branches'],
    queryFn: () => facilityService.getBranches(),
  })

  const { data: allCampaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['headquarters', 'campaigns', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(branch =>
            campaignService.getCampaigns({ facilityId: branch.id }).catch(() => [])
          )
        )
        return results.flat().map((camp, index) => ({
          ...camp,
          branchId: branches[Math.floor(index / (results[0]?.length || 1))]?.id,
          branchName: branches[Math.floor(index / (results[0]?.length || 1))]?.name,
        }))
      } else {
        const campaigns = await campaignService.getCampaigns({ facilityId: selectedBranchId })
        const branch = branches.find(b => b.id === selectedBranchId)
        return campaigns.map(camp => ({
          ...camp,
          branchId: selectedBranchId,
          branchName: branch?.name,
        }))
      }
    },
    enabled: branches.length > 0,
  })

  const { data: allDonations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ['headquarters', 'donations', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(branch =>
            donationService.getDonations({ facilityId: branch.id }).catch(() => [])
          )
        )
        return results.flat()
      } else {
        return donationService.getDonations({ facilityId: selectedBranchId })
      }
    },
    enabled: branches.length > 0,
  })

  const { data: allDistributions = [], isLoading: distributionsLoading } = useQuery({
    queryKey: ['headquarters', 'distributions', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(branch =>
            distributionService.getDistributions({ facilityId: branch.id }).catch(() => [])
          )
        )
        return results.flat()
      } else {
        return distributionService.getDistributions({ facilityId: selectedBranchId })
      }
    },
    enabled: branches.length > 0,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredCampaigns = allCampaigns.filter(camp => {
    const matchesSearch =
      camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camp as any).branchName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // İstatistikler
  const totalCampaigns = allCampaigns.length
  const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length
  const totalDonations = allDonations.reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalDistributions = allDistributions.reduce((sum, d) => sum + (d.quantity || 0), 0)

  // Şube bazlı istatistikler
  const branchStats = branches.map(branch => {
    const branchCampaigns = allCampaigns.filter(c => (c as any).branchId === branch.id)
    const branchDonations = allDonations.filter(d => d.facilityId === branch.id)
    const branchDistributions = allDistributions.filter(d => d.facilityId === branch.id)
    
    return {
      name: branch.name.replace(' Şubesi', ''),
      kampanya: branchCampaigns.length,
      bagis: branchDonations.reduce((sum, d) => sum + (d.amount || 0), 0),
      dagitim: branchDistributions.reduce((sum, d) => sum + (d.quantity || 0), 0),
    }
  })

  const isLoading = campaignsLoading || donationsLoading || distributionsLoading

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Genel Merkez - Kurban Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Tüm şubelerin kurban işlemlerini görüntüleyin ve yönetin
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <FileArrowDown size={16} />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Kampanya</p>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
              </div>
              <Cow size={24} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aktif Kampanya</p>
                <p className="text-2xl font-bold text-green-600">{activeCampaigns}</p>
              </div>
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Bağış</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalDonations)}
                </p>
              </div>
              <CurrencyDollar size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Dağıtım</p>
                <p className="text-2xl font-bold text-purple-600">{totalDistributions} kg</p>
              </div>
              <Users size={24} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="campaigns">Kampanyalar</TabsTrigger>
          <TabsTrigger value="donations">Bağışlar</TabsTrigger>
          <TabsTrigger value="distributions">Dağıtımlar</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kampanya Listesi</CardTitle>
                  <CardDescription>
                    Tüm şubelerin kurban kampanyaları
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Şube Seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Şubeler</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Kampanya ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[250px]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Şube</TableHead>
                        <TableHead>Kampanya</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Hedef</TableHead>
                        <TableHead>Toplanan</TableHead>
                        <TableHead>İlerleme</TableHead>
                        <TableHead>Başlangıç</TableHead>
                        <TableHead>Bitiş</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Kampanya bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCampaigns.map((campaign) => {
                          const progress = campaign.targetAmount
                            ? ((campaign.collectedAmount || 0) / campaign.targetAmount) * 100
                            : 0
                          
                          return (
                            <TableRow key={campaign.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Buildings size={16} className="text-muted-foreground" />
                                  <span className="font-medium">
                                    {(campaign as any).branchName || '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{campaign.name}</div>
                                  <div className="text-sm text-muted-foreground">{campaign.code}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={campaign.status === 'active' ? 'default' : 'secondary'}
                                >
                                  {campaign.status === 'active' ? 'Aktif' : 'Pasif'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(campaign.targetAmount || 0)}
                              </TableCell>
                              <TableCell className="text-green-600 font-semibold">
                                {formatCurrency(campaign.collectedAmount || 0)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-muted rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full bg-green-500"
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-12 text-right">
                                    {progress.toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {campaign.startDate
                                  ? format(new Date(campaign.startDate), 'dd MMM yyyy', { locale: tr })
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {campaign.endDate
                                  ? format(new Date(campaign.endDate), 'dd MMM yyyy', { locale: tr })
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bağış Listesi</CardTitle>
              <CardDescription>
                Tüm şubelerin bağış kayıtları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Bağışçı</TableHead>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDonations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Bağış bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      allDonations.slice(0, 50).map((donation) => {
                        const branch = branches.find(b => b.id === donation.facilityId)
                        const campaign = allCampaigns.find(c => c.id === donation.campaignId)
                        return (
                          <TableRow key={donation.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Buildings size={16} className="text-muted-foreground" />
                                <span>{branch?.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{donation.donorName || '-'}</TableCell>
                            <TableCell>{campaign?.name || '-'}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(donation.amount || 0)}
                            </TableCell>
                            <TableCell>
                              {donation.date
                                ? format(new Date(donation.date), 'dd MMM yyyy', { locale: tr })
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">Onaylandı</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dağıtım Listesi</CardTitle>
              <CardDescription>
                Tüm şubelerin et dağıtım kayıtları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Miktar (kg)</TableHead>
                      <TableHead>Alıcı Sayısı</TableHead>
                      <TableHead>Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allDistributions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Dağıtım bulunamadı
                        </TableCell>
                      </TableRow>
                    ) : (
                      allDistributions.slice(0, 50).map((distribution) => {
                        const branch = branches.find(b => b.id === distribution.facilityId)
                        const campaign = allCampaigns.find(c => c.id === distribution.campaignId)
                        return (
                          <TableRow key={distribution.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Buildings size={16} className="text-muted-foreground" />
                                <span>{branch?.name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{campaign?.name || '-'}</TableCell>
                            <TableCell className="font-semibold">
                              {distribution.quantity || 0} kg
                            </TableCell>
                            <TableCell>{distribution.recipientCount || 0}</TableCell>
                            <TableCell>
                              {distribution.date
                                ? format(new Date(distribution.date), 'dd MMM yyyy', { locale: tr })
                                : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şube Bazlı Özet</CardTitle>
              <CardDescription>
                Her şubenin kurban işlemleri özeti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Toplam Bağış</TableHead>
                      <TableHead>Toplam Dağıtım</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="font-semibold">{stat.kampanya}</TableCell>
                        <TableCell className="text-blue-600 font-semibold">
                          {formatCurrency(stat.bagis)}
                        </TableCell>
                        <TableCell className="text-purple-600 font-semibold">
                          {stat.dagitim} kg
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Şube Bağış Karşılaştırması</CardTitle>
              <CardDescription>
                Şubeler arası bağış miktarı karşılaştırması
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={branchStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="bagis" fill="#3b82f6" name="Toplam Bağış" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

