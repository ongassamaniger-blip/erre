import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Upload,
  FileXls,
  CheckCircle,
  XCircle,
  WarningCircle,
  Download,
} from '@phosphor-icons/react'
import { parseExcelFile, parseDate, parseTime, parseStatus } from '@/utils/excelImport'
import type { AttendanceRecord } from '@/services/attendanceService'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import * as XLSX from 'xlsx'

interface AttendanceImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (records: Partial<AttendanceRecord>[]) => Promise<void>
}

interface ImportPreviewRow {
  employeeCode: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  status: AttendanceRecord['status']
  notes?: string
  errors?: string[]
  warnings?: string[]
}

export function AttendanceImportDialog({
  open,
  onOpenChange,
  onImport,
}: AttendanceImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([])
  const [mapping, setMapping] = useState<{
    employeeCode: string
    employeeName: string
    date: string
    checkIn: string
    checkOut: string
    status?: string
    notes?: string
  }>({
    employeeCode: '',
    employeeName: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: '',
    notes: '',
  })
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return

    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf('.'))

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Geçersiz dosya formatı. Lütfen Excel (.xlsx, .xls) veya CSV dosyası seçin.')
      return
    }

    setFile(selectedFile)
    setIsLoading(true)

    try {
      // Excel dosyasını parse et
      const rawData = await parseExcelFile(selectedFile, {
        headerRow: 1,
        skipRows: 0,
      })

      if (!rawData || rawData.length === 0) {
        toast.error('Dosyada veri bulunamadı')
        setIsLoading(false)
        return
      }

      // İlk satırdan kolonları al
      const firstRow = rawData[0]
      const columns = Object.keys(firstRow)
      setExcelColumns(columns)

      // Otomatik mapping yap
      const autoMapping: { [key: string]: string } = {}
      columns.forEach((col) => {
        const colLower = col.toLowerCase()
        if (colLower.includes('kod') || colLower.includes('code') || colLower.includes('id')) {
          autoMapping.employeeCode = col
        } else if (colLower.includes('ad') || colLower.includes('name') || colLower.includes('isim')) {
          autoMapping.employeeName = col
        } else if (colLower.includes('tarih') || colLower.includes('date')) {
          autoMapping.date = col
        } else if (colLower.includes('giriş') || colLower.includes('checkin') || colLower.includes('check-in')) {
          autoMapping.checkIn = col
        } else if (colLower.includes('çıkış') || colLower.includes('checkout') || colLower.includes('check-out')) {
          autoMapping.checkOut = col
        } else if (colLower.includes('durum') || colLower.includes('status')) {
          autoMapping.status = col
        } else if (colLower.includes('not') || colLower.includes('note') || colLower.includes('açıklama')) {
          autoMapping.notes = col
        }
      })

      setMapping((prev) => ({ ...prev, ...autoMapping }))

      // Preview oluştur
      const preview: ImportPreviewRow[] = rawData.slice(0, 10).map((row: any, index: number) => {
        const errors: string[] = []
        const warnings: string[] = []

        const employeeCode = autoMapping.employeeCode ? row[autoMapping.employeeCode] : ''
        const employeeName = autoMapping.employeeName ? row[autoMapping.employeeName] : ''
        const dateStr = autoMapping.date ? row[autoMapping.date] : ''
        const checkInStr = autoMapping.checkIn ? row[autoMapping.checkIn] : ''
        const checkOutStr = autoMapping.checkOut ? row[autoMapping.checkOut] : ''
        const statusStr = autoMapping.status ? row[autoMapping.status] : ''
        const notes = autoMapping.notes ? row[autoMapping.notes] : ''

        // Validation
        if (!employeeCode && !employeeName) {
          errors.push('Çalışan kodu veya adı bulunamadı')
        }

        const date = parseDate(dateStr)
        if (!date) {
          errors.push('Geçersiz tarih formatı')
        }

        const checkIn = checkInStr ? parseTime(checkInStr) : null
        const checkOut = checkOutStr ? parseTime(checkOutStr) : null

        if (checkInStr && !checkIn) {
          warnings.push('Giriş saati parse edilemedi')
        }

        if (checkOutStr && !checkOut) {
          warnings.push('Çıkış saati parse edilemedi')
        }

        return {
          employeeCode: employeeCode || '',
          employeeName: employeeName || '',
          date: date || '',
          checkIn: checkIn || '',
          checkOut: checkOut || '',
          status: parseStatus(statusStr),
          notes: notes || '',
          errors: errors.length > 0 ? errors : undefined,
          warnings: warnings.length > 0 ? warnings : undefined,
        }
      })

      setPreviewData(preview)
      toast.success(`${rawData.length} satır veri bulundu. İlk 10 satır önizleme için gösteriliyor.`)
    } catch (error: any) {
      toast.error(error.message || 'Dosya okunurken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file || previewData.length === 0) {
      toast.error('Lütfen önce bir dosya seçin ve önizlemeyi kontrol edin')
      return
    }

    setIsImporting(true)

    try {
      const rawData = await parseExcelFile(file, {
        headerRow: 1,
        skipRows: 0,
      })

      const records: Partial<AttendanceRecord>[] = rawData.map((row: any) => {
        const date = parseDate(row[mapping.date] || '')
        const checkIn = mapping.checkIn ? parseTime(row[mapping.checkIn] || '') : null
        const checkOut = mapping.checkOut ? parseTime(row[mapping.checkOut] || '') : null
        const status = mapping.status ? parseStatus(row[mapping.status] || '') : 'present'

        return {
          employeeCode: row[mapping.employeeCode] || row[mapping.employeeName] || '',
          date: date || new Date().toISOString().split('T')[0],
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
          status,
          notes: mapping.notes ? row[mapping.notes] : undefined,
        }
      })

      await onImport(records)
      toast.success(`${records.length} kayıt başarıyla import edildi`)

      // Reset
      setFile(null)
      setPreviewData([])
      setMapping({
        employeeCode: '',
        employeeName: '',
        date: '',
        checkIn: '',
        checkOut: '',
        status: '',
        notes: '',
      })
      setExcelColumns([])
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Import işlemi başarısız')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    try {
      // Template Excel dosyası oluştur
      const templateData = [
        {
          'Çalışan Kodu': '',
          'Çalışan Adı': '',
          'Tarih': '',
          'Giriş Saati': '',
          'Çıkış Saati': '',
          'Durum': '',
          'Notlar': '',
        }
      ]

      const ws = XLSX.utils.json_to_sheet(templateData)

      // Kolon genişliklerini ayarla
      const colWidths = [
        { wch: 15 }, // Çalışan Kodu
        { wch: 20 }, // Çalışan Adı
        { wch: 12 }, // Tarih
        { wch: 12 }, // Giriş Saati
        { wch: 12 }, // Çıkış Saati
        { wch: 12 }, // Durum
        { wch: 30 }, // Notlar
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Devamsızlık')
      XLSX.writeFile(wb, 'devamsizlik_template.xlsx')

      toast.success('Template dosyası indirildi')
    } catch (error: any) {
      console.error('Template indirme hatası:', error)
      toast.error('Template dosyası indirilemedi: ' + (error.message || 'Bilinmeyen hata'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Devamsızlık Verisi İçe Aktar</DialogTitle>
          <DialogDescription>
            Parmak izi veya kart okuyucu sisteminden gelen Excel/CSV dosyasını yükleyin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dosya Seçimi */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. Dosya Seç</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) {
                      handleFileSelect(selectedFile)
                    }
                  }}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Upload size={20} className="mr-2" />
                  {file ? file.name : 'Dosya Seç'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadTemplate}
                >
                  <Download size={16} className="mr-2" />
                  Template İndir
                </Button>
              </div>

              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileXls size={16} />
                  <span>{file.name}</span>
                  <span>•</span>
                  <span>{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kolon Mapping */}
          {excelColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Kolon Eşleştirme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Çalışan Kodu *</Label>
                    <Select
                      value={mapping.employeeCode}
                      onValueChange={(value) =>
                        setMapping({ ...mapping, employeeCode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kolon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {excelColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Çalışan Adı</Label>
                    <Select
                      value={mapping.employeeName}
                      onValueChange={(value) =>
                        setMapping({ ...mapping, employeeName: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kolon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {excelColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tarih *</Label>
                    <Select
                      value={mapping.date}
                      onValueChange={(value) =>
                        setMapping({ ...mapping, date: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kolon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {excelColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Giriş Saati</Label>
                    <Select
                      value={mapping.checkIn}
                      onValueChange={(value) =>
                        setMapping({ ...mapping, checkIn: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kolon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {excelColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Çıkış Saati</Label>
                    <Select
                      value={mapping.checkOut}
                      onValueChange={(value) =>
                        setMapping({ ...mapping, checkOut: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kolon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {excelColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select
                      value={mapping.status || ''}
                      onValueChange={(value) =>
                        setMapping({ ...mapping, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kolon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {excelColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Önizleme */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Önizleme (İlk 10 Satır)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Çalışan</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Giriş</TableHead>
                        <TableHead>Çıkış</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {row.employeeCode || row.employeeName}
                              </div>
                              {row.errors && row.errors.length > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  {row.errors.join(', ')}
                                </div>
                              )}
                              {row.warnings && row.warnings.length > 0 && (
                                <div className="text-xs text-yellow-600 mt-1">
                                  {row.warnings.join(', ')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{row.date || '-'}</TableCell>
                          <TableCell>{row.checkIn || '-'}</TableCell>
                          <TableCell>{row.checkOut || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === 'present'
                                  ? 'default'
                                  : row.status === 'absent'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.errors && row.errors.length > 0 ? (
                              <XCircle size={16} className="text-red-600" />
                            ) : row.warnings && row.warnings.length > 0 ? (
                              <WarningCircle size={16} className="text-yellow-600" />
                            ) : (
                              <CheckCircle size={16} className="text-green-600" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Alert>
              <WarningCircle className="h-4 w-4" />
              <AlertDescription>Dosya işleniyor...</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || previewData.length === 0 || isLoading || isImporting}
          >
            {isImporting ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

