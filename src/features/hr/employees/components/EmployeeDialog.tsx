import { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { employeeService } from '@/services/hr/employeeService'
import { departmentService } from '@/services/departmentService'
import { definitionService } from '@/services/definitionService'
import { useAuthStore } from '@/store/authStore'
import { Plus, X } from '@phosphor-icons/react'
import type { Employee, EmploymentType, EmployeeStatus } from '@/types/hr'
import { useExchangeRate } from '@/hooks/useExchangeRate'

// Simple IBAN length validation (15-34 characters)
function validateIBAN(iban: string): { valid: boolean; error?: string } {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase()

    // Min length check
    if (cleanIban.length < 15) {
        return { valid: false, error: 'IBAN en az 15 karakter olmalıdır' }
    }

    // Max length check
    if (cleanIban.length > 34) {
        return { valid: false, error: 'IBAN en fazla 34 karakter olabilir' }
    }

    return { valid: true }
}

const employmentTypes: { value: EmploymentType; label: string }[] = [
    { value: 'full-time', label: 'Tam Zamanlı' },
    { value: 'part-time', label: 'Yarı Zamanlı' },
    { value: 'contract', label: 'Sözleşmeli' },
]

const statuses: { value: EmployeeStatus; label: string }[] = [
    { value: 'active', label: 'Aktif' },
    { value: 'on-leave', label: 'İzinli' },
    { value: 'inactive', label: 'Pasif' },
]

const countryCodes = [
    { code: '+90', country: 'TR' },
    { code: '+1', country: 'US' },
    { code: '+44', country: 'GB' },
    { code: '+49', country: 'DE' },
    { code: '+33', country: 'FR' },
    { code: '+39', country: 'IT' },
    { code: '+34', country: 'ES' },
    { code: '+7', country: 'RU' },
    { code: '+86', country: 'CN' },
    { code: '+81', country: 'JP' },
]

interface EmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee?: Employee
    onSave: (data: Partial<Employee>) => Promise<void>
}

