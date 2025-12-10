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
  CurrencyDollar,
  Receipt,
  ArrowDown,
  ArrowUp,
  MagnifyingGlass,
  FunnelSimple,
  Download,
  FileArrowDown,
  Buildings,
} from '@phosphor-icons/react'
import { facilityService } from '@/services/facilityService'
import { transactionService } from '@/services/finance/transactionService'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function HeadquartersFinancePage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('approved')
  const [activeView, setActiveView] = useState<'transactions' | 'summary' | 'analytics'>('transactions')

  if (selectedFacility?.type !== 'headquarters') {
    return null
  }

  const { data: branches = [] } = useQuery({
    queryKey: ['facilities', 'branches'],
    queryFn: () => facilityService.getBranches(),
  })

  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['headquarters', 'transactions', selectedBranchId],
    queryFn: async () => {
      if (selectedBranchId === 'all') {
        const results = await Promise.all(
          branches.map(branch =>
            transactionService.getAllTransactions({ facilityId: branch.id }).catch(() => [])
          )
        )
        return results.flat().map((t, index) => ({
          ...t,
          branchId: branches[Math.floor(index / (results[0]?.length || 1))]?.id,
          branchName: branches[Math.floor(index / (results[0]?.length || 1))]?.name,
        }))
      } else {
        const transactions = await transactionService.getAllTransactions({ facilityId: selectedBranchId })
        const branch = branches.find(b => b.id === selectedBranchId)
        return transactions.map(t => ({
          ...t,
          branchId: selectedBranchId,
          branchName: branch?.name,
        }))
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

  // Güvenli tarih formatlama
  const safeFormatDate = (dateStr: string | null | undefined, formatStr: string = 'dd.MM.yyyy') => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '-'
      return format(date, formatStr, { locale: tr })
    } catch {
      return '-'
    }
  }

  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch =
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t as any).branchName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === 'all' || t.type === filterType
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // İstatistikler - SADECE onaylandı işlemler
  const approvedTransactions = filteredTransactions.filter(t => t.status === 'approved')

  const totalIncome = approvedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amountInBaseCurrency || 0), 0)

  const totalExpense = approvedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amountInBaseCurrency || 0), 0)

  const netIncome = totalIncome - totalExpense

  // Şube bazlı istatistikler - SADECE onaylandı işlemler
  const branchStats = branches.map(branch => {
    const branchTransactions = allTransactions.filter(t =>
      (t as any).branchId === branch.id && t.status === 'approved'
    )
    const income = branchTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amountInBaseCurrency || 0), 0)
    const expense = branchTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amountInBaseCurrency || 0), 0)

    return {
      name: branch.name.replace(' Şubesi', ''),
      gelir: income,
      gider: expense,
      net: income - expense,
    }
  })

  // Kategori bazlı harcamalar - SADECE onaylandı işlemler
  const categoryExpenses = approvedTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.categoryName || 'Diğer'
      acc[category] = (acc[category] || 0) + (t.amountInBaseCurrency || 0)
      return acc
    }, {} as Record<string, number>)

  const categoryChartData = Object.entries(categoryExpenses)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const handleExportExcel = () => {
    const data = filteredTransactions.map(t => ({
      'Şube': (t as any).branchName || '-',
      'Kod': t.code || '-',
      'Açıklama': t.description || '-',
      'Tip': t.type === 'income' ? 'Gelir' : 'Gider',
      'Kategori': t.categoryName || '-',
      'Tutar': t.amountInBaseCurrency || 0,
      'Para Birimi': t.currency || 'TRY',
      'Tarih': safeFormatDate(t.date),
      'Durum': t.status === 'approved' ? 'Onaylandı' : t.status === 'pending' ? 'Bekliyor' : 'Reddedildi',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'İşlemler')
    XLSX.writeFile(wb, `genel_merkez_finans_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    toast.success('Excel dosyası indirildi')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Genel Merkez - Finansal İşlemler Raporu', 14, 22)

    const data = filteredTransactions.map(t => [
      (t as any).branchName || '-',
      t.code || '-',
      t.description?.substring(0, 30) || '-',
      t.type === 'income' ? 'Gelir' : 'Gider',
      formatCurrency(t.amountInBaseCurrency || 0),
      safeFormatDate(t.date),
    ])

    autoTable(doc, {
      startY: 30,
      head: [['Şube', 'Kod', 'Açıklama', 'Tip', 'Tutar', 'Tarih']],
      body: data,
      theme: 'grid',
    })

    doc.save(`genel_merkez_finans_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    toast.success('PDF dosyası indirildi')
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Genel Merkez - Finans Yönetimi</h1>
            <p className="text-muted-foreground mt-1">
              Tüm şubelerin finansal işlemlerini görüntüleyin ve yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} className="gap-2">
              <FileArrowDown size={16} />
              Excel İndir
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="gap-2">
              <Download size={16} />
              PDF İndir
            </Button>
          </div>
        </div>
      </div>

      {/* Özet İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Gelir</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <ArrowUp size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toplam Gider</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <ArrowDown size={24} className="text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Gelir</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(netIncome)}
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
                <p className="text-sm text-muted-foreground mb-1">Toplam İşlem</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
              <Receipt size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">İşlemler</TabsTrigger>
          <TabsTrigger value="summary">Özet</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Finansal İşlemler</CardTitle>
              <CardDescription>
                Tüm şubelerin finansal işlemlerini görüntüleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Şube Seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şubeler</SelectItem>
                    {branches.filter(branch => branch.id).map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1 relative">
                  <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="İşlem ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Tipler</SelectItem>
                    <SelectItem value="income">Gelir</SelectItem>
                    <SelectItem value="expense">Gider</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="approved">Onaylandı</SelectItem>
                    <SelectItem value="pending">Bekliyor</SelectItem>
                    <SelectItem value="rejected">Reddedildi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                        <TableHead>Kod</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Tutar</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            İşlem bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Buildings size={16} className="text-muted-foreground" />
                                <span className="font-medium">
                                  {(transaction as any).branchName || '-'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {transaction.code}
                              </code>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {transaction.description}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={transaction.type === 'income' ? 'default' : 'secondary'}
                                className={
                                  transaction.type === 'income'
                                    ? 'bg-green-500/10 text-green-700 border-green-200'
                                    : 'bg-red-500/10 text-red-700 border-red-200'
                                }
                              >
                                {transaction.type === 'income' ? 'Gelir' : 'Gider'}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.categoryName || '-'}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(transaction.amountInBaseCurrency || 0)}
                            </TableCell>
                            <TableCell>
                              {safeFormatDate(transaction.date, 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  transaction.status === 'approved'
                                    ? 'default'
                                    : transaction.status === 'pending'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {transaction.status === 'approved'
                                  ? 'Onaylandı'
                                  : transaction.status === 'pending'
                                    ? 'Bekliyor'
                                    : 'Reddedildi'}
                              </Badge>
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
        </TabsContent>

        <TabsContent value="summary" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Şube Bazlı Özet</CardTitle>
              <CardDescription>
                Her şubenin finansal performans özeti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Şube</TableHead>
                      <TableHead>Gelir</TableHead>
                      <TableHead>Gider</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>İşlem Sayısı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {formatCurrency(stat.gelir)}
                        </TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(stat.gider)}
                        </TableCell>
                        <TableCell
                          className={`font-bold ${stat.net >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          {formatCurrency(stat.net)}
                        </TableCell>
                        <TableCell>
                          {allTransactions.filter(t => (t as any).branchName === stat.name + ' Şubesi').length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Şube Finansal Karşılaştırması</CardTitle>
                <CardDescription>Gelir, gider ve net karşılaştırması</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="gelir" fill="#10b981" name="Gelir" />
                    <Bar dataKey="gider" fill="#ef4444" name="Gider" />
                    <Bar dataKey="net" fill="#3b82f6" name="Net" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Bazlı Harcamalar</CardTitle>
                <CardDescription>En çok harcama yapılan kategoriler</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

