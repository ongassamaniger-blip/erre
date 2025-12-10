import * as XLSX from 'xlsx'
import { parse } from 'date-fns'

export interface ImportResult<T> {
  success: boolean
  data: T[]
  errors: string[]
  warnings: string[]
}

export interface ColumnMapping {
  [key: string]: string // Excel column -> Data field
}

/**
 * Excel veya CSV dosyasını parse eder
 */
export function parseExcelFile<T = any>(
  file: File,
  options?: {
    sheetIndex?: number
    headerRow?: number
    skipRows?: number
  }
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('Dosya okunamadı'))
          return
        }

        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetIndex = options?.sheetIndex || 0
        const sheetName = workbook.SheetNames[sheetIndex]
        
        if (!sheetName) {
          reject(new Error('Sayfa bulunamadı'))
          return
        }

        const worksheet = workbook.Sheets[sheetName]
        
        // JSON'a çevir
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: options?.headerRow !== undefined ? options.headerRow : 1,
          defval: '',
          raw: false,
        })

        // İlk N satırı atla
        const skipRows = options?.skipRows || 0
        const result = jsonData.slice(skipRows) as any[]

        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'))
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Excel/CSV verisini AttendanceRecord formatına dönüştürür
 */
export interface AttendanceImportRow {
  employeeCode?: string
  employeeName?: string
  date?: string
  checkIn?: string
  checkOut?: string
  status?: string
  notes?: string
}

export interface AttendanceImportMapping {
  employeeCode: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  status?: string
  notes?: string
}

/**
 * Excel kolonlarını sistem kolonlarına map eder
 */
export function mapColumns(
  excelColumns: string[],
  mapping: ColumnMapping
): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  
  excelColumns.forEach((excelCol, index) => {
    const systemField = mapping[excelCol]
    if (systemField) {
      result[systemField] = excelCol
    }
  })
  
  return result
}

/**
 * Tarih formatlarını parse eder
 */
export function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  
  // Excel tarih numarası (serial number)
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000)
    return date.toISOString().split('T')[0]
  }
  
  // String tarih formatları
  const formats = [
    'dd.MM.yyyy',
    'dd/MM/yyyy',
    'yyyy-MM-dd',
    'dd-MM-yyyy',
    'dd.MM.yy',
    'dd/MM/yy',
  ]
  
  for (const format of formats) {
    try {
      const parsed = parse(dateStr, format, new Date())
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
      }
    } catch {
      continue
    }
  }
  
  // Son çare: Date constructor
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch {
    // ignore
  }
  
  return null
}

/**
 * Saat formatlarını parse eder
 */
export function parseTime(timeStr: string): string | null {
  if (!timeStr) return null
  
  // Excel saat numarası (0-1 arası)
  if (typeof timeStr === 'number') {
    const hours = Math.floor(timeStr * 24)
    const minutes = Math.floor((timeStr * 24 - hours) * 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }
  
  // String saat formatları
  const timeFormats = [
    'HH:mm',
    'HH:mm:ss',
    'HH.mm',
    'HH.mm.ss',
    'h:mm a', // 12 saat formatı
  ]
  
  // Basit regex kontrolü
  const timeRegex = /^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/
  const match = timeStr.toString().match(timeRegex)
  
  if (match) {
    const hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }
  
  return null
}

/**
 * Durum string'ini sistem durumuna çevirir
 */
export function parseStatus(statusStr: string): 'present' | 'absent' | 'late' | 'half-day' | 'leave' {
  if (!statusStr) return 'present'
  
  const normalized = statusStr.toLowerCase().trim()
  
  const statusMap: { [key: string]: 'present' | 'absent' | 'late' | 'half-day' | 'leave' } = {
    'mevcut': 'present',
    'present': 'present',
    'var': 'present',
    'yok': 'absent',
    'absent': 'absent',
    'geç': 'late',
    'late': 'late',
    'yarım gün': 'half-day',
    'half-day': 'half-day',
    'half day': 'half-day',
    'izinli': 'leave',
    'leave': 'leave',
    'izin': 'leave',
  }
  
  return statusMap[normalized] || 'present'
}

