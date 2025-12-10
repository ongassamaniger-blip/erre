import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Transaction } from '@/types/finance'

export interface ExcelExportOptions {
  filename?: string
  sheetName?: string
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  options: ExcelExportOptions = {}
): void {
  const { filename, sheetName = 'İşlemler' } = options

  // Excel için veri formatı
  const excelData = transactions.map((t) => ({
    'İşlem Kodu': t.code,
    'Tarih': format(new Date(t.date), 'dd.MM.yyyy', { locale: tr }),
    'Tip': t.type === 'income' ? 'Gelir' : t.type === 'expense' ? 'Gider' : 'Virman',
    'Tutar': t.amount,
    'Para Birimi': t.currency,
    'Döviz Kuru': t.exchangeRate || 1,
    'Ana Para Birimi Tutarı': t.amountInBaseCurrency,
    'Kategori': t.categoryName || '-',
    'Açıklama': t.title || '-',
    'Detay': t.description || '-',
    'Tedarikçi/Müşteri': t.vendorCustomerName || '-',
    'Proje': t.projectName || '-',
    'Departman': t.departmentName || '-',
    'Ödeme Yöntemi': 
      t.paymentMethod === 'cash' ? 'Nakit' :
      t.paymentMethod === 'bank_transfer' ? 'Banka Transferi' :
      t.paymentMethod === 'credit_card' ? 'Kredi Kartı' :
      t.paymentMethod === 'check' ? 'Çek' : '-',
    'Durum': 
      t.status === 'approved' ? 'Onaylandı' :
      t.status === 'pending' ? 'Beklemede' :
      t.status === 'rejected' ? 'Reddedildi' :
      t.status === 'draft' ? 'Taslak' : '-',
    'Oluşturan': t.createdBy || '-',
    'Oluşturma Tarihi': t.createdAt 
      ? format(new Date(t.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })
      : '-',
    'Güncelleme Tarihi': t.updatedAt
      ? format(new Date(t.updatedAt), 'dd.MM.yyyy HH:mm', { locale: tr })
      : '-',
  }))

  // Workbook oluştur
  const wb = XLSX.utils.book_new()
  
  // Worksheet oluştur
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Kolon genişliklerini ayarla
  const colWidths = [
    { wch: 15 }, // İşlem Kodu
    { wch: 12 }, // Tarih
    { wch: 10 }, // Tip
    { wch: 15 }, // Tutar
    { wch: 12 }, // Para Birimi
    { wch: 12 }, // Döviz Kuru
    { wch: 20 }, // Ana Para Birimi Tutarı
    { wch: 20 }, // Kategori
    { wch: 30 }, // Açıklama
    { wch: 40 }, // Detay
    { wch: 25 }, // Tedarikçi/Müşteri
    { wch: 20 }, // Proje
    { wch: 20 }, // Departman
    { wch: 15 }, // Ödeme Yöntemi
    { wch: 12 }, // Durum
    { wch: 15 }, // Oluşturan
    { wch: 20 }, // Oluşturma Tarihi
    { wch: 20 }, // Güncelleme Tarihi
  ]
  ws['!cols'] = colWidths

  // Worksheet'i workbook'a ekle
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Dosya adını oluştur
  const defaultFilename = `islemler-${format(new Date(), 'yyyy-MM-dd-HHmm', { locale: tr })}.xlsx`
  const finalFilename = filename || defaultFilename

  // Excel dosyasını indir
  XLSX.writeFile(wb, finalFilename)
}

