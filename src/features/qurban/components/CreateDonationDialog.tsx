import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { donationService, campaignService } from '@/services/qurban/qurbanService'
import { toast } from 'sonner'
import type { QurbanDonation } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { Currency } from '@/types/finance'

interface CreateDonationDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateDonationDialog({ open, onClose, onSuccess }: CreateDonationDialogProps) {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const { data: campaigns = [] } = useQuery({
    queryKey: ['qurban-campaigns-select', selectedFacility?.id],
    queryFn: () => campaignService.getCampaigns({
      status: 'active',
      facilityId: selectedFacility?.id,
    }),
    enabled: open && !!selectedFacility?.id,
  })

  const [formData, setFormData] = useState({
    campaignId: '',
    campaignName: '',
    donorName: '',
    donorPhone: '',
    donorEmail: '',
    donorCountry: 'Türkiye',
    qurbanType: 'sheep' as QurbanDonation['qurbanType'],
    shareCount: '1',
    amount: '',
    currency: 'TRY' as Currency,
    paymentMethod: 'cash',
    paymentStatus: 'pending' as QurbanDonation['paymentStatus'],
    distributionRegion: '',
    deliveryAddress: '',
    hasProxy: false,
    proxyText: '',
    specialRequests: '',
  })

  // Fetch Exchange Rate
  const { data: exchangeRate, isLoading: isRateLoading } = useExchangeRate(formData.currency, 'TRY')

  // Calculate Amount in TRY
  const amountInTry = formData.amount && exchangeRate ? parseFloat(formData.amount) * exchangeRate : 0

