import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { VendorCustomer } from '@/types/finance'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/useTranslation'

interface VendorCustomerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vendorCustomer?: VendorCustomer
    onSave: (data: Partial<VendorCustomer>) => Promise<void>
    defaultType?: 'vendor' | 'customer'
}

export function VendorCustomerDialog({
    open,
    onOpenChange,
    vendorCustomer,
    onSave,
    defaultType = 'vendor',
}: VendorCustomerDialogProps) {
    const { t } = useTranslation()
    const [formData, setFormData] = useState<Partial<VendorCustomer>>({
        name: '',
        type: defaultType,
        taxNumber: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        contactPerson: '',
        notes: '',
    })

    const [countryCode, setCountryCode] = useState('90')
    const [localPhone, setLocalPhone] = useState('')

    const isEditing = !!vendorCustomer

    const COUNTRY_CODES = [
        { code: '90', country: 'TR', label: `${t('Türkiye')} (+90)` },
        { code: '1', country: 'US', label: `${t('ABD')} (+1)` },
        { code: '44', country: 'UK', label: `${t('Birleşik Krallık')} (+44)` },
        { code: '49', country: 'DE', label: `${t('Almanya')} (+49)` },
        { code: '33', country: 'FR', label: `${t('Fransa')} (+33)` },
        { code: '971', country: 'AE', label: `${t('BAE')} (+971)` },
        { code: '966', country: 'SA', label: `${t('Suudi Arabistan')} (+966)` },
        { code: '974', country: 'QA', label: `${t('Katar')} (+974)` },
    ]

    useEffect(() => {
        if (vendorCustomer) {
            setFormData(vendorCustomer)
            // Parse phone number
            if (vendorCustomer.phone) {
                // Remove all non-digit characters except +
                const cleanPhone = vendorCustomer.phone.replace(/[^\d+]/g, '')

                // Check if it starts with +
                if (cleanPhone.startsWith('+')) {
                    // Try to match with known country codes
                    const matchedCode = COUNTRY_CODES.find(c => cleanPhone.startsWith('+' + c.code))
                    if (matchedCode) {
                        setCountryCode(matchedCode.code)
                        setLocalPhone(cleanPhone.slice(matchedCode.code.length + 1)) // +1 for the '+' sign
                    } else {
                        // If no match found, default to TR but put everything in local
                        setCountryCode('90')
                        setLocalPhone(cleanPhone.replace(/^\+90/, ''))
                    }
                } else {
                    // Assume it's a local number, default to TR
                    setCountryCode('90')
                    setLocalPhone(cleanPhone)
                }
            } else {
                setCountryCode('90')
                setLocalPhone('')
            }
        } else {
            setFormData({
                name: '',
                type: defaultType,
                taxNumber: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: '',
                contactPerson: '',
                notes: '',
            })
            setCountryCode('90')
            setLocalPhone('')
        }
    }, [vendorCustomer, open, defaultType])

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow digits
        let value = e.target.value.replace(/\D/g, '')

        // Remove leading zero if present
        if (value.startsWith('0')) {
            value = value.substring(1)
        }

        setLocalPhone(value)
    }

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error(t('Ad alanı zorunludur'))
            return
        }

        // Tax Number Validation (10 or 11 digits)
        if (formData.taxNumber) {
            const taxNum = formData.taxNumber.replace(/\D/g, '')
            if (taxNum.length !== 10 && taxNum.length !== 11) {
                toast.error(t('Vergi numarası 10 veya 11 haneli olmalıdır'))
                return
            }
        }

        // Combine phone number
        let finalPhone = ''
        if (localPhone) {
            if (localPhone.length < 7) {
                toast.error(t('Telefon numarası çok kısa'))
                return
            }
            finalPhone = `+${countryCode}${localPhone}`
        }

        // Duplicate Checks
        const { vendorsCustomersService } = await import('@/services/finance/vendorsCustomersService')

        if (formData.email) {
            const { exists, source } = await vendorsCustomersService.checkDuplicate('email', formData.email, vendorCustomer?.id)
            if (exists) {
                toast.error(`${t('Bu e-posta adresi')} ${source} ${t('tarafından kullanılıyor')}`)
                return
            }
        }

        if (finalPhone) {
            const { exists, source } = await vendorsCustomersService.checkDuplicate('phone', finalPhone, vendorCustomer?.id)
            if (exists) {
                toast.error(`${t('Bu telefon numarası')} ${source} ${t('tarafından kullanılıyor')}`)
                return
            }
        }

        try {
            await onSave({
                ...formData,
                phone: finalPhone
            })
            onOpenChange(false)
            setFormData({
                name: '',
                type: defaultType,
                taxNumber: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: '',
                contactPerson: '',
                notes: '',
            })
            setCountryCode('90')
            setLocalPhone('')
            toast.success(t('Kayıt oluşturuldu ve onay için gönderildi'))
        } catch (error: any) {
            console.error(error)
            toast.error(t('Bir hata oluştu') + ': ' + (error.message || t('Bilinmeyen hata')))
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? t('Düzenle') : t('Yeni Kayıt')}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? t('Tedarikçi/Müşteri bilgilerini güncelleyin') : t('Yeni tedarikçi veya müşteri ekleyin')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('Ad')} *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t("Şirket/Kişi adı")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">{t('Tip')} *</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: 'vendor' | 'customer') => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vendor">{t('Tedarikçi')}</SelectItem>
                                    <SelectItem value="customer">{t('Müşteri')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="taxNumber">{t('Vergi No')}</Label>
                            <Input
                                id="taxNumber"
                                value={formData.taxNumber || ''}
                                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                                placeholder={t("Vergi numarası")}
                                maxLength={11}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('E-posta')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('Telefon')}</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={countryCode}
                                    onValueChange={setCountryCode}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder={t("Ülke Kodu")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRY_CODES.map((country) => (
                                            <SelectItem key={country.code} value={country.code}>
                                                {country.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="phone"
                                    value={localPhone}
                                    onChange={handlePhoneChange}
                                    placeholder="5535131802"
                                    className="flex-1"
                                    maxLength={15}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPerson">{t('İletişim Kişisi')}</Label>
                            <Input
                                id="contactPerson"
                                value={formData.contactPerson || ''}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                placeholder={t("İletişim kişisi adı")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">{t('Adres')}</Label>
                        <Input
                            id="address"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder={t("Adres")}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">{t('Şehir')}</Label>
                            <Input
                                id="city"
                                value={formData.city || ''}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder={t("Şehir")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">{t('Ülke')}</Label>
                            <Input
                                id="country"
                                value={formData.country || ''}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                placeholder={t("Ülke")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">{t('Notlar')}</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t("Ek notlar...")}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t('İptal')}
                    </Button>
                    <Button onClick={handleSubmit}>
                        {isEditing ? t('Güncelle') : t('Oluştur')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
