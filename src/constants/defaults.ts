// =============================================================================
// LOCAL DEFAULT DATA - Veritabanı temizlense bile kaybolmaz
// =============================================================================

import type { ModuleType } from '@/types'

// -----------------------------------------------------------------------------
// FİNANS KATEGORİLERİ
// -----------------------------------------------------------------------------
export interface LocalCategory {
    id: string
    name: string
    type: 'income' | 'expense'
    color: string
}

export const DEFAULT_EXPENSE_CATEGORIES: LocalCategory[] = [
    { id: 'a1b2c3d4-0001-4000-8000-000000000001', name: 'Personel Giderleri', type: 'expense', color: '#ef4444' },
    { id: 'a1b2c3d4-0001-4000-8000-000000000002', name: 'Operasyonel Giderler', type: 'expense', color: '#f97316' },
    { id: 'a1b2c3d4-0001-4000-8000-000000000003', name: 'Malzeme ve Ekipman', type: 'expense', color: '#eab308' },
    { id: 'a1b2c3d4-0001-4000-8000-000000000004', name: 'Ulaşım ve Seyahat', type: 'expense', color: '#3b82f6' },
    { id: 'a1b2c3d4-0001-4000-8000-000000000005', name: 'Pazarlama ve Tanıtım', type: 'expense', color: '#8b5cf6' },
    { id: 'a1b2c3d4-0001-4000-8000-000000000006', name: 'Kira ve Faturalar', type: 'expense', color: '#ec4899' },
    { id: 'a1b2c3d4-0001-4000-8000-000000000007', name: 'Diğer Giderler', type: 'expense', color: '#64748b' },
]

export const DEFAULT_INCOME_CATEGORIES: LocalCategory[] = [
    { id: 'a1b2c3d4-0002-4000-8000-000000000001', name: 'Bağışlar', type: 'income', color: '#22c55e' },
    { id: 'a1b2c3d4-0002-4000-8000-000000000002', name: 'Kurumsal Destekler', type: 'income', color: '#06b6d4' },
    { id: 'a1b2c3d4-0002-4000-8000-000000000003', name: 'Proje Gelirleri', type: 'income', color: '#a855f7' },
    { id: 'a1b2c3d4-0002-4000-8000-000000000004', name: 'Sponsorluk Gelirleri', type: 'income', color: '#ec4899' },
    { id: 'a1b2c3d4-0002-4000-8000-000000000005', name: 'Genel Merkez Bütçe Aktarımı', type: 'income', color: '#3b82f6' },
    { id: 'a1b2c3d4-0002-4000-8000-000000000006', name: 'Diğer Gelirler', type: 'income', color: '#64748b' },
]

export const DEFAULT_CATEGORIES: LocalCategory[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
]

// -----------------------------------------------------------------------------
// DEPARTMANLAR
// -----------------------------------------------------------------------------
export interface LocalDepartment {
    id: string
    name: string
    code: string
    description?: string
    color: string
}

