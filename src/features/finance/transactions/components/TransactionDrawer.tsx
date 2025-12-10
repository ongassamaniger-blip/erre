import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { transactionService } from '@/services/finance/transactionService'
import { CreateTransactionDTO, UpdateTransactionDTO, TransactionType, PaymentMethod, Currency, Transaction } from '@/types/finance'
import { categoryService } from '@/services/finance/categoryService'
import { vendorsCustomersService } from '@/services/finance/vendorsCustomersService'
import { projectService } from '@/services/projects/projectService'
import { departmentService } from '@/services/departmentService'
import { toast } from 'sonner'
import { FloppyDisk, PaperPlaneTilt, List, X, Plus } from '@phosphor-icons/react'
import { VendorCustomerDialog } from '@/features/finance/vendors-customers/components/VendorCustomerDialog'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { useTranslation } from '@/hooks/useTranslation'

interface TransactionDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  transaction?: Transaction
}

interface FormData {
  type: TransactionType
  date: string
  amount: string
  currency: Currency
  categoryId: string
  title: string
  description: string
  vendorCustomerId?: string
  projectId?: string
  departmentId?: string
  paymentMethod: PaymentMethod
  notes?: string
}

export function TransactionDrawer({ open, onClose, onSuccess, transaction }: TransactionDrawerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const isEditing = !!transaction

  // Fetch data using React Query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', selectedFacility?.id],
    queryFn: () => categoryService.getCategories({ facilityId: selectedFacility?.id }),
    enabled: !!open && !!selectedFacility?.id,
  })

  const { data: vendorsCustomers = [] } = useQuery({
    queryKey: ['vendors-customers', selectedFacility?.id, 'active'],
    queryFn: () => vendorsCustomersService.getVendorsCustomers({
      facilityId: selectedFacility?.id,
      isActive: true // Show all non-archived vendors (including pending)
    }),
    enabled: !!open && !!selectedFacility?.id,
  })

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', selectedFacility?.id],
    queryFn: () => projectService.getProjects(selectedFacility?.id),
    enabled: !!open && !!selectedFacility?.id,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', selectedFacility?.id],
    queryFn: () => departmentService.getDepartments({ facilityId: selectedFacility?.id }),
    enabled: !!open && !!selectedFacility?.id,
  })

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormData>({
    defaultValues: {
      type: transaction?.type || 'expense',
      date: transaction?.date || new Date().toISOString().split('T')[0],
      amount: transaction?.amount.toString() || '',
      currency: transaction?.currency || 'TRY',
      categoryId: transaction?.categoryId || '',
      title: transaction?.title || '',
      description: transaction?.description || '',
      vendorCustomerId: transaction?.vendorCustomerId || '',
      projectId: transaction?.projectId || '',
      departmentId: transaction?.departmentId || '',
      paymentMethod: transaction?.paymentMethod || 'bank_transfer',
      notes: transaction?.notes || '',
    },
  })

  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        date: transaction.date,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        categoryId: transaction.categoryId,
        title: transaction.title,
        description: transaction.description,
        vendorCustomerId: transaction.vendorCustomerId || '',
        projectId: transaction.projectId || '',
        departmentId: transaction.departmentId || '',
        paymentMethod: transaction.paymentMethod,
        notes: transaction.notes || '',
      })
    } else {
      reset({
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'TRY',
        categoryId: '',
        title: '',
        description: '',
        vendorCustomerId: '',
        projectId: '',
        departmentId: '',
        paymentMethod: 'bank_transfer',
        notes: '',
      })
    }
    setSelectedFiles([])
  }, [transaction, reset])

  const watchType = watch('type')
  const watchAmount = watch('amount')
  const watchCurrency = watch('currency')

  // Fetch Exchange Rate
  const { data: exchangeRate, isLoading: isRateLoading } = useExchangeRate(watchCurrency, 'TRY')

  // Calculate Amount in TRY
  const amountInTry = watchAmount && exchangeRate ? parseFloat(watchAmount) * exchangeRate : 0

  const handleClose = () => {
    reset()
    setSelectedFiles([])
    onClose()
  }

  const handleSaveDraft = async () => {
    if (!selectedFacility?.id) {
      toast.error(t('Lütfen bir tesis/şube seçin'))
      return
    }

    setIsSubmitting(true)
    try {
      // Get current form values directly, bypassing validation
      const data = watch()

      // Ensure numeric values are handled safely
      const originalAmount = data.amount ? parseFloat(data.amount) : 0

      // Helper to convert empty strings to undefined
      const cleanId = (id?: string) => (id && id.trim() !== '') ? id : undefined

      // Döviz seçildiğinde TRY tutarını ana tutar olarak gönder
      const isForeignCurrency = data.currency !== 'TRY' && exchangeRate && exchangeRate > 1
      const finalAmount = isForeignCurrency ? amountInTry : originalAmount
      const finalCurrency = 'TRY' // Her zaman TRY olarak kaydet

      if (isEditing && transaction) {
        const dto: UpdateTransactionDTO = {
          id: transaction.id,
          type: data.type,
          date: data.date || new Date().toISOString().split('T')[0],
          amount: finalAmount,
          currency: finalCurrency,
          exchangeRate: exchangeRate || 1,
          amountInBaseCurrency: amountInTry,
          categoryId: data.categoryId,
          title: data.title || t('Taslak İşlem'),
          description: isForeignCurrency
            ? `${data.description || ''} (${originalAmount} ${data.currency} @ ${exchangeRate?.toFixed(2)})`
            : (data.description || ''),
          vendorCustomerId: cleanId(data.vendorCustomerId),
          projectId: cleanId(data.projectId),
          departmentId: cleanId(data.departmentId),
          paymentMethod: data.paymentMethod,
          documents: selectedFiles.length > 0 ? selectedFiles : undefined,
          notes: data.notes,
          status: 'draft',
        }
        await transactionService.updateTransaction(dto)
        toast.success(t('Taslak güncellendi'))
      } else {
        const dto: CreateTransactionDTO = {
          type: data.type,
          date: data.date || new Date().toISOString().split('T')[0],
          amount: finalAmount,
          currency: finalCurrency,
          exchangeRate: exchangeRate || 1,
          amountInBaseCurrency: amountInTry,
          categoryId: cleanId(data.categoryId) as any,
          title: data.title || t('Taslak İşlem'),
          description: isForeignCurrency
            ? `${data.description || ''} (${originalAmount} ${data.currency} @ ${exchangeRate?.toFixed(2)})`
            : (data.description || ''),
          vendorCustomerId: cleanId(data.vendorCustomerId),
          projectId: cleanId(data.projectId),
          departmentId: cleanId(data.departmentId),
          paymentMethod: data.paymentMethod,
          documents: selectedFiles,
          notes: data.notes,
          status: 'draft',
          facilityId: selectedFacility.id,
        }
        await transactionService.createTransaction(dto)
        toast.success(t('İşlem taslak olarak kaydedildi'))
      }
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error(error)
      toast.error(t('Taslak kaydedilirken hata oluştu') + ': ' + (error.message || t('Bilinmeyen hata')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSavePending = async (data: FormData) => {
    if (!selectedFacility?.id) {
      toast.error(t('Lütfen bir tesis/şube seçin'))
      return
    }

    if (!data.categoryId) {
      toast.error(t('Lütfen bir kategori seçin'))
      return
    }

    const originalAmount = parseFloat(data.amount)

    // 10k validation removed as requested

    const futureDate = new Date(data.date) > new Date()
    if (futureDate) {
      toast.warning(t('İleri tarihli işlemler onaya gönderilemez'))
      return
    }

    setIsSubmitting(true)
    try {
      // Helper to convert empty strings to undefined
      const cleanId = (id?: string) => (id && id.trim() !== '') ? id : undefined

      // Döviz seçildiğinde TRY tutarını ana tutar olarak gönder
      // TRY seçildiğinde orijinal tutarı gönder
      const isForeignCurrency = data.currency !== 'TRY' && exchangeRate && exchangeRate > 1
      const finalAmount = isForeignCurrency ? amountInTry : originalAmount
      const finalCurrency = 'TRY' // Her zaman TRY olarak kaydet

      if (isEditing && transaction) {
        const dto: UpdateTransactionDTO = {
          id: transaction.id,
          type: data.type,
          date: data.date,
          amount: finalAmount, // TRY tutarı
          currency: finalCurrency,
          exchangeRate: exchangeRate || 1,
          amountInBaseCurrency: amountInTry,
          categoryId: data.categoryId,
          title: data.title,
          description: isForeignCurrency
            ? `${data.description} (${originalAmount} ${data.currency} @ ${exchangeRate?.toFixed(2)})`
            : data.description,
          vendorCustomerId: cleanId(data.vendorCustomerId),
          projectId: cleanId(data.projectId),
          departmentId: cleanId(data.departmentId),
          paymentMethod: data.paymentMethod,
          documents: selectedFiles.length > 0 ? selectedFiles : undefined,
          notes: data.notes,
          status: 'pending',
        }
        await transactionService.updateTransaction(dto)
        toast.success(t('İşlem güncellendi'))
      } else {
        const dto: CreateTransactionDTO = {
          type: data.type,
          date: data.date,
          amount: finalAmount, // TRY tutarı
          currency: finalCurrency,
          exchangeRate: exchangeRate || 1,
          amountInBaseCurrency: amountInTry,
          categoryId: data.categoryId,
          title: data.title,
          description: isForeignCurrency
            ? `${data.description} (${originalAmount} ${data.currency} @ ${exchangeRate?.toFixed(2)})`
            : data.description,
          vendorCustomerId: cleanId(data.vendorCustomerId),
          projectId: cleanId(data.projectId),
          departmentId: cleanId(data.departmentId),
          paymentMethod: data.paymentMethod,
          documents: selectedFiles,
          notes: data.notes,
          status: 'pending',
          facilityId: selectedFacility.id,
        }
        await transactionService.createTransaction(dto)
        await queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
        toast.success(t('İşlem onaya gönderildi'))
      }
      onSuccess()
      handleClose()
    } catch (error: any) {
      toast.error(t('İşlem kaydedilirken hata oluştu') + ': ' + (error.message || t('Bilinmeyen hata')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const filteredCategories = categories.filter(
    (c) => c.type === watchType && !c.parentId
  )

  const [manageDialogOpen, setManageDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, name: string } | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  const handleDeleteVC = async () => {
    if (!deleteConfirmation || deleteInput !== t('onaylıyorum')) return

    try {
      await vendorsCustomersService.deleteVendorCustomer(deleteConfirmation.id)

      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['vendors-customers', selectedFacility?.id] })

      if (watch('vendorCustomerId') === deleteConfirmation.id) {
        setValue('vendorCustomerId', '')
      }
      setDeleteConfirmation(null)
      setDeleteInput('')
      toast.success(t('Kayıt silindi'))
    } catch (error) {
      toast.error(t('Silme işlemi başarısız'))
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>{isEditing ? t('İşlem Düzenle') : t('Yeni İşlem Oluştur')}</SheetTitle>
            <SheetDescription>
              {isEditing ? t('Finansal işlem bilgilerini güncelleyin') : t('Yeni bir finansal işlem ekleyin')}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <form className="px-6 py-4 space-y-6">
              {/* ... form content ... */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    {t('İşlem Tipi')} <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={watchType}
                    onValueChange={(value) => setValue('type', value as TransactionType)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="income" />
                      <Label htmlFor="income" className="cursor-pointer">{t('Gelir')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expense" id="expense" />
                      <Label htmlFor="expense" className="cursor-pointer">{t('Gider')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transfer" id="transfer" />
                      <Label htmlFor="transfer" className="cursor-pointer">{t('Virman')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      {t('Tarih')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      {...register('date', { required: t('Tarih gerekli') })}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">{errors.date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      {t('Tutar')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      {...register('amount', {
                        required: t('Tutar gerekli'),
                        min: { value: 0.01, message: t('Tutar 0.01 den büyük olmalı') },
                      })}
                    />
                    {errors.amount && (
                      <p className="text-sm text-destructive">{errors.amount.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">
                    {t('Para Birimi')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watchCurrency}
                    onValueChange={(value) => setValue('currency', value as Currency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY - {t('Türk Lirası')}</SelectItem>
                      <SelectItem value="USD">USD - {t('Amerikan Doları')}</SelectItem>
                      <SelectItem value="EUR">EUR - {t('Euro')}</SelectItem>
                      <SelectItem value="SAR">SAR - {t('Suudi Riyali')}</SelectItem>
                      <SelectItem value="GBP">GBP - {t('İngiliz Sterlini')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {watchCurrency !== 'TRY' && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-md text-sm border border-slate-200">
                      {isRateLoading ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          {t('Kur bilgisi alınıyor...')}
                        </div>
                      ) : exchangeRate ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>{t('Güncel Kur')}:</span>
                            <span className="font-medium">1 {watchCurrency} = {exchangeRate.toFixed(4)} TRY</span>
                          </div>
                          <div className="flex justify-between text-slate-900 font-medium pt-1 border-t border-slate-200">
                            <span>{t('TL Karşılığı')}:</span>
                            <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amountInTry)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-500">{t('Kur bilgisi alınamadı')}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">
                    {t('Kategori')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('categoryId')}
                    onValueChange={(value) => setValue('categoryId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Kategori seçin")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.length === 0 ? (
                        <div className="p-2 flex flex-col items-center gap-2">
                          <p className="text-sm text-muted-foreground text-center">{t('Kategori bulunamadı')}</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            onClick={async (e) => {
                              e.preventDefault()
                              try {
                                await categoryService.seedDefaultCategories(selectedFacility?.id)
                                toast.success(t('Varsayılan kategoriler eklendi'))
                                // Invalidate query to refetch
                                queryClient.invalidateQueries({ queryKey: ['categories', selectedFacility?.id] })
                              } catch (error) {
                                toast.error(t('Kategoriler eklenirken hata oluştu'))
                              }
                            }}
                          >
                            {t('Varsayılanları Ekle')}
                          </Button>
                        </div>
                      ) : (
                        filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    {t('Başlık')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder={t("İşlem başlığı")}
                    maxLength={255}
                    {...register('title', { required: t('Başlık gerekli') })}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('Açıklama')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t("İşlem detayları")}
                    maxLength={1000}
                    rows={3}
                    {...register('description', { required: t('Açıklama gerekli') })}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="vendorCustomerId">{t('Tedarikçi / Müşteri')}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={watch('vendorCustomerId')}
                      onValueChange={(value) => setValue('vendorCustomerId', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t("Seçiniz")} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full mb-2"
                            onClick={(e) => {
                              e.preventDefault()
                              setManageDialogOpen(true)
                              // Optional: You might want to close the select here if it doesn't close automatically
                            }}
                          >
                            + {t('Yeni')} {watchType === 'expense' ? t('Tedarikçi') : t('Müşteri')} {t('Ekle')}
                          </Button>
                        </div>
                        {/* Tüm tedarikçi ve müşterileri göster */}
                        {vendorsCustomers
                          .map((vc) => (
                            <SelectItem key={vc.id} value={vc.id}>
                              {vc.name} {vc.type === 'vendor' ? '(Tedarikçi)' : '(Müşteri)'}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">{t('Proje')}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={watch('projectId')}
                      onValueChange={(value) => setValue('projectId', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={t("Seçiniz")} />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} ({project.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        navigate('/projects?action=new')
                      }}
                      title={t("Yeni Proje Oluştur")}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentId">{t('Departman')}</Label>
                  <Select
                    value={watch('departmentId')}
                    onValueChange={(value) => setValue('departmentId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Seçiniz")} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">
                    {t('Ödeme Yöntemi')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('paymentMethod')}
                    onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t('Nakit')}</SelectItem>
                      <SelectItem value="bank_transfer">{t('Banka Transferi')}</SelectItem>
                      <SelectItem value="credit_card">{t('Kredi Kartı')}</SelectItem>
                      <SelectItem value="check">{t('Çek')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="documents">{t('Belgeler')}</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors">
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="documents" className="cursor-pointer">
                      <div className="text-sm text-muted-foreground">
                        {t('Dosya seçmek için tıklayın veya sürükleyin')}
                      </div>
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 text-sm">
                          {selectedFiles.length} {t('dosya seçildi')}
                        </div>
                      )}
                    </label>
                  </div>
                  {/* Warning removed as requested */}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('Notlar')}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t("Ek notlar (opsiyonel)")}
                    rows={3}
                    {...register('notes')}
                  />
                </div>
              </div>
            </form>
          </ScrollArea>

          <div className="px-6 py-4 border-t bg-background flex items-center justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              {t('İptal')}
            </Button>
            <div className="flex gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSaveDraft()
                  }}
                  disabled={isSubmitting}
                >
                  <FloppyDisk size={18} className="mr-2" />
                  {t('Taslak Kaydet')}
                </Button>
              )}
              <Button
                onClick={handleSubmit(handleSavePending)}
                disabled={isSubmitting}
              >
                <FloppyDisk size={18} className="mr-2" />
                {isEditing ? t('Güncelle') : t('Kaydet ve Onaya Gönder')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <VendorCustomerDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        onSave={async (data) => {
          if (!selectedFacility?.id) {
            toast.error(t('Lütfen önce bir tesis/şube seçin'))
            return
          }

          const newVC = await vendorsCustomersService.createVendorCustomer({
            ...data,
            facility_id: selectedFacility.id
          })

          // Invalidate query to refetch
          queryClient.invalidateQueries({ queryKey: ['vendors-customers', selectedFacility?.id] })
          queryClient.invalidateQueries({ queryKey: ['approval-stats'] })

          // Select the new VC
          setValue('vendorCustomerId', newVC.id)
        }}
        defaultType={watchType === 'expense' ? 'vendor' : 'customer'}
      />

      <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Silme Onayı')}</DialogTitle>
            <DialogDescription>
              "{deleteConfirmation?.name}" {t('kaydını silmek üzeresiniz. Bu işlem geri alınamaz ancak geçmiş veriler korunacaktır.')}
              <br /><br />
              {t('Devam etmek için lütfen kutucuğa')} <strong>{t('onaylıyorum')}</strong> {t('yazın.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={t("onaylıyorum")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
              {t('İptal')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVC}
              disabled={deleteInput !== t('onaylıyorum')}
            >
              {t('Sil')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
