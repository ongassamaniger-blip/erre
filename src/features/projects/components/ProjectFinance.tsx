import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CurrencyDollar,
  Plus,
  TrendUp,
  TrendDown,
  Receipt,
  ArrowUp,
  ArrowDown,
  FunnelSimple,
  Download,
  Eye
} from '@phosphor-icons/react'
import { projectFinanceService, type ProjectTransaction } from '@/services/projects/projectFinanceService'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { cn } from '@/lib/utils'
import { EntitySelector } from '@/components/common/EntitySelector'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FilterPopover } from './FilterPopover'

interface ProjectFinanceProps {
  projectId: string
  projectBudget: number
  projectSpent: number
  currency: string
  isCompleted?: boolean
}

const statusLabels: Record<ProjectTransaction['status'], string> = {
  draft: 'Taslak',
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
}

const statusColors: Record<ProjectTransaction['status'], string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

function TransactionDialog({
  open,
  onOpenChange,
  projectId,
  transaction,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  transaction?: ProjectTransaction
  onSave: (data: Partial<ProjectTransaction>) => Promise<void>
}) {
  const [formData, setFormData] = useState<Partial<ProjectTransaction>>({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    amount: 0,
    currency: 'TRY',
    category: '',
    description: '',
    vendorCustomerName: '',
    vendorCustomerId: '',
    status: 'draft',
  })

  // Update form data when transaction prop changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        ...transaction,
        date: transaction.date.split('T')[0], // Ensure date format YYYY-MM-DD
      })
    } else {
      // Reset form for new transaction
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        amount: 0,
        currency: 'TRY',
        category: '',
        description: '',
        vendorCustomerName: '',
        vendorCustomerId: '',
        status: 'draft',
      })
    }
  }, [transaction, open])

  const isEditing = !!transaction

  const handleSubmit = async () => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Tutar 0\'dan büyük olmalıdır')
      return
    }
    if (!formData.category) {
      toast.error('Kategori seçiniz')
      return
    }
    if (!formData.description) {
      toast.error('Açıklama giriniz')
      return
    }

    try {
      await onSave(formData)
      toast.success(isEditing ? 'Güncellendi' : 'Oluşturuldu')
      onOpenChange(false)
    } catch (error) {
      toast.error('Bir hata oluştu')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'İşlem Düzenle' : 'Yeni İşlem'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Proje işlemini güncelleyin' : 'Proje için yeni finansal işlem ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tip *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Gelir</SelectItem>
                  <SelectItem value="expense">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={formData.category || ''}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Malzeme">Malzeme</SelectItem>
                  <SelectItem value="İşçilik">İşçilik</SelectItem>
                  <SelectItem value="Ekipman">Ekipman</SelectItem>
                  <SelectItem value="Danışmanlık">Danışmanlık</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="İşlem açıklaması"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Tedarikçi/Müşteri</Label>
            <EntitySelector
              value={formData.vendorCustomerName}
              onChange={(name, id) => setFormData({
                ...formData,
                vendorCustomerName: name,
                vendorCustomerId: id
              })}
              type={formData.type === 'income' ? 'customer' : 'vendor'}
              placeholder={formData.type === 'income' ? 'Müşteri seçin' : 'Tedarikçi seçin'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value: ProjectTransaction['status']) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
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

export function ProjectFinance({ projectId, projectBudget, projectSpent, currency, isCompleted }: ProjectFinanceProps) {
  const [filters, setFilters] = useState<{
    type?: 'income' | 'expense'
    dateFrom?: string
    dateTo?: string
    category?: string
    status?: string
  }>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<ProjectTransaction | undefined>()

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['project-finance-summary', projectId, projectBudget],
    queryFn: () => projectFinanceService.getProjectFinancialSummary(projectId, projectBudget),
  })

  const { data: transactions, isLoading: transactionsLoading, refetch } = useQuery({
    queryKey: ['project-transactions', projectId, filters],
    queryFn: () => projectFinanceService.getProjectTransactions(projectId, filters),
  })

  // Realtime subscription for transactions list
  useRealtimeSubscription({
    table: 'transactions',
    queryKey: ['project-transactions', projectId],
    filter: `project_id=eq.${projectId}`,
  })

  // Realtime subscription for summary (chart)
  useRealtimeSubscription({
    table: 'transactions',
    queryKey: ['project-finance-summary', projectId],
    filter: `project_id=eq.${projectId}`,
  })

  const handleCreate = () => {
    setEditingTransaction(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (transaction: ProjectTransaction) => {
    setEditingTransaction(transaction)
    setDialogOpen(true)
  }

  const handleSave = async (data: Partial<ProjectTransaction>) => {
    if (editingTransaction) {
      await projectFinanceService.updateProjectTransaction(editingTransaction.id, data)
    } else {
      await projectFinanceService.createProjectTransaction(projectId, data)
    }
    refetch()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleDownloadPdf = (transaction: ProjectTransaction) => {
    const doc = new jsPDF()

    // Add Turkish font support
    doc.addFont("https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    // Title
    doc.setFontSize(18)
    doc.text('Finansal İşlem Detayı', 14, 22)

    // Transaction Details Table
    autoTable(doc, {
      startY: 30,
      head: [['Alan', 'Değer']],
      body: [
        ['Tarih', format(new Date(transaction.date), 'dd MMMM yyyy', { locale: tr })],
        ['Tip', transaction.type === 'income' ? 'Gelir' : 'Gider'],
        ['Kategori', transaction.category],
        ['Tedarikçi/Müşteri', transaction.vendorCustomerName || '-'],
        ['Açıklama', transaction.description],
        ['Tutar', `${formatCurrency(transaction.amount)}`],
        ['Durum', statusLabels[transaction.status]],
        ['Oluşturan', transaction.createdBy || '-'],
      ],
      theme: 'grid',
      styles: {
        font: 'Roboto', // Use the custom font
        fontSize: 10
      },
      headStyles: { fillColor: [41, 128, 185] },
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 40
    doc.setFontSize(10)
    doc.text(`Oluşturulma Tarihi: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, finalY + 10)

    doc.save(`islem_${transaction.id.slice(0, 8)}.pdf`)
  }

  const budgetUtilization = projectBudget > 0 ? (projectSpent / projectBudget) * 100 : 0
  const remainingBudget = projectBudget - projectSpent

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Bütçe</p>
                <p className="text-2xl font-bold">{formatCurrency(projectBudget)}</p>
              </div>
              <CurrencyDollar size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Harcanan</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(projectSpent)}</p>
              </div>
              <TrendDown size={24} className="text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kalan Bütçe</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(remainingBudget)}</p>
              </div>
              <TrendUp size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bütçe Kullanımı</p>
                <p className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</p>
              </div>
              <Receipt size={24} className="text-muted-foreground" />
            </div>
            <Progress value={budgetUtilization} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {summaryLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : summary && (
        <>
          {/* Finansal Özet */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gelir-Gider Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUp size={20} className="text-green-600" />
                      <span className="text-sm text-muted-foreground">Toplam Gelir</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(summary.totalIncome)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDown size={20} className="text-red-600" />
                      <span className="text-sm text-muted-foreground">Toplam Gider</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(summary.totalExpense)}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="font-semibold">Net Tutar</span>
                    <span className={cn(
                      "text-lg font-bold",
                      summary.netAmount >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(summary.netAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Bazlı Harcamalar</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Kategori verisi bulunamadı
                  </p>
                ) : (
                  <div className="space-y-3">
                    {summary.byCategory.map((cat, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{cat.category}</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(cat.spent)} / {formatCurrency(cat.budgeted || cat.spent)}
                          </span>
                        </div>
                        <Progress
                          value={cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aylık Trend Grafiği */}
          {summary.monthlyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aylık Finansal Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={summary.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(value) => format(new Date(value + '-01'), 'MMM', { locale: tr })}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                                    {label ? format(new Date(label + '-01'), 'MMMM yyyy', { locale: tr }) : ''}
                                  </span>
                                  <span className="font-bold text-muted-foreground">
                                    {payload[0]?.payload?.month}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[0.70rem] uppercase text-green-600 font-bold">Gelir</span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(payload[0]?.value as number)}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[0.70rem] uppercase text-red-600 font-bold">Gider</span>
                                  <span className="font-bold text-red-600">
                                    {formatCurrency(payload[1]?.value as number)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="income"
                      name="Gelir"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="expense"
                      name="Gider"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* İşlemler Listesi */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Finansal İşlemler</CardTitle>
            <div className="flex items-center gap-2">
              <FilterPopover filters={filters} onFilterChange={setFilters} />
              <Button onClick={handleCreate} size="sm" disabled={isCompleted}>
                <Plus size={16} className="mr-2" />
                Yeni İşlem
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tedarikçi/Müşteri</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        İşlem bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions?.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.date), 'dd MMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                            {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.vendorCustomerName || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell className={cn(
                          "font-medium",
                          transaction.type === 'income' ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[transaction.status]}>
                            {statusLabels[transaction.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPdf(transaction)}
                            >
                              <Download size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        transaction={editingTransaction}
        onSave={handleSave}
      />
    </div>
  )
}
