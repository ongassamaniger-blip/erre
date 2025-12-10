import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CalendarBlank, CurrencyDollar, Users, ChartLine, Printer, FilePdf, FileArrowDown } from '@phosphor-icons/react'
import type { QurbanCampaign } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { donationService } from '@/services/qurban/qurbanService'
import { useAuthStore } from '@/store/authStore'
import { exportCampaignToPDF, printCampaign, exportCampaignsToExcel } from '@/utils/qurbanExport'
import { toast } from 'sonner'

interface CampaignDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: QurbanCampaign | null
}

const statusColors = {
  active: 'bg-green-500/10 text-green-700 border-green-200',
  planning: 'bg-blue-500/10 text-blue-700 border-blue-200',
  completed: 'bg-gray-500/10 text-gray-700 border-gray-200',
  archived: 'bg-orange-500/10 text-orange-700 border-orange-200',
}

const statusLabels = {
  active: 'Aktif',
  planning: 'Planlama',
  completed: 'Tamamlandı',
  archived: 'Arşiv',
}

const qurbanTypeLabels = {
  sheep: 'Koyun',
  goat: 'Keçi',
  'cow-share': 'İnek Hissesi',
  'camel-share': 'Deve Hissesi',
}

const paymentStatusColors = {
  paid: 'bg-green-500/10 text-green-700 border-green-200',
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
}

export function CampaignDetailDialog({
  open,
  onOpenChange,
  campaign,
}: CampaignDetailDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)

  const { data: donations = [] } = useQuery({
    queryKey: ['qurban-donations-campaign', campaign?.id, selectedFacility?.id],
    queryFn: () =>
      donationService.getDonations({
        campaignId: campaign?.id,
        facilityId: selectedFacility?.id,
      }),
    enabled: open && !!campaign?.id && !!selectedFacility?.id,
  })

  if (!campaign) return null

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const collectionProgress = (campaign.collectedAmount / campaign.targetAmount) * 100
  const animalProgress = (campaign.completedAnimals / campaign.targetAnimals) * 100

  const paidDonations = donations.filter(d => d.paymentStatus === 'paid')
  const pendingDonations = donations.filter(d => d.paymentStatus === 'pending')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>
            Kampanya detayları ve bağış istatistikleri
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Kampanya Bilgileri */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kampanya Bilgileri</CardTitle>
                <Badge variant="outline" className={statusColors[campaign.status]}>
                  {statusLabels[campaign.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Yıl</p>
                  <p className="font-medium">{campaign.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Para Birimi</p>
                  <p className="font-medium">{campaign.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kampanya Süresi</p>
                  <div className="flex items-center gap-1">
                    <CalendarBlank size={16} />
                    <span>
                      {format(new Date(campaign.startDate), 'dd MMM yyyy', { locale: tr })} -{' '}
                      {format(new Date(campaign.endDate), 'dd MMM yyyy', { locale: tr })}
                    </span>
                  </div>
                </div>
              </div>
              {campaign.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Açıklama</p>
                  <p className="text-sm">{campaign.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Finansal Durum */}
          <Card>
            <CardHeader>
              <CardTitle>Finansal Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Toplanan Tutar</span>
                  <span className="font-medium">
                    {formatCurrency(campaign.collectedAmount)} / {formatCurrency(campaign.targetAmount)}
                  </span>
                </div>
                <Progress value={collectionProgress} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {Math.round(collectionProgress)}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Kalan Tutar</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(campaign.targetAmount - campaign.collectedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Bağış Sayısı</p>
                  <p className="text-lg font-bold">{donations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hayvan Durumu */}
          <Card>
            <CardHeader>
              <CardTitle>Hayvan Durumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Hayvan Sayısı</span>
                  <span className="font-medium">
                    {campaign.completedAnimals} / {campaign.targetAnimals}
                  </span>
                </div>
                <Progress value={animalProgress} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {Math.round(animalProgress)}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bağış Özeti */}
          <Card>
            <CardHeader>
              <CardTitle>Bağış Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Bağış</p>
                  <p className="text-xl font-bold">{paidDonations.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ödenen</p>
                  <p className="text-xl font-bold text-green-600">{paidDonations.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bekleyen</p>
                  <p className="text-xl font-bold text-yellow-600">{pendingDonations.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Tutar</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(donations.reduce((sum, d) => sum + d.amount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bağış Listesi */}
          <Card>
            <CardHeader>
              <CardTitle>Bağış Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              {donations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bağışçı</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Tarih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell className="font-medium">{donation.donorName}</TableCell>
                          <TableCell>
                            {qurbanTypeLabels[donation.qurbanType]} ({donation.shareCount})
                          </TableCell>
                          <TableCell>{formatCurrency(donation.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={paymentStatusColors[donation.paymentStatus]}>
                              {donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(donation.createdDate), 'dd MMM yyyy', { locale: tr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz bağış bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                exportCampaignToPDF(campaign, donations)
                toast.success('PDF dosyası indiriliyor...')
              }}
            >
              <FilePdf size={16} className="mr-2" />
              PDF İndir
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                printCampaign(campaign, donations)
              }}
            >
              <Printer size={16} className="mr-2" />
              Yazdır
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