export const DEFAULT_DEPARTMENTS: LocalDepartment[] = [
    { id: 'b1b2c3d4-0003-4000-8000-000000000001', name: 'Yönetim', code: 'YON', description: 'Üst yönetim ve idari birim', color: '#3b82f6' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000002', name: 'Finans', code: 'FIN', description: 'Mali işler ve muhasebe', color: '#22c55e' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000003', name: 'İnsan Kaynakları', code: 'IK', description: 'Personel ve İK yönetimi', color: '#a855f7' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000004', name: 'Operasyon', code: 'OPR', description: 'Operasyonel faaliyetler', color: '#f97316' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000005', name: 'Pazarlama', code: 'PAZ', description: 'Pazarlama ve iletişim', color: '#ec4899' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000006', name: 'Bilgi Teknolojileri', code: 'BT', description: 'Teknoloji ve IT desteği', color: '#06b6d4' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000007', name: 'Proje Yönetimi', code: 'PRJ', description: 'Proje koordinasyonu', color: '#8b5cf6' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000008', name: 'Lojistik', code: 'LOJ', description: 'Depo ve lojistik', color: '#eab308' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000009', name: 'Hukuk', code: 'HUK', description: 'Hukuki danışmanlık', color: '#64748b' },
    { id: 'b1b2c3d4-0003-4000-8000-000000000010', name: 'Sosyal Hizmetler', code: 'SOS', description: 'Sosyal yardım faaliyetleri', color: '#ef4444' },
]

// -----------------------------------------------------------------------------
// POZİSYONLAR / UNVANLAR
// -----------------------------------------------------------------------------
export interface LocalJobTitle {
    id: string
    name: string
    level: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive'
    departmentId?: string
}

export const DEFAULT_JOB_TITLES: LocalJobTitle[] = [
    // Yönetim
    { id: 'c1b2c3d4-0004-4000-8000-000000000001', name: 'Genel Müdür', level: 'executive' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000002', name: 'Genel Müdür Yardımcısı', level: 'director' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000003', name: 'Müdür', level: 'director' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000004', name: 'Müdür Yardımcısı', level: 'manager' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000005', name: 'Şef', level: 'lead' },

    // Finans
    { id: 'c1b2c3d4-0004-4000-8000-000000000006', name: 'Finans Müdürü', level: 'director', departmentId: 'b1b2c3d4-0003-4000-8000-000000000002' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000007', name: 'Muhasebeci', level: 'mid', departmentId: 'b1b2c3d4-0003-4000-8000-000000000002' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000008', name: 'Muhasebe Uzmanı', level: 'senior', departmentId: 'b1b2c3d4-0003-4000-8000-000000000002' },

    // İK
    { id: 'c1b2c3d4-0004-4000-8000-000000000009', name: 'İK Müdürü', level: 'director', departmentId: 'b1b2c3d4-0003-4000-8000-000000000003' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000010', name: 'İK Uzmanı', level: 'senior', departmentId: 'b1b2c3d4-0003-4000-8000-000000000003' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000011', name: 'İK Sorumlusu', level: 'mid', departmentId: 'b1b2c3d4-0003-4000-8000-000000000003' },

    // Operasyon
    { id: 'c1b2c3d4-0004-4000-8000-000000000012', name: 'Operasyon Koordinatörü', level: 'manager', departmentId: 'b1b2c3d4-0003-4000-8000-000000000004' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000013', name: 'Saha Görevlisi', level: 'junior', departmentId: 'b1b2c3d4-0003-4000-8000-000000000004' },

    // Proje
    { id: 'c1b2c3d4-0004-4000-8000-000000000014', name: 'Proje Müdürü', level: 'director', departmentId: 'b1b2c3d4-0003-4000-8000-000000000007' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000015', name: 'Proje Koordinatörü', level: 'manager', departmentId: 'b1b2c3d4-0003-4000-8000-000000000007' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000016', name: 'Proje Uzmanı', level: 'senior', departmentId: 'b1b2c3d4-0003-4000-8000-000000000007' },

    // IT
    { id: 'c1b2c3d4-0004-4000-8000-000000000017', name: 'IT Müdürü', level: 'director', departmentId: 'b1b2c3d4-0003-4000-8000-000000000006' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000018', name: 'Yazılım Geliştirici', level: 'mid', departmentId: 'b1b2c3d4-0003-4000-8000-000000000006' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000019', name: 'Teknik Destek Uzmanı', level: 'mid', departmentId: 'b1b2c3d4-0003-4000-8000-000000000006' },

    // Genel
    { id: 'c1b2c3d4-0004-4000-8000-000000000020', name: 'Asistan', level: 'junior' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000021', name: 'Stajyer', level: 'junior' },
    { id: 'c1b2c3d4-0004-4000-8000-000000000022', name: 'Gönüllü', level: 'junior' },
]

// -----------------------------------------------------------------------------
// ÖDEME YÖNTEMLERİ
// -----------------------------------------------------------------------------
export interface LocalPaymentMethod {
    id: string
    name: string
    icon?: string
}

export const DEFAULT_PAYMENT_METHODS: LocalPaymentMethod[] = [
    { id: 'd1b2c3d4-0005-4000-8000-000000000001', name: 'Nakit', icon: '💵' },
    { id: 'd1b2c3d4-0005-4000-8000-000000000002', name: 'Banka Transferi', icon: '🏦' },
    { id: 'd1b2c3d4-0005-4000-8000-000000000003', name: 'Kredi Kartı', icon: '💳' },
    { id: 'd1b2c3d4-0005-4000-8000-000000000004', name: 'Çek', icon: '📝' },
    { id: 'd1b2c3d4-0005-4000-8000-000000000005', name: 'Senet', icon: '📄' },
    { id: 'd1b2c3d4-0005-4000-8000-000000000006', name: 'EFT/Havale', icon: '🔄' },
]

// -----------------------------------------------------------------------------
// PARA BİRİMLERİ
// -----------------------------------------------------------------------------
export interface LocalCurrency {
    code: string
    name: string
    symbol: string
}

export const DEFAULT_CURRENCIES: LocalCurrency[] = [
    { code: 'TRY', name: 'Türk Lirası', symbol: '₺' },
    { code: 'USD', name: 'Amerikan Doları', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'İngiliz Sterlini', symbol: '£' },
    { code: 'SAR', name: 'Suudi Riyali', symbol: 'ر.س' },
    { code: 'AED', name: 'BAE Dirhemi', symbol: 'د.إ' },
]

// -----------------------------------------------------------------------------
// İZİN TÜRLERİ
// -----------------------------------------------------------------------------
export interface LocalLeaveType {
    id: string
    name: string
    maxDays?: number
    requiresDocument?: boolean
    color: string
}

export const DEFAULT_LEAVE_TYPES: LocalLeaveType[] = [
    { id: 'e1b2c3d4-0006-4000-8000-000000000001', name: 'Yıllık İzin', maxDays: 14, requiresDocument: false, color: '#3b82f6' },
    { id: 'e1b2c3d4-0006-4000-8000-000000000002', name: 'Hastalık İzni', requiresDocument: true, color: '#ef4444' },
    { id: 'e1b2c3d4-0006-4000-8000-000000000003', name: 'Ücretsiz İzin', requiresDocument: false, color: '#64748b' },
    { id: 'e1b2c3d4-0006-4000-8000-000000000004', name: 'Doğum İzni', maxDays: 112, requiresDocument: true, color: '#ec4899' },
    { id: 'e1b2c3d4-0006-4000-8000-000000000005', name: 'Babalık İzni', maxDays: 10, requiresDocument: true, color: '#06b6d4' },
    { id: 'e1b2c3d4-0006-4000-8000-000000000006', name: 'Evlilik İzni', maxDays: 3, requiresDocument: true, color: '#a855f7' },
    { id: 'e1b2c3d4-0006-4000-8000-000000000007', name: 'Ölüm İzni', maxDays: 3, requiresDocument: false, color: '#1f2937' },
    { id: 'e1b2c3d4-0006-4000-8000-000000000008', name: 'Diğer', requiresDocument: false, color: '#94a3b8' },
]

// -----------------------------------------------------------------------------
// İSTİHDAM TÜRLERİ
// -----------------------------------------------------------------------------
export interface LocalEmploymentType {
    id: string
    name: string
    description?: string
}

export const DEFAULT_EMPLOYMENT_TYPES: LocalEmploymentType[] = [
    { id: 'f1b2c3d4-0007-4000-8000-000000000001', name: 'Tam Zamanlı', description: 'Haftalık 45 saat çalışma' },
    { id: 'f1b2c3d4-0007-4000-8000-000000000002', name: 'Yarı Zamanlı', description: 'Haftalık 22.5 saat ve altı' },
    { id: 'f1b2c3d4-0007-4000-8000-000000000003', name: 'Sözleşmeli', description: 'Belirli süreli sözleşme' },
    { id: 'f1b2c3d4-0007-4000-8000-000000000004', name: 'Stajyer', description: 'Staj programı' },
    { id: 'f1b2c3d4-0007-4000-8000-000000000005', name: 'Gönüllü', description: 'Ücretsiz gönüllü çalışma' },
]

// -----------------------------------------------------------------------------
// KURBAN TÜRLERİ
// -----------------------------------------------------------------------------
export interface LocalQurbanType {
    id: string
    name: string
    animalType: 'sheep' | 'goat' | 'cow' | 'camel'
    shares: number
    minWeight: number
    maxWeight: number
}

export const DEFAULT_QURBAN_TYPES: LocalQurbanType[] = [
    { id: 'g1b2c3d4-0008-4000-8000-000000000001', name: 'Koyun', animalType: 'sheep', shares: 1, minWeight: 35, maxWeight: 80 },
    { id: 'g1b2c3d4-0008-4000-8000-000000000002', name: 'Keçi', animalType: 'goat', shares: 1, minWeight: 30, maxWeight: 70 },
    { id: 'g1b2c3d4-0008-4000-8000-000000000003', name: 'İnek Hissesi (1/7)', animalType: 'cow', shares: 7, minWeight: 250, maxWeight: 500 },
    { id: 'g1b2c3d4-0008-4000-8000-000000000004', name: 'Deve Hissesi (1/7)', animalType: 'camel', shares: 7, minWeight: 350, maxWeight: 700 },
]

// -----------------------------------------------------------------------------
// PROJE DURUMLARI
// -----------------------------------------------------------------------------
export interface LocalProjectStatus {
    id: string
    name: string
    color: string
    order: number
}

export const DEFAULT_PROJECT_STATUSES: LocalProjectStatus[] = [
    { id: 'h1b2c3d4-0009-4000-8000-000000000001', name: 'Planlama', color: '#3b82f6', order: 1 },
    { id: 'h1b2c3d4-0009-4000-8000-000000000002', name: 'Aktif', color: '#22c55e', order: 2 },
    { id: 'h1b2c3d4-0009-4000-8000-000000000003', name: 'Beklemede', color: '#eab308', order: 3 },
    { id: 'h1b2c3d4-0009-4000-8000-000000000004', name: 'Tamamlandı', color: '#6b7280', order: 4 },
    { id: 'h1b2c3d4-0009-4000-8000-000000000005', name: 'İptal Edildi', color: '#ef4444', order: 5 },
]

// -----------------------------------------------------------------------------
// GÖREV ÖNCELİKLERİ
// -----------------------------------------------------------------------------
export interface LocalPriority {
    id: string
    name: string
    color: string
    value: number
}

export const DEFAULT_PRIORITIES: LocalPriority[] = [
    { id: 'i1b2c3d4-0010-4000-8000-000000000001', name: 'Düşük', color: '#6b7280', value: 1 },
    { id: 'i1b2c3d4-0010-4000-8000-000000000002', name: 'Orta', color: '#3b82f6', value: 2 },
    { id: 'i1b2c3d4-0010-4000-8000-000000000003', name: 'Yüksek', color: '#f97316', value: 3 },
    { id: 'i1b2c3d4-0010-4000-8000-000000000004', name: 'Acil', color: '#ef4444', value: 4 },
]

// -----------------------------------------------------------------------------
// ÜLKELER
// -----------------------------------------------------------------------------
export interface LocalCountry {
    code: string
    name: string
    phoneCode: string
    flag: string
}

export const DEFAULT_COUNTRIES: LocalCountry[] = [
    { code: 'TR', name: 'Türkiye', phoneCode: '+90', flag: '🇹🇷' },
    { code: 'US', name: 'ABD', phoneCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'Birleşik Krallık', phoneCode: '+44', flag: '🇬🇧' },
    { code: 'DE', name: 'Almanya', phoneCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'Fransa', phoneCode: '+33', flag: '🇫🇷' },
    { code: 'AE', name: 'BAE', phoneCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Suudi Arabistan', phoneCode: '+966', flag: '🇸🇦' },
    { code: 'NL', name: 'Hollanda', phoneCode: '+31', flag: '🇳🇱' },
    { code: 'BE', name: 'Belçika', phoneCode: '+32', flag: '🇧🇪' },
    { code: 'AT', name: 'Avusturya', phoneCode: '+43', flag: '🇦🇹' },
]

// -----------------------------------------------------------------------------
// HELPER FONKSİYONLAR
// -----------------------------------------------------------------------------

/**
 * Kategorileri tip'e göre filtreler
 */
export function getCategoriesByType(type: 'income' | 'expense'): LocalCategory[] {
    return DEFAULT_CATEGORIES.filter(c => c.type === type)
}

/**
 * Departmana göre pozisyonları filtreler
 */
export function getJobTitlesByDepartment(departmentId?: string): LocalJobTitle[] {
    if (!departmentId) return DEFAULT_JOB_TITLES
    return DEFAULT_JOB_TITLES.filter(j => !j.departmentId || j.departmentId === departmentId)
}

/**
 * ID ile kategori bulur
 */
export function findCategoryById(id: string): LocalCategory | undefined {
    return DEFAULT_CATEGORIES.find(c => c.id === id)
}

/**
 * İsim ile kategori bulur
 */
export function findCategoryByName(name: string): LocalCategory | undefined {
    return DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase())
}

/**
 * ID ile departman bulur
 */
export function findDepartmentById(id: string): LocalDepartment | undefined {
    return DEFAULT_DEPARTMENTS.find(d => d.id === id)
}

/**
 * İsim ile departman bulur
 */
export function findDepartmentByName(name: string): LocalDepartment | undefined {
    return DEFAULT_DEPARTMENTS.find(d => d.name.toLowerCase() === name.toLowerCase())
}

/**
 * ID ile pozisyon bulur
 */
export function findJobTitleById(id: string): LocalJobTitle | undefined {
    return DEFAULT_JOB_TITLES.find(j => j.id === id)
}

/**
 * İsim ile pozisyon bulur
 */
export function findJobTitleByName(name: string): LocalJobTitle | undefined {
    return DEFAULT_JOB_TITLES.find(j => j.name.toLowerCase() === name.toLowerCase())
}
