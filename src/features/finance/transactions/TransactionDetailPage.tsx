import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { transactionService } from '@/services/finance/transactionService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  PencilSimple,
  Printer,
  Download,
  Trash,
  DotsThree,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { DocumentViewer } from '@/components/common/DocumentViewer'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalNote, setApprovalNote] = useState('')
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)

  const [localDocuments, setLocalDocuments] = useState<any[]>([])

  const { data: transaction, isLoading, refetch } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getTransactionById(id!),
    enabled: !!id,
  })

  const allDocuments = [
    ...(transaction?.documents || []),
    ...localDocuments
  ]

  // Belge isimlerini otomatik güncelle
  useEffect(() => {
    if (transaction?.documents && viewingDocument) {
      const updatedDoc = transaction.documents.find(doc => doc.id === viewingDocument.id)
      if (updatedDoc && updatedDoc.name !== viewingDocument.name) {
        setViewingDocument(updatedDoc)
      }
    }
  }, [transaction?.documents, viewingDocument])

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      transactionService.approveTransaction(id, note),
    onSuccess: () => {
      toast.success('İşlem onaylandı')
      refetch()
      setApprovalDialogOpen(false)
      setApprovalNote('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      transactionService.rejectTransaction(id, note),
    onSuccess: () => {
      toast.success('İşlem reddedildi')
      refetch()
      setApprovalDialogOpen(false)
      setApprovalNote('')
    },
  })

  const handleApprovalSubmit = () => {
    if (!id) return
    if (approvalAction === 'approve') {
      approveMutation.mutate({ id, note: approvalNote })
    } else {
      rejectMutation.mutate({ id, note: approvalNote })
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Taslak</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Beklemede</Badge>
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Onaylandı</Badge>
      case 'rejected':
        return <Badge variant="destructive">Reddedildi</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Nakit'
      case 'bank_transfer':
        return 'Banka Transferi'
      case 'credit_card':
        return 'Kredi Kartı'
      case 'check':
        return 'Çek'
      default:
        return method
    }
  }

  const normalizeTurkish = (text: string) => {
    return text
      .replace(/Ğ/g, 'G')
      .replace(/Ü/g, 'U')
      .replace(/Ş/g, 'S')
      .replace(/İ/g, 'I')
      .replace(/Ö/g, 'O')
      .replace(/Ç/g, 'C')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
  }

  const handleExportPDF = async () => {
    if (!transaction) return

    const toastId = toast.loading('PDF hazırlanıyor...')

    try {
      const doc = new jsPDF()

      let currentFont = 'helvetica'
      let useNormalization = true

      // 1. Load Font for Turkish Support
      try {
        const fontUrl = 'https://raw.githubusercontent.com/google/fonts/main/apache/roboto/Roboto-Regular.ttf'
        const fontResponse = await fetch(fontUrl)
        if (!fontResponse.ok) throw new Error('Font fetch failed')

        const fontBlob = await fontResponse.blob()
        const reader = new FileReader()

        await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const base64data = reader.result?.toString().split(',')[1]
            if (base64data) {
              doc.addFileToVFS('Roboto-Regular.ttf', base64data)
              doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
              doc.setFont('Roboto')
              currentFont = 'Roboto'
              useNormalization = false
            }
            resolve(true)
          }
          reader.onerror = reject
          reader.readAsDataURL(fontBlob)
        })
      } catch (fontError) {
        console.warn('Font loading failed, falling back to default:', fontError)
        // Fallback to standard font
        doc.setFont('helvetica')
        currentFont = 'helvetica'
        useNormalization = true
      }

      const processText = (text: string) => {
        return useNormalization ? normalizeTurkish(text) : text
      }

      // 2. Invoice Design

      const pageWidth = doc.internal.pageSize.width

      // Title
      doc.setFontSize(24)
      doc.setTextColor(0, 0, 0)
      doc.text(processText('İŞLEM DEKONTU'), 14, 20)

      // Meta Info (Right aligned)
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`${processText('Tarih')}: ${format(new Date(), 'dd.MM.yyyy')}`, pageWidth - 14, 20, { align: 'right' })
      doc.text(`${processText('İşlem No')}: ${transaction.code}`, pageWidth - 14, 25, { align: 'right' })

      // Divider
      doc.setDrawColor(200, 200, 200)
      doc.line(14, 35, pageWidth - 14, 35)

      // Transaction Summary Section
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.setFont(currentFont, 'bold')
      doc.text(processText('İşlem Özeti'), 14, 45)

      doc.setFont(currentFont, 'normal')
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)

      // Left Column
      const typeLabel = transaction.type === 'income' ? 'Gelir' : transaction.type === 'expense' ? 'Gider' : 'Virman'
      const statusLabel = transaction.status === 'approved' ? 'Onaylandı' : transaction.status === 'pending' ? 'Beklemede' : transaction.status === 'rejected' ? 'Reddedildi' : 'Taslak'

      doc.text(`${processText('Tip')}: ${processText(typeLabel)}`, 14, 55)
      doc.text(`${processText('Kategori')}: ${processText(transaction.categoryName || '-')}`, 14, 62)
      doc.text(`${processText('Durum')}: ${processText(statusLabel)}`, 14, 69)

      // Right Column
      doc.text(`${processText('Tedarikçi/Müşteri')}: ${processText(transaction.vendorCustomerName || '-')}`, pageWidth / 2, 55)
      doc.text(`${processText('Proje')}: ${processText(transaction.projectName || '-')}`, pageWidth / 2, 62)
      doc.text(`${processText('Departman')}: ${processText(transaction.departmentName || '-')}`, pageWidth / 2, 69)

      // Main Content Table
      const tableBody = [
        [
          processText(transaction.description || ''),
          processText(transaction.categoryName || ''),
          formatCurrency(transaction.amount, transaction.currency)
        ]
      ]

      autoTable(doc, {
        startY: 80,
        head: [[processText('Açıklama'), processText('Kategori'), processText('Tutar')]],
        body: tableBody,
        theme: 'plain',
        styles: {
          font: currentFont,
          fontSize: 10,
          cellPadding: 8,
          lineColor: [220, 220, 220],
          lineWidth: { bottom: 0.1 }
        },
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: { bottom: 0.5, top: 0.5 }
        },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Description
          1: { cellWidth: 50 },     // Category
          2: { cellWidth: 40, halign: 'right' } // Amount
        }
      })

      // Total Section
      const finalY = (doc as any).lastAutoTable.finalY + 10

      doc.setFontSize(12)
      doc.setFont(currentFont, 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(`${processText('Toplam Tutar')}:`, pageWidth - 60, finalY)
      doc.text(`${formatCurrency(transaction.amount, transaction.currency)}`, pageWidth - 14, finalY, { align: 'right' })

      // Footer Notes
      doc.setFontSize(8)
      doc.setFont(currentFont, 'normal')
      doc.setTextColor(150, 150, 150)
      doc.text(processText('Bu belge elektronik ortamda oluşturulmuştur.'), 14, finalY + 15)

      // Footer
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text(`${processText('Sayfa')} ${i} / ${pageCount}`, 105, 290, { align: 'center' })
      }

      // Generate filename
      const filename = `islem-${transaction.code}.pdf`

      // Create Blob URL for immediate preview/download
      const pdfBlob = doc.output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)

      // Add to local documents immediately
      const newDoc = {
        id: `local-${Date.now()}`,
        name: filename,
        size: pdfBlob.size,
        type: 'application/pdf',
        url: blobUrl,
        uploadedAt: new Date().toISOString(),
        isLocal: true
      }

      setLocalDocuments(prev => [...prev, newDoc])
      toast.success('PDF oluşturuldu', { id: toastId })

      // 4. Upload to Supabase (Background)
      try {
        const existingDoc = transaction.documents?.find(d => d.name === filename)

        if (!existingDoc) {
          toast.loading('PDF sisteme kaydediliyor...', { id: 'pdf-upload' })

          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

          // Use updateTransaction directly which handles upload
          await transactionService.updateTransaction({
            id: transaction.id,
            documents: [pdfFile]
          })

          toast.success('PDF sisteme kaydedildi', { id: 'pdf-upload' })
          refetch()
          // Remove from local docs after successful upload/refetch to avoid duplicates
          // But keeping it is safer for immediate UX until refetch completes
        } else {
          toast.success('Belge zaten sistemde mevcut', { id: 'pdf-upload' })
        }
      } catch (uploadError: any) {
        console.error('PDF upload error:', uploadError)
        toast.error(`PDF sisteme kaydedilemedi: ${uploadError.message || 'Bilinmeyen hata'}`, { id: 'pdf-upload', duration: 5000 })
        // Even if upload fails, the local doc remains visible
      }

    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('PDF oluşturulurken hata oluştu', { id: toastId })
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">İşlem bulunamadı</p>
          <Button onClick={() => navigate('/finance/transactions')} className="mt-4">
            <ArrowLeft size={16} className="mr-2" />
            İşlemlere Dön
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/finance/transactions')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{transaction.code}</h1>
              {getStatusBadge(transaction.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(transaction.date), 'dd MMMM yyyy, EEEE', { locale: tr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {transaction.status === 'draft' && !transaction.description?.startsWith('Genel Merkez Bütçe Aktarımı') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const event = new CustomEvent('edit-transaction', { detail: transaction })
                window.dispatchEvent(event)
                navigate('/finance/transactions')
              }}
            >
              <PencilSimple size={16} className="mr-2" />
              Düzenle
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const printWindow = window.open('', '_blank')
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head><title>İşlem Detayı - ${transaction.code}</title></head>
                    <body style="font-family: Arial, sans-serif; padding: 20px;">
                      <h1>İşlem Detayı</h1>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Kod:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.code}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tarih:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${format(new Date(transaction.date), 'dd MMMM yyyy', { locale: tr })}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tip:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.type === 'income' ? 'Gelir' : transaction.type === 'expense' ? 'Gider' : 'Virman'}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tutar:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(transaction.amount, transaction.currency)}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Kategori:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.categoryName}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Durum:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.status === 'approved' ? 'Onaylandı' : transaction.status === 'pending' ? 'Beklemede' : transaction.status === 'rejected' ? 'Reddedildi' : 'Taslak'}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Açıklama:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.description}</td></tr>
                        ${transaction.vendorCustomerName ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Tedarikçi/Müşteri:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.vendorCustomerName}</td></tr>` : ''}
                        ${transaction.projectName ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Proje:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.projectName}</td></tr>` : ''}
                        ${transaction.departmentName ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Departman:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${transaction.departmentName}</td></tr>` : ''}
                      </table>
                      <script>window.print();</script>
                    </body>
                  </html>
                `)
                printWindow.document.close()
              }
            }}
          >
            <Printer size={16} className="mr-2" />
            Yazdır
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportPDF}
          >
            <Download size={16} className="mr-2" />
            Dışa Aktar (PDF)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>İşlem Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tip</div>
                  <Badge
                    className={cn(
                      transaction.type === 'income' && 'bg-green-500 hover:bg-green-600',
                      transaction.type === 'expense' && 'bg-red-500 hover:bg-red-600',
                      transaction.type === 'transfer' && 'bg-blue-500 hover:bg-blue-600'
                    )}
                  >
                    {transaction.type === 'income' && 'Gelir'}
                    {transaction.type === 'expense' && 'Gider'}
                    {transaction.type === 'transfer' && 'Virman'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tarih</div>
                  <div className="font-medium">
                    {format(new Date(transaction.date), 'dd MMM yyyy', { locale: tr })}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Tutar</div>
                <div
                  className={cn(
                    'text-3xl font-bold',
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </div>
                {transaction.currency !== 'TRY' && (
                  <div className="text-sm text-muted-foreground">
                    Kur: {transaction.exchangeRate ? transaction.exchangeRate.toFixed(4) : '-'} • Ana Para Birimi:{' '}
                    {transaction.amountInBaseCurrency
                      ? formatCurrency(transaction.amountInBaseCurrency, 'TRY')
                      : '-'}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Kategori</div>
                  <Badge variant="outline">{transaction.categoryName}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Ödeme Yöntemi</div>
                  <div className="font-medium">{getPaymentMethodLabel(transaction.paymentMethod)}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Başlık</div>
                <div className="font-medium">{transaction.title}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">Açıklama</div>
                <div className="text-sm">{transaction.description}</div>
              </div>

              {transaction.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Notlar</div>
                  <div className="text-sm">{transaction.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>İlgili Taraflar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tedarikçi / Müşteri</div>
                  <div className="font-medium">{transaction.vendorCustomerName || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Proje</div>
                  <div className="font-medium">{transaction.projectName || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Departman</div>
                  <div className="font-medium">{transaction.departmentName || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {transaction.approvalSteps && transaction.approvalSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Onay Durumu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {transaction.approvalSteps.filter(step => step && step.id).map((step, index) => (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            step.status === 'approved' && 'bg-green-100 text-green-600',
                            step.status === 'rejected' && 'bg-red-100 text-red-600',
                            step.status === 'pending' && 'bg-yellow-100 text-yellow-600'
                          )}
                        >
                          {step.status === 'approved' && <CheckCircle size={20} weight="fill" />}
                          {step.status === 'rejected' && <XCircle size={20} weight="fill" />}
                          {step.status === 'pending' && <span>{index + 1}</span>}
                        </div>
                        {index < transaction.approvalSteps!.length - 1 && (
                          <div className="w-0.5 h-12 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium">{step.stepName}</div>
                        <div className="text-sm text-muted-foreground">{step.approverName}</div>
                        <div className="text-xs text-muted-foreground">{step.approverRole}</div>
                        {step.date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(step.date), 'dd MMM yyyy HH:mm', { locale: tr })}
                          </div>
                        )}
                        {step.note && (
                          <div className="text-sm mt-2 p-2 bg-muted rounded">{step.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {transaction.status === 'pending' && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setApprovalAction('approve')
                          setApprovalDialogOpen(true)
                        }}
                      >
                        <CheckCircle size={18} className="mr-2" />
                        Onayla
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          setApprovalAction('reject')
                          setApprovalDialogOpen(true)
                        }}
                      >
                        <XCircle size={18} className="mr-2" />
                        Reddet
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}



          {transaction.activityLog && transaction.activityLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aktivite Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transaction.activityLog.map((log, index) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {index < transaction.activityLog!.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border min-h-[2rem]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="text-sm font-medium">{log.action}</div>
                        <div className="text-xs text-muted-foreground">{log.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.date), 'dd MMM yyyy HH:mm', { locale: tr })}
                        </div>
                        {log.details && (
                          <div className="text-xs text-muted-foreground mt-1">{log.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'İşlemi Onayla' : 'İşlemi Reddet'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? 'Bu işlemi onaylamak istediğinizden emin misiniz?'
                : 'Bu işlemi reddetmek istediğinizden emin misiniz?'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="note">Not</Label>
            <Textarea
              id="note"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Açıklama ekleyin (opsiyonel)"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={handleApprovalSubmit}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approvalAction === 'approve' ? 'Onayla' : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentViewer
        open={documentViewerOpen}
        onOpenChange={setDocumentViewerOpen}
        document={viewingDocument}
      />
    </div>
  )
}