export function EmployeeDialog({
    open,
    onOpenChange,
    employee,
    onSave,
}: EmployeeDialogProps) {
    const { selectedFacility } = useAuthStore()
    const queryClient = useQueryClient()
    const { data: departments = [] } = useQuery({
        queryKey: ['departments', selectedFacility?.id, 'active'],
        queryFn: () => departmentService.getDepartments({ facilityId: selectedFacility?.id, isActive: true }),
        enabled: !!selectedFacility?.id,
    })

    const { data: jobTitles = [] } = useQuery({
        queryKey: ['job-titles', selectedFacility?.id],
        queryFn: () => definitionService.getJobTitles(selectedFacility?.id),
        enabled: !!selectedFacility?.id,
    })

    const isEditing = !!employee
    const [formData, setFormData] = useState<Partial<Employee>>({
        firstName: '',
        lastName: '',
        code: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        employmentType: 'full-time',
        status: 'active',
        nationalId: '',
        dateOfBirth: '',
        nationality: 'TR',
        gender: 'male',
        maritalStatus: 'single',
        address: '',
        hireDate: new Date().toISOString().split('T')[0],
        workingHours: '40',
        salary: {
            amount: 0,
            currency: 'TRY',
            frequency: 'monthly',
        },
        emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
        },
        leaveEntitlements: [],
        documents: [],
    })

    // State for phone parts
    const [phoneCode, setPhoneCode] = useState('+90')
    const [phoneNumber, setPhoneNumber] = useState('')

    // Quick Add State
    const [isAddingTitle, setIsAddingTitle] = useState(false)
    const [newTitleName, setNewTitleName] = useState('')

    useEffect(() => {
        if (employee) {
            // If employee is inactive, clean up the data for display and editing
            if (employee.status === 'inactive') {
                const cleanValue = (val: string | undefined) => val?.replace(/_deleted_\d+/g, '') || ''

                setFormData({
                    ...employee,
                    email: cleanValue(employee.email),
                    code: cleanValue(employee.code),
                    nationalId: cleanValue(employee.nationalId)
                })
            } else {
                setFormData(employee)
            }

            // Parse phone number
            if (employee.phone) {
                const foundCode = countryCodes.find(c => employee.phone.startsWith(c.code))
                if (foundCode) {
                    setPhoneCode(foundCode.code)
                    setPhoneNumber(employee.phone.slice(foundCode.code.length))
                } else {
                    setPhoneCode('+90')
                    setPhoneNumber(employee.phone)
                }
            }
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                code: '',
                email: '',
                phone: '',
                department: '',
                position: '',
                employmentType: 'full-time',
                status: 'active',
                nationalId: '',
                dateOfBirth: '',
                nationality: 'TR',
                gender: 'male',
                maritalStatus: 'single',
                address: '',
                hireDate: new Date().toISOString().split('T')[0],
                workingHours: '40',
                salary: {
                    amount: 0,
                    currency: 'TRY',
                    frequency: 'monthly',
                },
                emergencyContact: {
                    name: '',
                    relationship: '',
                    phone: '',
                },
                leaveEntitlements: [],
                documents: [],
            })
            setPhoneCode('+90')
            setPhoneNumber('')
        }
    }, [employee, open])

    // Update formData.phone whenever parts change
    useEffect(() => {
        setFormData(prev => ({ ...prev, phone: `${phoneCode}${phoneNumber}` }))
    }, [phoneCode, phoneNumber])

    const handleAddTitle = async () => {
        if (!newTitleName.trim() || !selectedFacility?.id) return
        try {
            const newTitle = await definitionService.createJobTitle({
                title: newTitleName,
                facility_id: selectedFacility.id
            })
            // Invalidate with the correct query key including facilityId
            await queryClient.invalidateQueries({ queryKey: ['job-titles', selectedFacility.id] })
            setFormData(prev => ({ ...prev, position: newTitle.title }))
            setIsAddingTitle(false)
            setNewTitleName('')
            toast.success('Pozisyon eklendi')
        } catch (error) {
            toast.error('Ekleme başarısız')
        }
    }

    // Exchange rate hook for salary
    const { data: salaryExchangeRate, isLoading: salaryRateLoading } = useExchangeRate(
        formData.salary?.currency || 'TRY',
        'TRY'
    )

    // Calculate salary in TRY
    const salaryInTry = useMemo(() => {
        if (!formData.salary?.amount) return 0
        if (formData.salary.currency === 'TRY') return formData.salary.amount
        return formData.salary.amount * (salaryExchangeRate || 1)
    }, [formData.salary?.amount, formData.salary?.currency, salaryExchangeRate])

    const handleSubmit = async () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.department || !formData.position) {
            toast.error('Lütfen zorunlu alanları doldurun')
            return
        }

        // TC Kimlik No Validation
        if (formData.nationalId && !/^\d{11}$/.test(formData.nationalId)) {
            toast.error('TC Kimlik No 11 haneli olmalıdır')
            return
        }

        // Phone Validation
        // Check if we have a valid number part (at least 7 digits for local number)
        if (phoneNumber.length < 7) {
            toast.error('Geçerli bir telefon numarası giriniz')
            return
        }

        // Emergency Contact Phone Validation
        if (formData.emergencyContact?.phone && formData.emergencyContact.phone.length < 10) {
            toast.error('Acil durum iletişim numarası 10 haneli olmalıdır')
            return
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (formData.email && !emailRegex.test(formData.email)) {
            toast.error('Geçerli bir e-posta adresi giriniz')
            return
        }

        // Check for duplicate email
        if (formData.email) {
            // Skip check if editing and email hasn't changed
            if (!isEditing || (isEditing && formData.email !== employee?.email)) {
                const exists = await employeeService.checkEmailExists(formData.email)
                if (exists) {
                    toast.error('Bu e-posta adresi sistemde zaten kayıtlı')
                    return
                }
            }
        }

        // IBAN Validation with international support and checksum
        if (formData.iban) {
            const ibanResult = validateIBAN(formData.iban)
            if (!ibanResult.valid) {
                toast.error(ibanResult.error || 'Geçersiz IBAN')
                return
            }
        }

        try {
            // Döviz seçildiğinde maaşı TRY'ye çevir
            const isForeignCurrency = formData.salary?.currency !== 'TRY' && salaryExchangeRate && salaryExchangeRate > 1
            const finalSalaryAmount = isForeignCurrency ? salaryInTry : (formData.salary?.amount || 0)

            await onSave({
                ...formData,
                salary: {
                    ...formData.salary!,
                    amount: finalSalaryAmount,
                    currency: 'TRY' // Her zaman TRY olarak kaydet
                },
                iban: formData.iban?.replace(/\s/g, '').toUpperCase()
            })
            toast.success(isEditing ? 'Güncellendi' : 'Oluşturuldu')
            onOpenChange(false)
        } catch (error: any) {
            console.error('Submit error:', error)
            toast.error(error.message || 'Bir hata oluştu')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Çalışan Düzenle' : 'Yeni Çalışan'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Çalışan bilgilerini güncelleyin' : 'Yeni çalışan ekleyin'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Ad *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="Ad"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Soyad *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Soyad"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Çalışan Kodu</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder={isEditing ? "Çalışan kodu" : "Otomatik oluşturulacak"}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-muted" : ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nationalId">TC Kimlik No</Label>
                            <Input
                                id="nationalId"
                                value={formData.nationalId}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
                                    setFormData({ ...formData, nationalId: value })
                                }}
                                placeholder="TC Kimlik No (11 hane)"
                                maxLength={11}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon *</Label>
                            <div className="flex">
                                <Select value={phoneCode} onValueChange={setPhoneCode}>
                                    <SelectTrigger className="w-[120px] rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0">
                                        <SelectValue placeholder="Kod" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countryCodes.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.code} ({c.country})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    id="phone"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        // Allow only numbers, max 10 chars
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                        setPhoneNumber(value)
                                    }}
                                    placeholder="555 000 0000"
                                    maxLength={10}
                                    className="flex-1 rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="department">Departman *</Label>
                            <Select
                                value={formData.department}
                                onValueChange={(value) => setFormData({ ...formData, department: value })}
                            >
                                <SelectTrigger id="department">
                                    <SelectValue placeholder="Departman seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments?.map(dept => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Pozisyon *</Label>
                            {isAddingTitle ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={newTitleName}
                                        onChange={(e) => setNewTitleName(e.target.value)}
                                        placeholder="Yeni pozisyon adı"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddTitle()
                                            }
                                        }}
                                    />
                                    <Button type="button" size="icon" onClick={handleAddTitle}>
                                        <Plus weight="bold" />
                                    </Button>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setIsAddingTitle(false)}>
                                        <X weight="bold" />
                                    </Button>
                                </div>
                            ) : (
                                <Select
                                    value={formData.position}
                                    onValueChange={(value) => {
                                        if (value === 'new') {
                                            setIsAddingTitle(true)
                                        } else {
                                            setFormData({ ...formData, position: value })
                                        }
                                    }}
                                >
                                    <SelectTrigger id="position">
                                        <SelectValue placeholder="Pozisyon seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new" className="text-primary font-medium">
                                            + Yeni Pozisyon Ekle
                                        </SelectItem>
                                        {jobTitles.map((t) => (
                                            <SelectItem key={t.id} value={t.title}>
                                                {t.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="employmentType">İstihdam Tipi</Label>
                            <Select
                                value={formData.employmentType}
                                onValueChange={(value) => setFormData({ ...formData, employmentType: value as EmploymentType })}
                            >
                                <SelectTrigger id="employmentType">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {employmentTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Durum</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as EmployeeStatus })}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hireDate">İşe Başlama Tarihi</Label>
                            <Input
                                id="hireDate"
                                type="date"
                                value={formData.hireDate}
                                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                        <h4 className="font-medium">Maaş Bilgileri</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="salaryAmount">Maaş Tutarı</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="salaryAmount"
                                        type="number"
                                        value={formData.salary?.amount}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            salary: { ...formData.salary!, amount: Number(e.target.value) }
                                        })}
                                        placeholder="0.00"
                                    />
                                    <Select
                                        value={formData.salary?.currency}
                                        onValueChange={(value) => setFormData({
                                            ...formData,
                                            salary: { ...formData.salary!, currency: value }
                                        })}
                                    >
                                        <SelectTrigger className="w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TRY">TRY</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentDate">Ödeme Günü</Label>
                                <Select
                                    value={formData.salary?.paymentDate}
                                    onValueChange={(value) => setFormData({
                                        ...formData,
                                        salary: { ...formData.salary!, paymentDate: value }
                                    })}
                                >
                                    <SelectTrigger id="paymentDate">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Her ayın 1'i</SelectItem>
                                        <SelectItem value="5">Her ayın 5'i</SelectItem>
                                        <SelectItem value="15">Her ayın 15'i</SelectItem>
                                        <SelectItem value="30">Her ayın sonu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* TL Karşılığı - Döviz seçildiğinde göster */}
                        {formData.salary?.currency !== 'TRY' && (formData.salary?.amount || 0) > 0 && (
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-blue-600">Güncel Kur</p>
                                        <p className="text-sm font-semibold text-blue-800">
                                            1 {formData.salary?.currency} = {salaryRateLoading ? '...' : salaryExchangeRate?.toFixed(4)} TRY
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-blue-600">TL Karşılığı</p>
                                        <p className="text-lg font-bold text-blue-800">
                                            {salaryRateLoading ? '...' : new Intl.NumberFormat('tr-TR', {
                                                style: 'currency',
                                                currency: 'TRY'
                                            }).format(salaryInTry)}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-blue-500 mt-1">
                                    Maaş TL cinsinden kaydedilecek
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                        <h4 className="font-medium">Banka Bilgileri</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Banka Adı</Label>
                                <Input
                                    id="bankName"
                                    value={formData.bankName || ''}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    placeholder="Banka Adı"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="iban">IBAN</Label>
                                <Input
                                    id="iban"
                                    value={formData.iban || ''}
                                    onChange={(e) => {
                                        // Auto-uppercase and simple format
                                        const val = e.target.value.toUpperCase()
                                        setFormData({ ...formData, iban: val })
                                    }}
                                    placeholder="TR..."
                                    maxLength={32}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gender">Cinsiyet</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })}
                            >
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Erkek</SelectItem>
                                    <SelectItem value="female">Kadın</SelectItem>
                                    <SelectItem value="other">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maritalStatus">Medeni Durum</Label>
                            <Select
                                value={formData.maritalStatus}
                                onValueChange={(value) => setFormData({ ...formData, maritalStatus: value as 'single' | 'married' | 'divorced' | 'widowed' })}
                            >
                                <SelectTrigger id="maritalStatus">
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Bekar</SelectItem>
                                    <SelectItem value="married">Evli</SelectItem>
                                    <SelectItem value="divorced">Boşanmış</SelectItem>
                                    <SelectItem value="widowed">Dul</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
                            <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                        <h4 className="font-medium">Acil Durum İletişim</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ecName">İsim</Label>
                                <Input
                                    id="ecName"
                                    value={formData.emergencyContact?.name}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        emergencyContact: { ...formData.emergencyContact!, name: e.target.value }
                                    })}
                                    placeholder="Ad Soyad"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ecRel">Yakınlık</Label>
                                <Input
                                    id="ecRel"
                                    value={formData.emergencyContact?.relationship}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        emergencyContact: { ...formData.emergencyContact!, relationship: e.target.value }
                                    })}
                                    placeholder="Örn: Eş, Baba"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ecPhone">Telefon</Label>
                                <Input
                                    id="ecPhone"
                                    value={formData.emergencyContact?.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                                        setFormData({
                                            ...formData,
                                            emergencyContact: { ...formData.emergencyContact!, phone: value }
                                        })
                                    }}
                                    placeholder="555 000 0000"
                                    maxLength={10}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adres</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Adres"
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        İptal
                    </Button>
                    <Button onClick={handleSubmit}>
                        {isEditing ? 'Güncelle' : 'Oluştur'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