  const createMutation = useMutation({
    mutationFn: (data: { formData: typeof formData; calculatedAmountInTry: number; currentExchangeRate: number }) =>
      donationService.createDonation({
        ...data.formData,
        shareCount: parseInt(data.formData.shareCount) || 1,
        amount: parseFloat(data.formData.amount) || 0,
        currency: data.formData.currency,
        exchangeRate: data.currentExchangeRate,
        amountInTry: data.calculatedAmountInTry,
        status: 'pending',
        facilityId: selectedFacility?.id,
      }),
    onSuccess: () => {
      toast.success('Bağış kaydı başarıyla oluşturuldu')
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Bağış kaydı oluşturulurken bir hata oluştu')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.donorName.trim() || !formData.campaignId) {
      toast.error('Gerekli alanları doldurun')
      return
    }

    // Calculate amountInTry at submit time
    const amount = parseFloat(formData.amount) || 0
    const rate = exchangeRate || 1
    const calculatedAmountInTry = formData.currency === 'TRY' ? amount : amount * rate

    console.log('[CreateDonation] Currency:', formData.currency)
    console.log('[CreateDonation] Amount:', amount)
    console.log('[CreateDonation] Exchange Rate:', rate)
    console.log('[CreateDonation] Amount in TRY:', calculatedAmountInTry)

    const selectedCampaign = campaigns.find(c => c.id === formData.campaignId)
    if (selectedCampaign) {
      const remainingAmount = selectedCampaign.targetAmount - selectedCampaign.collectedAmount

      if (remainingAmount <= 0) {
        toast.error('Bu kampanya için hedeflenen tutar tamamlanmıştır.')
        return
      }

      if (calculatedAmountInTry > remainingAmount) {
        toast.error(`Bu kampanya için en fazla ${remainingAmount.toLocaleString('tr-TR')} TL bağış yapabilirsiniz.`)
        return
      }
    }

    createMutation.mutate({
      formData,
      calculatedAmountInTry,
      currentExchangeRate: rate
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Bağış Kaydı</DialogTitle>
          <DialogDescription>Kurban bağışı kaydı oluşturun</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Kampanya Bilgileri</h3>
            <div className="space-y-2">
              <Label htmlFor="campaign">Kampanya *</Label>
              <Select
                value={formData.campaignId}
                onValueChange={(value) => {
                  const campaign = campaigns.find((c) => c.id === value)

                  // Reset qurban type based on campaign type
                  let defaultType = formData.qurbanType
                  if (campaign?.campaignType === 'small_cattle') {
                    defaultType = 'sheep'
                  } else if (campaign?.campaignType === 'large_cattle') {
                    defaultType = 'cow-share'
                  }

                  setFormData({
                    ...formData,
                    campaignId: value,
                    campaignName: campaign?.name || '',
                    qurbanType: defaultType,
                  })
                }}
              >
                <SelectTrigger id="campaign">
                  <SelectValue placeholder="Kampanya seçin" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Bağışçı Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donorName">Ad Soyad *</Label>
                <Input
                  id="donorName"
                  value={formData.donorName}
                  onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donorPhone">Telefon</Label>
                <div className="flex gap-2">
                  <Select defaultValue="+90">
                    <SelectTrigger className="w-[80px]">
                      <SelectValue placeholder="+90" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+90">+90</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="donorPhone"
                    placeholder="5555555555"
                    maxLength={10}
                    value={formData.donorPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setFormData({ ...formData, donorPhone: value })
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="donorEmail">E-posta</Label>
                <Input
                  id="donorEmail"
                  type="email"
                  value={formData.donorEmail}
                  onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
                  onBlur={async (e) => {
                    const email = e.target.value
                    if (email) {
                      const { isEmployee, isDonor } = await donationService.checkEmailAvailability(email)
                      if (isEmployee) {
                        toast.error('Bu e-posta adresi bir çalışana aittir, kullanılamaz.')
                        setFormData({ ...formData, donorEmail: '' })
                      } else if (isDonor) {
                        toast.success('Bu e-posta adresi sistemde kayıtlı, tekrar kullanılabilir.')
                      }
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donorCountry">Ülke</Label>
                <Input
                  id="donorCountry"
                  value={formData.donorCountry}
                  onChange={(e) => setFormData({ ...formData, donorCountry: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Kurban Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qurbanType">Kurban Tipi</Label>
                <Select
                  value={formData.qurbanType}
                  onValueChange={(value) => setFormData({ ...formData, qurbanType: value as QurbanDonation['qurbanType'] })}
                >
                  <SelectTrigger id="qurbanType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const selectedCampaign = campaigns.find(c => c.id === formData.campaignId)
                      const type = selectedCampaign?.campaignType

                      if (type === 'small_cattle') {
                        return (
                          <>
                            <SelectItem value="sheep">Koyun</SelectItem>
                            <SelectItem value="goat">Keçi</SelectItem>
                          </>
                        )
                      } else if (type === 'large_cattle') {
                        return (
                          <>
                            <SelectItem value="cow-share">İnek Hissesi</SelectItem>
                            <SelectItem value="camel-share">Deve Hissesi</SelectItem>
                          </>
                        )
                      }

                      // Fallback if no campaign selected or type not set
                      return (
                        <>
                          <SelectItem value="sheep">Koyun</SelectItem>
                          <SelectItem value="goat">Keçi</SelectItem>
                          <SelectItem value="cow-share">İnek Hissesi</SelectItem>
                          <SelectItem value="camel-share">Deve Hissesi</SelectItem>
                        </>
                      )
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shareCount">Hisse Sayısı</Label>
                <Input
                  id="shareCount"
                  type="number"
                  value={formData.shareCount}
                  onChange={(e) => setFormData({ ...formData, shareCount: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="amount">Tutar *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value as Currency })}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="flex-1 text-lg font-semibold h-12"
                    placeholder="0.00"
                    style={{ fontSize: '1.25rem' }}
                  />
                </div>
                {formData.currency !== 'TRY' && formData.amount && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    {isRateLoading ? (
                      <span className="text-sm text-blue-600">Kur alınıyor...</span>
                    ) : exchangeRate ? (
                      <div className="space-y-1">
                        <p className="text-sm text-blue-600">
                          1 {formData.currency} = {exchangeRate.toFixed(4)} TRY
                        </p>
                        <p className="text-lg font-bold text-blue-800">
                          TL Karşılığı: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amountInTry)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-red-600">Kur bilgisi alınamadı</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="distributionRegion">Dağıtım Bölgesi</Label>
              <Input
                id="distributionRegion"
                value={formData.distributionRegion}
                onChange={(e) => setFormData({ ...formData, distributionRegion: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Ödeme Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="bank-transfer">Banka Transferi</SelectItem>
                    <SelectItem value="credit-card">Kredi Kartı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Ödeme Durumu</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as QurbanDonation['paymentStatus'] })}
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="paid">Ödendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Teslimat Adresi</Label>
              <Textarea
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                placeholder="Tam adres giriniz..."
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasProxy"
                checked={formData.hasProxy}
                onCheckedChange={(checked) => setFormData({ ...formData, hasProxy: checked as boolean })}
              />
              <Label htmlFor="hasProxy">Vekalet alındı</Label>
            </div>
            {formData.hasProxy && (
              <div className="space-y-2">
                <Label htmlFor="proxyText">Vekalet Metni</Label>
                <Textarea
                  id="proxyText"
                  value={formData.proxyText}
                  onChange={(e) => setFormData({ ...formData, proxyText: e.target.value })}
                  rows={3}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Özel Talepler</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Kaydediliyor...' : 'Bağış Kaydı Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
