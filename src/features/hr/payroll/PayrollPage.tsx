import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { PageBreadcrumb } from '@/components/common/PageBreadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Wallet,
  Plus,
  Eye,
  Download,
  CheckCircle,
  Clock,
  FileText,
  UserCircle,
  Pencil,
  Check,
  Signature,
  Printer,
  ArrowsClockwise,
  CheckSquare,
  Square,
  Kanban,
  ListBullets,
  FileXls,
  CaretLeft,
  CaretRight,
  X
} from '@phosphor-icons/react'
import * as XLSX from 'xlsx'

import { payrollService, type PayrollRecord, type PayrollFilters } from '@/services/payrollService'
import { employeeService } from '@/services/employeeService'
import { departmentService } from '@/services/departmentService'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { printPayroll } from '@/utils/printPayroll'
import { exportPayrollToPDF } from '@/utils/exportPayrollToPDF'

const statusLabels: Record<PayrollRecord['status'], string> = {
  draft: 'Taslak',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  cancelled: 'İptal Edildi',
}

const statusColors: Record<PayrollRecord['status'], string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusColumns: { id: PayrollRecord['status']; label: string; color: string }[] = [
  { id: 'draft', label: 'Taslak', color: 'bg-gray-500' },
  { id: 'approved', label: 'Onaylandı', color: 'bg-blue-500' },
  { id: 'paid', label: 'Ödendi', color: 'bg-green-500' },
]

// ... (PayrollDialog and PayrollDetailDialog components remain unchanged)

// Inside PayrollPage component:



function PayrollDialog({
  open,
  onOpenChange,
  payroll,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  payroll?: PayrollRecord
  onSave: (data: Partial<PayrollRecord>) => Promise<void>
}) {
  const [formData, setFormData] = useState<Partial<PayrollRecord>>({
    employeeId: '',
    period: new Date().toISOString().slice(0, 7),
    baseSalary: 0,
    currency: 'TRY',
    allowances: [],
    deductions: [],
    bonuses: [],
    status: 'draft',
    notes: '',
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  })

  const isEditing = !!payroll

  useEffect(() => {
    if (payroll) {
      setFormData(payroll)
    } else {
      setFormData({
        employeeId: '',
        period: new Date().toISOString().slice(0, 7),
        baseSalary: 0,
        currency: 'TRY',
        allowances: [],
        deductions: [],
        bonuses: [],
        status: 'draft',
        notes: '',
      })
    }
  }, [payroll, open])

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.period || !formData.baseSalary) {
      toast.error('Çalışan, dönem ve temel maaş alanları zorunludur')
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

  const selectedEmployee = employees?.find(emp => emp.id === formData.employeeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Bordro Düzenle' : 'Yeni Bordro'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Bordro bilgilerini güncelleyin' : 'Yeni bordro kaydı oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Çalışan *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => {
                  const emp = employees?.find(e => e.id === value)
                  setFormData({
                    ...formData,
                    employeeId: value,
                    baseSalary: emp?.salary.amount || 0,
                    currency: emp?.salary.currency || 'TRY',
                    iban: emp?.iban || '',
                    bankName: emp?.bankName || '',
                    facilityId: emp?.facilityId
                  })
                }}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Çalışan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    ?.filter(emp => emp.status === 'active' && !emp.code?.includes('_deleted_'))
                    .map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} - {emp.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dönem *</Label>
              <Input
                type="month"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Temel Maaş *</Label>
              <Input
                type="number"
                value={formData.baseSalary}
                onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                min={0}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banka Adı</Label>
              <Input
                value={formData.bankName || ''}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Banka Adı"
              />
            </div>
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input
                value={formData.iban || ''}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="TR..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Durum</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as PayrollRecord['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="paid">Ödendi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notlar..."
              rows={3}
            />
          </div>

          {selectedEmployee && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Seçili Çalışan</p>
              <p className="font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
              <p className="text-sm text-muted-foreground">
                Mevcut Maaş: {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: selectedEmployee.salary.currency,
                }).format(selectedEmployee.salary.amount)}
              </p>
            </div>
          )}
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

