import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Phone,
  Envelope,
  Globe,
  CurrencyDollar,
  CalendarBlank,
  MapPin,
  FileText,
  Printer,
} from '@phosphor-icons/react'
import type { QurbanDonation } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { printDonation } from '@/utils/qurbanExport'

interface DonationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  donation: QurbanDonation | null
}

const qurbanTypeLabels = {
  sheep: 'Koyun',
  goat: 'Keçi',
  'cow-share': 'İnek Hissesi',
  'camel-share': 'Deve Hissesi',
}

const paymentMethodLabels = {
  cash: 'Nakit',
  'bank-transfer': 'Banka Transferi',
  'credit-card': 'Kredi Kartı',
}

const paymentStatusColors = {
  paid: 'bg-green-500/10 text-green-700 border-green-200',
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
}

const statusLabels = {
  pending: 'Beklemede',
  processed: 'İşlendi',
  completed: 'Tamamlandı',
}

export function DonationDetailDialog({
  open,
  onOpenChange,
  donation,
}: DonationDetailDialogProps) {
  if (!donation) return null

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bağış Detayları</DialogTitle>
          <DialogDescription>Bağış kaydı detay bilgileri</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bağışçı Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Bağışçı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ad Soyad</p>
                    <p className="font-medium">{donation.donorName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium">{donation.donorPhone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Envelope size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-posta</p>
                    <p className="font-medium">{donation.donorEmail || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ülke</p>
                    <p className="font-medium">{donation.donorCountry}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kampanya Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Kampanya Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kampanya</p>
                <p className="font-medium">{donation.campaignName}</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarBlank size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Kayıt Tarihi:{' '}
                  {format(new Date(donation.createdDate), 'dd MMMM yyyy', { locale: tr })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Kurban Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Kurban Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kurban Tipi</p>
                  <p className="font-medium">
                    {qurbanTypeLabels[donation.qurbanType]} ({donation.shareCount} hisse)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dağıtım Bölgesi</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-muted-foreground" />
                    <p className="font-medium">{donation.distributionRegion || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ödeme Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tutar</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(donation.amount, donation.currency)}
                  </p>
                  {donation.currency !== 'TRY' && donation.exchangeRate && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <p>Kur: {donation.exchangeRate.toFixed(4)}</p>
                      <p>Karşılık: {formatCurrency(donation.amountInTry || 0, 'TRY')}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ödeme Yöntemi</p>
                  <p className="font-medium">
                    {paymentMethodLabels[donation.paymentMethod]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ödeme Durumu</p>
                  <Badge variant="outline" className={paymentStatusColors[donation.paymentStatus]}>
                    {donation.paymentStatus === 'paid' ? 'Ödendi' : 'Beklemede'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Durum</p>
                  <Badge variant="outline">
                    {statusLabels[donation.status]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vekalet ve Özel Talepler */}
          {(donation.hasProxy || donation.specialRequests) && (
            <Card>
              <CardHeader>
                <CardTitle>Ek Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {donation.hasProxy && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-muted-foreground" />
                      <p className="text-sm font-medium">Vekalet</p>
                      <Badge variant="outline" className="ml-auto">Alındı</Badge>
                    </div>
                    {donation.proxyText && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {donation.proxyText}
                      </p>
                    )}
                  </div>
                )}
                {donation.specialRequests && (
                  <div>
                    <p className="text-sm font-medium mb-2">Özel Talepler</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {donation.specialRequests}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Kapat
            </Button>
            <Button onClick={() => printDonation(donation)}>
              <Printer size={16} className="mr-2" />
              Yazdır
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

