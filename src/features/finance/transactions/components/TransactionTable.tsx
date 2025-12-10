import { Transaction } from '@/types/finance'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DocumentViewer } from '@/components/common/DocumentViewer'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DotsThree, Eye, PencilSimple, Trash, Printer, FileText, CheckCircle, XCircle, MicrosoftExcelLogo } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { transactionService } from '@/services/finance/transactionService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { exportTransactionsToExcel } from '@/utils/excelExport'
import { useCurrency } from '@/hooks/useCurrency'
import { useTranslation } from '@/hooks/useTranslation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

interface TransactionTableProps {
  data: Transaction[]
  total: number
  page: number
  pageSize: number
  isLoading: boolean
  onPageChange: (page: number) => void
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onRefresh: () => void
}

export function TransactionTable({
  data,
  total,
  page,
  pageSize,
  isLoading,
  onPageChange,
  selectedIds,
  onSelectionChange,
  onRefresh,
}: TransactionTableProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const totalPages = Math.ceil(total / pageSize)
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false)
  const { format: formatCurrency } = useCurrency()

  // Helper to invalidate dashboard queries when transactions change
  const invalidateDashboardQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', selectedFacility?.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-chart-data', selectedFacility?.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tx', selectedFacility?.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-payments', selectedFacility?.id] })
  }

  const isBudgetTransfer = (transaction: Transaction) => {
    return transaction.categoryName === 'Genel Merkez Bütçe Aktarımı' ||
      transaction.description?.startsWith('Genel Merkez Bütçe Aktarımı')
  }

  const handleSelectAll = () => {
    const selectableData = data.filter(t => !isBudgetTransfer(t))
    if (selectedIds.length === selectableData.length && selectableData.length > 0) {
      onSelectionChange([])
    } else {
      onSelectionChange(selectableData.map((t) => t.id))
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const handleBulkApprove = async () => {
    try {
      await transactionService.bulkApprove(selectedIds)
      toast.success(`${selectedIds.length} ${t('işlem onaylandı')}`)
      onSelectionChange([])
      onRefresh()
      invalidateDashboardQueries()
    } catch (error) {
      toast.error(t('İşlemler onaylanırken hata oluştu'))
    }
  }

  const handleBulkReject = async () => {
    try {
      await transactionService.bulkReject(selectedIds)
      toast.success(`${selectedIds.length} ${t('işlem reddedildi')}`)
      onSelectionChange([])
      onRefresh()
      invalidateDashboardQueries()
    } catch (error) {
      toast.error(t('İşlemler reddedilirken hata oluştu'))
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedIds.length} ${t('işlemi silmek istediğinizden emin misiniz?')}`)) {
      return
    }
    try {
      await transactionService.bulkDelete(selectedIds)
      toast.success(`${selectedIds.length} ${t('işlem silindi')}`)
      onSelectionChange([])
      onRefresh()
      invalidateDashboardQueries()
    } catch (error) {
      toast.error(t('İşlemler silinirken hata oluştu'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('Bu işlemi silmek istediğinizden emin misiniz?'))) {
      return
    }
    try {
      await transactionService.deleteTransaction(id)
      toast.success(t('İşlem silindi'))
      onRefresh()
      invalidateDashboardQueries()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(t('İşlem silinirken hata oluştu') + ': ' + (error.message || ''))
    }
  }

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">{t('Taslak')}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t('Beklemede')}</Badge>
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">{t('Onaylandı')}</Badge>
      case 'rejected':
        return <Badge variant="destructive">{t('Reddedildi')}</Badge>
    }
  }

  const getTypeBadge = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return <Badge className="bg-green-500 hover:bg-green-600">{t('Gelir')}</Badge>
      case 'expense':
        return <Badge variant="destructive">{t('Gider')}</Badge>
      case 'transfer':
        return <Badge variant="secondary">{t('Virman')}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(pageSize)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.length} {t('işlem seçildi')}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleBulkApprove}>
                  <CheckCircle size={16} className="mr-2" />
                  {t('Toplu Onayla')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkReject}>
                  <XCircle size={16} className="mr-2" />
                  {t('Toplu Reddet')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash size={16} className="mr-2" />
                  {t('Toplu Sil')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (selectedIds.length === 0) {
                      toast.error(t('Lütfen en az bir işlem seçin'))
                      return
                    }
                    try {
                      toast.loading(t('Seçili işlemler yükleniyor...'), { id: 'excel-export-selected' })
                      // Seçili ID'lere göre tüm işlemleri servisten çek
                      const selectedTransactions = await transactionService.getTransactionsByIds(selectedIds)

                      if (selectedTransactions.length === 0) {
                        toast.error(t('Seçili işlemler bulunamadı'), { id: 'excel-export-selected' })
                        return
                      }

                      exportTransactionsToExcel(selectedTransactions, {
                        filename: `islemler-secili-${format(new Date(), 'yyyy-MM-dd-HHmm', { locale: tr })}.xlsx`,
                        sheetName: t('Seçili İşlemler'),
                      })
                      toast.success(`${selectedTransactions.length} ${t("işlem Excel'e aktarıldı")}`, { id: 'excel-export-selected' })
                    } catch (error) {
                      toast.error(t('Excel dosyası oluşturulurken hata oluştu'), { id: 'excel-export-selected' })
                    }
                  }}
                >
                  <MicrosoftExcelLogo size={16} className="mr-2" />
                  {t("Excel'e Aktar")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === data.length && data.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>{t('Tarih')}</TableHead>
              <TableHead>{t('İşlem Kodu')}</TableHead>
              <TableHead>{t('Açıklama')}</TableHead>
              <TableHead>{t('Kategori')}</TableHead>
              <TableHead>{t('Tedarikçi/Müşteri')}</TableHead>
              <TableHead className="text-right">{t('Tutar')}</TableHead>
              <TableHead>{t('Durum')}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  {t('İşlem bulunamadı')}
                </TableCell>
              </TableRow>
            ) : (
              data.filter(transaction => transaction?.id).map((transaction) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelectOne(transaction.id)}
                      disabled={isBudgetTransfer(transaction)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {format(new Date(transaction.date), 'dd MMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/finance/transactions/${transaction.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {transaction.code}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{ borderColor: transaction.categoryName ? '#e5e7eb' : undefined }}
                    >
                      {transaction.categoryName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {transaction.vendorCustomerName || '-'}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-semibold',
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <DotsThree size={20} weight="bold" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/finance/transactions/${transaction.id}`}>
                            <Eye size={16} className="mr-2" />
                            {t('Görüntüle')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const event = new CustomEvent('edit-transaction', { detail: transaction })
                            window.dispatchEvent(event)
                          }}
                        >
                          <PencilSimple size={16} className="mr-2" />
                          {t('Düzenle')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            const printWindow = window.open('', '_blank')
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head><title>${t('İşlem Detayı')} - ${transaction.code}</title></head>
                                  <body>
                                    <h1>${t('İşlem Detayı')}</h1>
                                    <p><strong>${t('Kod')}:</strong> ${transaction.code}</p>
                                    <p><strong>${t('Tarih')}:</strong> ${format(new Date(transaction.date), 'dd MMMM yyyy', { locale: tr })}</p>
                                    <p><strong>${t('Tip')}:</strong> ${transaction.type === 'income' ? t('Gelir') : transaction.type === 'expense' ? t('Gider') : t('Virman')}</p>
                                    <p><strong>${t('Tutar')}:</strong> ${formatCurrency(transaction.amount)}</p>
                                    <p><strong>${t('Kategori')}:</strong> ${transaction.categoryName}</p>
                                    <p><strong>${t('Durum')}:</strong> ${transaction.status === 'approved' ? t('Onaylandı') : transaction.status === 'pending' ? t('Beklemede') : transaction.status === 'rejected' ? t('Reddedildi') : t('Taslak')}</p>
                                    <p><strong>${t('Açıklama')}:</strong> ${transaction.description}</p>
                                    <script>window.print();</script>
                                  </body>
                                </html>
                              `)
                              printWindow.document.close()
                            }
                          }}
                        >
                          <Printer size={16} className="mr-2" />
                          {t('Yazdır')}
                        </DropdownMenuItem>
                        {transaction.documents && transaction.documents.length > 0 ? (
                          <DropdownMenuItem
                            onClick={() => {
                              if (transaction.documents && transaction.documents.length > 0) {
                                setViewingDocument(transaction.documents[0])
                                setDocumentViewerOpen(true)
                              }
                            }}
                          >
                            <FileText size={16} className="mr-2" />
                            {t('Belgeleri Gör')} ({transaction.documents.length})
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <FileText size={16} className="mr-2" />
                            {t('Belgeleri Gör')}
                          </DropdownMenuItem>
                        )}
                        {/* Silme mekanizması kaldırıldı */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            {total} {t('işlemden')} {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} {t('arası gösteriliyor')}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              {t('Önceki')}
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i + 1}
                variant={page === i + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(i + 1)}
                className="w-8"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              {t('Sonraki')}
            </Button>
          </div>
        </div>
      )}

      <DocumentViewer
        open={documentViewerOpen}
        onOpenChange={setDocumentViewerOpen}
        document={viewingDocument}
      />
    </div>
  )
}