function PayrollDetailDialog({
  open,
  onOpenChange,
  payroll,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  payroll?: PayrollRecord
}) {
  if (!payroll) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: payroll.currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bordro Detayı</DialogTitle>
          <DialogDescription>
            {payroll.employeeName} - {format(new Date(payroll.period + '-01'), 'MMMM yyyy', { locale: tr })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Brüt Maaş</p>
                <p className="text-2xl font-bold">{formatCurrency(payroll.grossSalary)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Net Maaş</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(payroll.netSalary)}</p>
              </CardContent>
            </Card>
          </div>

          {(payroll.iban || payroll.bankName) && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Banka Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Banka Adı</p>
                    <p className="font-medium">{payroll.bankName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IBAN</p>
                    <p className="font-medium font-mono">{payroll.iban || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Temel Maaş</h3>
              <p className="text-lg">{formatCurrency(payroll.baseSalary)}</p>
            </div>

            {payroll.allowances.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Yan Haklar</h3>
                <div className="space-y-1">
                  {payroll.allowances.map((allowance, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{allowance.name}</span>
                      <span className="text-green-600">+{formatCurrency(allowance.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payroll.bonuses.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Primler</h3>
                <div className="space-y-1">
                  {payroll.bonuses.map((bonus, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{bonus.name}</span>
                      <span className="text-green-600">+{formatCurrency(bonus.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payroll.deductions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Kesintiler</h3>
                <div className="space-y-1">
                  {payroll.deductions.map((deduction, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{deduction.name}</span>
                      <span className="text-red-600">-{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between font-semibold">
                  <span>Toplam Kesinti</span>
                  <span className="text-red-600">-{formatCurrency(payroll.totalDeductions)}</span>
                </div>
              </div>
            )}

            {payroll.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notlar</h3>
                <p className="text-sm text-muted-foreground">{payroll.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => printPayroll(payroll)}
              className="flex-1"
            >
              <Printer size={18} className="mr-2" />
              Yazdır
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  toast.loading('PDF oluşturuluyor...', { id: 'pdf-export-detail' })
                  await exportPayrollToPDF(payroll)
                  toast.success('PDF indirildi', { id: 'pdf-export-detail' })
                } catch (error: any) {
                  toast.error(error.message || 'PDF oluşturulurken hata oluştu', { id: 'pdf-export-detail' })
                }
              }}
              className="flex-1"
            >
              <Download size={18} className="mr-2" />
              PDF İndir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PayrollPage() {
  const selectedFacility = useAuthStore(state => state.selectedFacility)
  const [filters, setFilters] = useState<PayrollFilters>({})
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | undefined>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | undefined>()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const queryClient = useQueryClient()

  const currentMonth = new Date().toISOString().slice(0, 7)
  const [period, setPeriod] = useState<string>(currentMonth)

  // FacilityId'yi filtreye ekle
  useEffect(() => {
    if (selectedFacility?.id) {
      setFilters(prev => ({ ...prev, facilityId: selectedFacility.id }))
    }
  }, [selectedFacility?.id])

  const { data: payrollRecords, isLoading } = useQuery({
    queryKey: ['payroll', { ...filters, period }],
    queryFn: () => payrollService.getPayrollRecords({
      ...filters,
      period,
    }),
    enabled: !!selectedFacility?.id,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeService.getEmployees(),
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', selectedFacility?.id],
    queryFn: () => departmentService.getDepartments({ facilityId: selectedFacility?.id }),
    enabled: !!selectedFacility?.id,
  })

  const handleFilterChange = (key: keyof PayrollFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }))
  }

  const handleViewDetail = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll)
    setDetailOpen(true)
  }

  const handleCreate = () => {
    setEditingPayroll(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (payroll: PayrollRecord) => {
    setEditingPayroll(payroll)
    setDialogOpen(true)
  }

  const handleSave = async (data: Partial<PayrollRecord>) => {
    if (editingPayroll) {
      await payrollService.updatePayrollRecord(editingPayroll.id, data)
    } else {
      await payrollService.createPayrollRecord(data)
    }
    queryClient.invalidateQueries({ queryKey: ['payroll'] })
    queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
  }

  const handleMarkAsPaid = async (payrollId: string) => {
    try {
      await payrollService.markAsPaid(payrollId)
      toast.success('Bordro ödeme olarak işaretlendi')
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
    } catch (error) {
      toast.error('Bordro güncellenirken hata oluştu')
    }
  }

  const handleSignByEmployee = async (payroll: PayrollRecord) => {
    if (window.confirm(`${payroll.employeeName} tarafından bordro imzalanacak. Onaylıyor musunuz?`)) {
      try {
        await payrollService.signByEmployee(payroll.id, payroll.employeeName)
        toast.success('Bordro çalışan tarafından imzalandı')
        queryClient.invalidateQueries({ queryKey: ['payroll'] })
        queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
      } catch (error) {
        toast.error('Bordro imzalanırken hata oluştu')
      }
    }
  }

  const handlePrint = async (payroll: PayrollRecord) => {
    try {
      toast.loading('Yazdırma hazırlanıyor...', { id: 'print-payroll' })
      await printPayroll(payroll)
      toast.success('Yazdırma penceresi açıldı', { id: 'print-payroll' })
    } catch (error: any) {
      toast.error(error.message || 'Yazdırma sırasında hata oluştu', { id: 'print-payroll' })
    }
  }

  const handleGenerateMonthlyPayrolls = async () => {
    if (!window.confirm(`${period} dönemi için aktif çalışanların bordrolarını oluşturmak istediğinize emin misiniz?`)) {
      return
    }

    setIsGenerating(true)
    try {
      toast.loading('Bordrolar oluşturuluyor...', { id: 'generate-payrolls' })
      const created = await payrollService.generateMonthlyPayrolls(period)
      toast.success(`${created.length} bordro oluşturuldu`, { id: 'generate-payrolls' })
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
    } catch (error: any) {
      toast.error(error.message || 'Bordrolar oluşturulurken hata oluştu', { id: 'generate-payrolls' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === payrollRecords?.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(payrollRecords?.map(rec => rec.id) || [])
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleBulkPayment = async () => {
    if (selectedIds.length === 0) {
      toast.error('Lütfen en az bir bordro seçin')
      return
    }

    if (!window.confirm(`${selectedIds.length} bordroyu ödeme olarak işaretlemek istediğinize emin misiniz?`)) {
      return
    }

    try {
      toast.loading('Ödemeler işaretleniyor...', { id: 'bulk-payment' })
      await payrollService.bulkMarkAsPaid(selectedIds)
      toast.success(`${selectedIds.length} bordro ödeme olarak işaretlendi`, { id: 'bulk-payment' })
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
    } catch (error: any) {
      toast.error(error.message || 'Toplu ödeme sırasında hata oluştu', { id: 'bulk-payment' })
    }
  }

  const handleBulkSign = async () => {
    if (selectedIds.length === 0) {
      toast.error('Lütfen en az bir bordro seçin')
      return
    }

    if (!window.confirm(`${selectedIds.length} bordroyu çalışanlar tarafından imzalatmak istediğinize emin misiniz?`)) {
      return
    }

    try {
      toast.loading('İmzalar alınıyor...', { id: 'bulk-sign' })
      const employeeNames: Record<string, string> = {}
      payrollRecords?.forEach(rec => {
        if (selectedIds.includes(rec.id)) {
          employeeNames[rec.employeeId] = rec.employeeName
        }
      })
      await payrollService.bulkSignByEmployee(selectedIds, employeeNames)
      toast.success(`${selectedIds.length} bordro imzalandı`, { id: 'bulk-sign' })
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
    } catch (error: any) {
      toast.error(error.message || 'Toplu imza sırasında hata oluştu', { id: 'bulk-sign' })
    }
  }

  const handleExportExcel = () => {
    if (!payrollRecords || payrollRecords.length === 0) {
      toast.error('Dışa aktarılacak veri bulunamadı')
      return
    }

    const data = payrollRecords.map(rec => ({
      'Çalışan': rec.employeeName,
      'Çalışan Kodu': rec.employeeCode,
      'Dönem': rec.period,
      'Temel Maaş': rec.baseSalary,
      'Brüt Maaş': rec.grossSalary,
      'Toplam Kesinti': rec.totalDeductions,
      'Net Maaş': rec.netSalary,
      'Para Birimi': rec.currency,
      'Durum': statusLabels[rec.status],
      'Ödeme Tarihi': rec.paymentDate || '-',
      'Banka': rec.bankName || '-',
      'IBAN': rec.iban || '-'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bordrolar')
    XLSX.writeFile(wb, `Bordrolar_${period}.xlsx`)
    toast.success('Excel dosyası indirildi')
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Bu bordroyu iptal etmek istediğinize emin misiniz?')) return
    try {
      await payrollService.cancelPayroll(id)
      toast.success('Bordro iptal edildi')
      queryClient.invalidateQueries({ queryKey: ['payroll'] })
      queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
    } catch (error) {
      toast.error('Bordro iptal edilirken bir hata oluştu')
    }
  }

  const handleBulkExportPDF = async () => {
    if (selectedIds.length === 0) {
      toast.error('Lütfen en az bir bordro seçin')
      return
    }

    try {
      toast.loading(`${selectedIds.length} PDF oluşturuluyor...`, { id: 'bulk-export-pdf' })
      const selectedPayrolls = payrollRecords?.filter(rec => selectedIds.includes(rec.id)) || []

      for (let i = 0; i < selectedPayrolls.length; i++) {
        await exportPayrollToPDF(selectedPayrolls[i])
        // Her PDF arasında kısa bir gecikme
        if (i < selectedPayrolls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      toast.success(`${selectedPayrolls.length} PDF indirildi`, { id: 'bulk-export-pdf' })
    } catch (error: any) {
      toast.error(error.message || 'PDF oluşturulurken hata oluştu', { id: 'bulk-export-pdf' })
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, status: PayrollRecord['status']) => {
    e.preventDefault()
    if (!draggedId) return

    const record = payrollRecords?.find(r => r.id === draggedId)
    if (!record) return

    if (record.status === 'paid') {
      toast.error('Ödenmiş bordrolar geri alınamaz')
      setDraggedId(null)
      return
    }

    if (status === 'paid') {
      if (window.confirm('Bu bordroyu ödeme olarak işaretlemek istediğinize emin misiniz?')) {
        await handleMarkAsPaid(draggedId)
      }
    } else {
      try {
        await payrollService.updatePayrollRecord(draggedId, { status })
        toast.success('Durum güncellendi')
        queryClient.invalidateQueries({ queryKey: ['payroll'] })
        queryClient.invalidateQueries({ queryKey: ['employee-payrolls'] })
      } catch (error) {
        toast.error('Güncelleme başarısız')
      }
    }
    setDraggedId(null)
  }

  const stats = payrollRecords?.reduce((acc, rec) => {
    acc.total++
    acc.totalGross += rec.grossSalary
    acc.totalNet += rec.netSalary
    if (rec.status === 'paid') acc.paid++
    return acc
  }, { total: 0, totalGross: 0, totalNet: 0, paid: 0 }) || { total: 0, totalGross: 0, totalNet: 0, paid: 0 }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Son 6 ay için period seçenekleri
  const periodOptions = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return date.toISOString().slice(0, 7)
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Bordro</h1>
            <p className="text-muted-foreground mt-1">
              Maaş bordrosu ve ödeme yönetimi
            </p>
          </div>
          <div className="flex gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-2">
                  <Kanban size={16} />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <ListBullets size={16} />
                  Liste
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={!payrollRecords || payrollRecords.length === 0}
            >
              <FileXls size={20} className="mr-2" />
              Excel İndir
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateMonthlyPayrolls}
              disabled={isGenerating}
            >
              <ArrowsClockwise size={20} className="mr-2" />
              {isGenerating ? 'Oluşturuluyor...' : 'Aylık Bordroları Oluştur'}
            </Button>
            <Button onClick={handleCreate}>
              <Plus size={20} className="mr-2" />
              Yeni Bordro
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Bordro</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Brüt</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalGross)}</p>
              </div>
              <Wallet size={24} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Net</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalNet)}</p>
              </div>
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ödenen</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dönem</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(p => (
                      <SelectItem key={p} value={p}>
                        {format(new Date(p + '-01'), 'MMMM yyyy', { locale: tr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Çalışan</Label>
                <Select
                  value={filters.employeeId || 'all'}
                  onValueChange={(value) => handleFilterChange('employeeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {employees
                      ?.filter(emp => emp.status === 'active' && !emp.code?.includes('_deleted_'))
                      .map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-end">
              <div className="space-y-2">
                <Label>Departman</Label>
                <Select
                  value={filters.department || 'all'}
                  onValueChange={(value) => handleFilterChange('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {departments?.map(dept => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedIds.length} bordro seçildi
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkPayment}
                  >
                    <Check size={16} className="mr-2" />
                    Toplu Ödeme Yap
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkSign}
                  >
                    <Signature size={16} className="mr-2" />
                    Toplu İmza Al
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkExportPDF}
                  >
                    <Download size={16} className="mr-2" />
                    Toplu PDF İndir
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
              >
                Seçimi Temizle
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statusColumns.map((column) => {
                const columnRecords = payrollRecords?.filter((r) => r.status === column.id) || []

                return (
                  <div key={column.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <h3 className="font-semibold text-sm">{column.label}</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {columnRecords.length}
                      </Badge>
                    </div>

                    <div
                      className="flex-1 bg-muted/30 rounded-lg p-3 min-h-[400px] border-2 border-dashed border-transparent transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                      style={{
                        borderColor: draggedId ? 'hsl(var(--primary))' : 'transparent',
                      }}
                    >
                      <div className="space-y-3">
                        {columnRecords.map((rec) => (
                          <div
                            key={rec.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, rec.id)}
                            className="cursor-move"
                          >
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="font-medium">{rec.employeeName}</div>
                                  <Badge className={statusColors[rec.status]}>
                                    {statusLabels[rec.status]}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {rec.employeeCode}
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Net Maaş:</span>
                                  <span className="font-bold text-green-600">
                                    {formatCurrency(rec.netSalary)}
                                  </span>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleViewDetail(rec)}
                                  >
                                    <Eye size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(rec)}
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                  {(rec.status === 'draft' || rec.status === 'approved') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleCancel(rec.id)}
                                      title="İptal Et"
                                    >
                                      <X size={16} />
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === payrollRecords?.length && payrollRecords.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Brüt Maaş</TableHead>
                    <TableHead>Kesintiler</TableHead>
                    <TableHead>Net Maaş</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Ödeme Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Bordro bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollRecords?.map(rec => (
                      <TableRow key={rec.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(rec.id)}
                            onCheckedChange={() => handleSelectOne(rec.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle size={18} className="text-muted-foreground" />
                            <div>
                              <div className="font-medium">{rec.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{rec.employeeCode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(rec.period + '-01'), 'MMMM yyyy', { locale: tr })}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(rec.grossSalary)}</TableCell>
                        <TableCell className="text-red-600">-{formatCurrency(rec.totalDeductions)}</TableCell>
                        <TableCell className="font-semibold text-green-600">{formatCurrency(rec.netSalary)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={statusColors[rec.status]}>
                              {statusLabels[rec.status]}
                            </Badge>
                            {rec.signedByEmployee && (
                              <Badge variant="outline" className="text-xs w-fit">
                                <Signature size={12} className="mr-1" />
                                İmzalı
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rec.paymentDate ? (
                            format(new Date(rec.paymentDate), 'dd MMM yyyy', { locale: tr })
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetail(rec)}
                              title="Detay"
                            >
                              <Eye size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePrint(rec)}
                              title="Yazdır"
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Printer size={18} />
                            </Button>
                            {rec.status === 'approved' && !rec.signedByEmployee && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSignByEmployee(rec)}
                                title="Çalışan İmzala"
                                className="text-green-600 hover:text-green-700"
                              >
                                <Signature size={18} />
                              </Button>
                            )}
                            {rec.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkAsPaid(rec.id)}
                                title="Ödeme Olarak İşaretle"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Check size={18} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(rec)}
                              title="Düzenle"
                            >
                              <Pencil size={18} />
                            </Button>
                            {(rec.status === 'draft' || rec.status === 'approved') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancel(rec.id)}
                                title="İptal Et"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X size={18} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                try {
                                  toast.loading('PDF oluşturuluyor...', { id: 'pdf-export' })
                                  await exportPayrollToPDF(rec)
                                  toast.success('PDF indirildi', { id: 'pdf-export' })
                                } catch (error: any) {
                                  toast.error(error.message || 'PDF oluşturulurken hata oluştu', { id: 'pdf-export' })
                                }
                              }}
                              title="PDF İndir"
                            >
                              <Download size={18} />
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

      <PayrollDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        payroll={selectedPayroll}
      />

      <PayrollDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingPayroll(undefined)
          }
        }}
        payroll={editingPayroll}
        onSave={handleSave}
      />
    </div>
  )
}
