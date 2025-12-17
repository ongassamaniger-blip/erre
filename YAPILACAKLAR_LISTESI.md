# 📋 Yapılacaklar Listesi
**Oluşturulma Tarihi**: 2024  
**Öncelik Sıralaması**: 1. Backend Entegrasyonu → 2. Test Altyapısı → 3. Eksik Özellikler

---

## 🔴 ÖNCELİK 1: Backend Entegrasyonu (Kritik)

### 1.1 Mock Servisleri Gerçek API'ye Dönüştürme

#### ✅ Zaten Entegre Edilmiş Servisler
- [x] `transactionService.ts` - Supabase entegre
- [x] `budgetService.ts` - Supabase entegre
- [x] `budgetTransferService.ts` - Supabase entegre
- [x] `departmentService.ts` - Supabase entegre (fallback var)
- [x] `calendarService.ts` - Supabase entegre
- [x] `facilityService.ts` - Supabase entegre
- [x] `approvalService.ts` - Supabase entegre (transactionService üzerinden)
- [x] `categoryService.ts` - Supabase entegre (fallback var)
- [x] `vendorsCustomersService.ts` - Supabase entegre
- [x] `chartOfAccountsService.ts` - Supabase entegre
- [x] `projectService.ts` - Supabase entegre
- [x] `projectDocumentService.ts` - Supabase entegre
- [x] `projectFinanceService.ts` - Supabase entegre
- [x] `employeeService.ts` (hr/) - Supabase entegre
- [x] `leaveService.ts` (hr/) - Supabase entegre
- [x] `attendanceService.ts` - Supabase entegre
- [x] `payrollService.ts` - Supabase entegre
- [x] `qurbanService.ts` - Supabase entegre
- [x] `branchSettingsService.ts` - Supabase entegre
- [x] `branchUserManagementService.ts` - Supabase entegre
- [x] `formsService.ts` - Supabase entegre
- [x] `printTemplatesService.ts` - Supabase entegre

#### ⚠️ Mock Servisler (Dönüştürülmesi Gerekenler)

##### 1.1.1 Notification Service
**Dosya**: `src/services/notificationService.ts`
**Durum**: Tamamen mock data
**Yapılacaklar**:
- [ ] `notifications` tablosundan veri çekme
- [ ] Yeni bildirim oluşturma (INSERT)
- [ ] Bildirim okundu işaretleme (UPDATE)
- [ ] Toplu okundu işaretleme
- [ ] Bildirim silme (DELETE)
- [ ] Realtime subscription ekleme
- [ ] Error handling ekleme
- [ ] Loading states iyileştirme

**SQL Tablosu**: `notifications` (mevcut)
**Tahmini Süre**: 4-6 saat

---

##### 1.1.2 Dashboard Service
**Dosya**: `src/services/dashboardService.ts`
**Durum**: Kısmen mock, RPC kullanılıyor ama fallback var
**Yapılacaklar**:
- [ ] `get_dashboard_summary` RPC fonksiyonunu düzeltme
  - [ ] `activeProjects` hesaplamasını düzelt
  - [ ] Trend hesaplamalarını RPC'ye taşı
  - [ ] `pendingTransactions` sayısını ekle
  - [ ] `categoryExpenses` ve `categoryIncomes` ekle
  - [ ] `employeeChange`, `projectChange`, `shareChange` ekle
- [ ] Fallback metodunu kaldırma (RPC çalıştıktan sonra)
- [ ] Error handling iyileştirme
- [ ] Cache stratejisi ekleme (5 dakika)

**SQL RPC**: `get_dashboard_summary` (mevcut ama eksik)
**Tahmini Süre**: 6-8 saat

---

##### 1.1.3 Report Service
**Dosya**: `src/services/reportService.ts`
**Durum**: Kısmen mock, bazı raporlar placeholder
**Yapılacaklar**:
- [ ] `generateIncomeExpenseReport` - Veritabanı sorgularını optimize et
  - [ ] Kategori bazlı gruplandırma (SQL GROUP BY)
  - [ ] Alt kategori drill-down için nested query
  - [ ] Trend hesaplamalarını SQL'de yap
  - [ ] Önceki dönem karşılaştırması için optimized query
- [ ] `generateCashFlowReport` - Placeholder'dan gerçek implementasyona
  - [ ] Nakit akış tablosu oluştur
  - [ ] Giriş/çıkış hesaplamaları
  - [ ] Dönem bazlı gruplandırma
- [ ] `generateBudgetPerformanceReport` - Placeholder'dan gerçek implementasyona
  - [ ] Bütçe vs gerçekleşme karşılaştırması
  - [ ] Sapma hesaplamaları
  - [ ] Yüzde hesaplamaları
- [ ] `generateCategoryAnalysisReport` - Placeholder'dan gerçek implementasyona
  - [ ] Kategori bazlı detaylı analiz
  - [ ] Trend analizi
  - [ ] Karşılaştırmalı analiz
- [ ] `generateVendorAnalysisReport` - Placeholder'dan gerçek implementasyona
  - [ ] Tedarikçi bazlı işlem analizi
  - [ ] Toplam harcama hesaplamaları
  - [ ] İşlem sayısı analizi
- [ ] `generateProjectFinancialReport` - Placeholder'dan gerçek implementasyona
  - [ ] Proje bazlı finansal analiz
  - [ ] Bütçe vs harcama karşılaştırması
  - [ ] Görev bazlı maliyet analizi

**SQL Tabloları**: `transactions`, `budgets`, `projects`, `vendors_customers`, `categories`
**Tahmini Süre**: 20-30 saat

---

##### 1.1.4 Global Search Service
**Dosya**: `src/services/globalSearchService.ts`
**Durum**: Client-side mock search
**Yapılacaklar**:
- [ ] Supabase Full-Text Search entegrasyonu
- [ ] PostgreSQL `tsvector` kullanımı
- [ ] Ağırlıklı arama sonuçları (relevance scoring)
- [ ] Modül bazlı filtreleme
- [ ] Pagination ekleme
- [ ] Search index'leri oluşturma
  - [ ] `transactions` tablosu için
  - [ ] `employees` tablosu için
  - [ ] `projects` tablosu için
  - [ ] `campaigns` tablosu için

**SQL**: Full-text search index'leri oluştur
**Tahmini Süre**: 8-10 saat

---

##### 1.1.5 Definition Service
**Dosya**: `src/services/definitionService.ts`
**Durum**: Kontrol edilmeli
**Yapılacaklar**:
- [ ] Mevcut durumu kontrol et
- [ ] Supabase entegrasyonu varsa test et
- [ ] Yoksa entegre et

**Tahmini Süre**: 2-4 saat

---

### 1.2 Error Handling İyileştirmeleri

#### 1.2.1 Merkezi Error Handler
**Yapılacaklar**:
- [ ] `src/lib/errorHandler.ts` oluştur
- [ ] Supabase error mapping
- [ ] User-friendly error messages
- [ ] Error logging (console/logger)
- [ ] Toast notification entegrasyonu
- [ ] Retry mekanizması (network errors için)

**Tahmini Süre**: 4-6 saat

---

#### 1.2.2 Servis Bazlı Error Handling
**Yapılacaklar**:
- [ ] Her serviste try-catch blokları kontrol et
- [ ] Consistent error response format
- [ ] Error type'ları tanımla (NetworkError, ValidationError, vb.)
- [ ] Fallback mekanizmaları (offline mode için)

**Tahmini Süre**: 6-8 saat

---

### 1.3 Loading States İyileştirmeleri

#### 1.3.1 Skeleton Loaders
**Yapılacaklar**:
- [ ] Tüm listelerde skeleton loader ekle
- [ ] Form'larda loading state
- [ ] Chart'larda loading state
- [ ] Table'larda loading state

**Tahmini Süre**: 4-6 saat

---

#### 1.3.2 Optimistic Updates
**Yapılacaklar**:
- [ ] TanStack Query optimistic updates
- [ ] Transaction oluşturma/update
- [ ] Approval işlemleri
- [ ] Form submit'ler

**Tahmini Süre**: 6-8 saat

---

### 1.4 Realtime Subscriptions

#### 1.4.1 Bildirimler
**Yapılacaklar**:
- [ ] `notifications` tablosu için realtime subscription
- [ ] Yeni bildirim geldiğinde toast göster
- [ ] Badge count'u güncelle
- [ ] NotificationProvider'a entegre et

**Tahmini Süre**: 3-4 saat

---

#### 1.4.2 Onaylar
**Yapılacaklar**:
- [ ] `approvals` tablosu için realtime subscription
- [ ] Onay durumu değişikliklerini dinle
- [ ] ApprovalService'e entegre et

**Tahmini Süre**: 3-4 saat

---

#### 1.4.3 Dashboard
**Yapılacaklar**:
- [ ] Dashboard metrikleri için realtime updates
- [ ] Transaction değişikliklerini dinle
- [ ] Budget değişikliklerini dinle
- [ ] Employee değişikliklerini dinle

**Tahmini Süre**: 4-6 saat

---

### 1.5 Performance Optimizasyonları

#### 1.5.1 Query Optimizasyonu
**Yapılacaklar**:
- [ ] N+1 query problemlerini çöz
- [ ] JOIN'leri optimize et
- [ ] SELECT * yerine spesifik kolonlar
- [ ] Pagination'ı tüm listelerde kullan
- [ ] Index'leri kontrol et ve ekle

**Tahmini Süre**: 8-10 saat

---

#### 1.5.2 Cache Stratejisi
**Yapılacaklar**:
- [ ] TanStack Query cache ayarlarını optimize et
- [ ] Stale time'ları ayarla
- [ ] Cache invalidation stratejisi
- [ ] Prefetching stratejisi

**Tahmini Süre**: 4-6 saat

---

### 1.6 Data Validation

#### 1.6.1 Backend Validation
**Yapılacaklar**:
- [ ] PostgreSQL constraints kontrolü
- [ ] Check constraints ekle (gerekirse)
- [ ] Foreign key constraints kontrolü
- [ ] Unique constraints kontrolü

**Tahmini Süre**: 2-4 saat

---

#### 1.6.2 Frontend Validation
**Yapılacaklar**:
- [ ] Zod schema'ları kontrol et
- [ ] Form validation'ları test et
- [ ] API response validation
- [ ] Type safety kontrolü

**Tahmini Süre**: 4-6 saat

---

## 🟡 ÖNCELİK 2: Test Altyapısı (Önemli)

### 2.1 Test Framework Kurulumu

#### 2.1.1 Vitest Kurulumu
**Yapılacaklar**:
- [ ] `vitest` paketini yükle
- [ ] `@testing-library/react` yükle
- [ ] `@testing-library/jest-dom` yükle
- [ ] `@testing-library/user-event` yükle
- [ ] `vitest.config.ts` oluştur
- [ ] `tsconfig.test.json` oluştur
- [ ] Test script'lerini `package.json`'a ekle
  - [ ] `test`: Unit testler
  - [ ] `test:watch`: Watch mode
  - [ ] `test:coverage`: Coverage raporu
  - [ ] `test:ui`: Vitest UI

**Tahmini Süre**: 2-3 saat

---

#### 2.1.2 Test Utilities
**Yapılacaklar**:
- [ ] `src/test-utils/` klasörü oluştur
- [ ] `setupTests.ts` oluştur
- [ ] `renderWithProviders.tsx` oluştur (QueryClient, Router, vb.)
- [ ] Mock data helpers
- [ ] Supabase mock client

**Tahmini Süre**: 4-6 saat

---

### 2.2 Unit Testler

#### 2.2.1 Service Testleri
**Yapılacaklar**:
- [ ] `transactionService.test.ts`
  - [ ] getTransactions
  - [ ] createTransaction
  - [ ] updateTransaction
  - [ ] deleteTransaction
- [ ] `budgetService.test.ts`
  - [ ] getBudgets
  - [ ] createBudget
  - [ ] updateBudget
- [ ] `employeeService.test.ts`
  - [ ] getEmployees
  - [ ] createEmployee
  - [ ] updateEmployee
- [ ] `notificationService.test.ts`
  - [ ] getNotifications
  - [ ] markAsRead
  - [ ] createNotification
- [ ] Diğer servisler için testler

**Hedef Coverage**: %80+
**Tahmini Süre**: 20-30 saat

---

#### 2.2.2 Utility Function Testleri
**Yapılacaklar**:
- [ ] `src/utils/format.ts` testleri
- [ ] `src/lib/utils.ts` testleri
- [ ] `src/lib/permissions.ts` testleri
- [ ] Export utility testleri

**Tahmini Süre**: 6-8 saat

---

#### 2.2.3 Hook Testleri
**Yapılacaklar**:
- [ ] `use-approval-notifications.test.ts`
- [ ] `use-form-template.test.ts`
- [ ] `use-currency.test.ts`
- [ ] `use-exchange-rate.test.ts`
- [ ] Diğer custom hook'lar

**Tahmini Süre**: 8-10 saat

---

### 2.3 Component Testleri

#### 2.3.1 UI Component Testleri
**Yapılacaklar**:
- [ ] Button component testi
- [ ] Input component testi
- [ ] Select component testi
- [ ] Dialog component testi
- [ ] Table component testi
- [ ] Form component testleri

**Tahmini Süre**: 10-12 saat

---

#### 2.3.2 Feature Component Testleri
**Yapılacaklar**:
- [ ] `LoginPage.test.tsx`
  - [ ] Form submission
  - [ ] Error handling
  - [ ] Success flow
- [ ] `DashboardPage.test.tsx`
  - [ ] Data loading
  - [ ] Chart rendering
  - [ ] KPI cards
- [ ] `TransactionsPage.test.tsx`
  - [ ] List rendering
  - [ ] Filtering
  - [ ] Pagination
- [ ] `EmployeesPage.test.tsx`
  - [ ] List rendering
  - [ ] Search
  - [ ] Create employee
- [ ] Diğer önemli sayfalar

**Tahmini Süre**: 20-25 saat

---

### 2.4 Integration Testleri

#### 2.4.1 API Integration Testleri
**Yapılacaklar**:
- [ ] Supabase connection testi
- [ ] Auth flow testi
- [ ] CRUD operations testleri
- [ ] Error handling testleri
- [ ] Realtime subscription testleri

**Tahmini Süre**: 8-10 saat

---

#### 2.4.2 User Flow Testleri
**Yapılacaklar**:
- [ ] Login → Dashboard flow
- [ ] Create transaction flow
- [ ] Approval flow
- [ ] Report generation flow

**Tahmini Süre**: 6-8 saat

---

### 2.5 E2E Testleri (Opsiyonel - Uzun Vadeli)

#### 2.5.1 Playwright Kurulumu
**Yapılacaklar**:
- [ ] `playwright` paketini yükle
- [ ] `playwright.config.ts` oluştur
- [ ] Test environment setup

**Tahmini Süre**: 2-3 saat

---

#### 2.5.2 E2E Test Senaryoları
**Yapılacaklar**:
- [ ] Complete user journey testleri
- [ ] Critical path testleri
- [ ] Cross-browser testleri

**Tahmini Süre**: 15-20 saat (opsiyonel)

---

### 2.6 Test Coverage

#### 2.6.1 Coverage Raporu
**Yapılacaklar**:
- [ ] Coverage threshold'ları ayarla (%80 hedef)
- [ ] CI/CD'de coverage raporu
- [ ] Coverage badge ekle (README'ye)

**Tahmini Süre**: 2-3 saat

---

#### 2.6.2 Coverage İyileştirmeleri
**Yapılacaklar**:
- [ ] Düşük coverage alanları tespit et
- [ ] Test ekle
- [ ] %80+ coverage hedefle

**Tahmini Süre**: Sürekli (test yazarken)

---

## 🟢 ÖNCELİK 3: Eksik Özellikler (Orta)

### 3.1 Raporlama Modülü Tamamlama

#### 3.1.1 Placeholder Raporları Tamamla
**Yapılacaklar**:
- [ ] Nakit Akış Raporu (`generateCashFlowReport`)
  - [ ] UI sayfası oluştur
  - [ ] Grafik görselleştirme
  - [ ] Tablo görünümü
  - [ ] Export özellikleri
- [ ] Bütçe Gerçekleşme Raporu (`generateBudgetPerformanceReport`)
  - [ ] UI sayfası oluştur
  - [ ] Bütçe vs gerçekleşme karşılaştırması
  - [ ] Sapma göstergeleri
  - [ ] Grafik görselleştirme
- [ ] Kategori Bazlı Analiz (`generateCategoryAnalysisReport`)
  - [ ] UI sayfası oluştur
  - [ ] Kategori drill-down
  - [ ] Trend analizi
  - [ ] Karşılaştırmalı görünüm
- [ ] Tedarikçi Analizi (`generateVendorAnalysisReport`)
  - [ ] UI sayfası oluştur
  - [ ] Tedarikçi bazlı harcama analizi
  - [ ] Toplam harcama grafikleri
  - [ ] İşlem detayları
- [ ] Proje Finansal Raporu (`generateProjectFinancialReport`)
  - [ ] UI sayfası oluştur
  - [ ] Proje bazlı finansal analiz
  - [ ] Bütçe vs harcama görünümü
  - [ ] Görev bazlı maliyet analizi

**Tahmini Süre**: 30-40 saat

---

### 3.2 Dashboard Widget Sistemi

#### 3.2.1 Drag & Drop UI
**Yapılacaklar**:
- [ ] `@dnd-kit` zaten yüklü, UI'ı oluştur
- [ ] Widget container component
- [ ] Drag handle ekle
- [ ] Drop zone'lar
- [ ] Grid layout sistemi
- [ ] Widget resize özelliği
- [ ] Layout kaydetme (zaten `dashboardStore` var)

**Tahmini Süre**: 12-15 saat

---

#### 3.2.2 Widget Türleri
**Yapılacaklar**:
- [ ] KPI widget'ları (mevcut)
- [ ] Chart widget'ları (mevcut)
- [ ] Table widget'ları (yeni)
- [ ] Custom widget builder (uzun vadeli)

**Tahmini Süre**: 8-10 saat

---

### 3.3 Gelişmiş Filtreleme

#### 3.3.1 Global Filter Component
**Yapılacaklar**:
- [ ] Tarih aralığı filtresi
- [ ] Kategori filtresi
- [ ] Departman filtresi
- [ ] Proje filtresi
- [ ] Durum filtresi
- [ ] Çoklu seçim desteği
- [ ] Filtre kaydetme (URL params)

**Tahmini Süre**: 8-10 saat

---

#### 3.3.2 Advanced Search
**Yapılacaklar**:
- [ ] Full-text search (backend entegrasyonu ile)
- [ ] Filter kombinasyonları
- [ ] Saved searches
- [ ] Search history

**Tahmini Süre**: 6-8 saat

---

### 3.4 Bulk Operations

#### 3.4.1 Toplu İşlemler
**Yapılacaklar**:
- [ ] Transaction listesinde bulk operations
  - [ ] Toplu silme
  - [ ] Toplu durum değiştirme
  - [ ] Toplu kategori atama
- [ ] Employee listesinde bulk operations
  - [ ] Toplu durum değiştirme
  - [ ] Toplu departman atama
- [ ] Approval listesinde bulk operations (zaten var, iyileştir)
  - [ ] Toplu onaylama
  - [ ] Toplu reddetme

**Tahmini Süre**: 10-12 saat

---

### 3.5 Excel Export İyileştirmeleri

#### 3.5.1 Export Özellikleri
**Yapılacaklar**:
- [ ] Tüm listelerde Excel export
- [ ] Filtrelenmiş verileri export et
- [ ] Custom kolon seçimi
- [ ] Formatting options
- [ ] Multi-sheet export

**Tahmini Süre**: 6-8 saat

---

### 3.6 PDF Raporlar

#### 3.6.1 PDF Generation
**Yapılacaklar**:
- [ ] jsPDF entegrasyonu (zaten yüklü)
- [ ] Rapor PDF template'leri
- [ ] Branding (logo, renkler)
- [ ] Chart'ları PDF'e ekle
- [ ] Multi-page support

**Tahmini Süre**: 10-12 saat

---

### 3.7 Workflow Builder UI

#### 3.7.1 Workflow Editor
**Yapılacaklar**:
- [ ] Visual workflow builder
- [ ] Drag & drop node'lar
- [ ] Condition builder
- [ ] Approval step configuration
- [ ] Preview mode
- [ ] Test mode

**Tahmini Süre**: 20-25 saat

---

### 3.8 Bildirim İyileştirmeleri

#### 3.8.1 Push Notifications
**Yapılacaklar**:
- [ ] Browser push notification API
- [ ] Permission handling
- [ ] Notification preferences
- [ ] Sound settings

**Tahmini Süre**: 6-8 saat

---

#### 3.8.2 Email Notifications
**Yapılacaklar**:
- [ ] Email template'leri
- [ ] SMTP configuration
- [ ] Email preferences per user
- [ ] Scheduled email reports

**Tahmini Süre**: 8-10 saat

---

### 3.9 Mobil Optimizasyonlar

#### 3.9.1 Responsive İyileştirmeleri
**Yapılacaklar**:
- [ ] Tüm sayfalarda mobil test
- [ ] Touch gesture'lar
- [ ] Mobile menu iyileştirmeleri
- [ ] Form'ları mobil için optimize et

**Tahmini Süre**: 8-10 saat

---

### 3.10 Accessibility (A11y)

#### 3.10.1 WCAG Compliance
**Yapılacaklar**:
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] ARIA labels
- [ ] Color contrast kontrolü
- [ ] Focus management

**Tahmini Süre**: 12-15 saat

---

## 📊 Toplam Tahmini Süre

### Öncelik 1: Backend Entegrasyonu
- **Toplam**: ~120-150 saat
- **Takım**: 1-2 developer
- **Süre**: 3-4 hafta (tam zamanlı)

### Öncelik 2: Test Altyapısı
- **Toplam**: ~80-100 saat
- **Takım**: 1 developer
- **Süre**: 2-3 hafta (tam zamanlı)

### Öncelik 3: Eksik Özellikler
- **Toplam**: ~120-150 saat
- **Takım**: 1-2 developer
- **Süre**: 3-4 hafta (tam zamanlı)

### Genel Toplam
- **Toplam**: ~320-400 saat
- **Takım**: 2-3 developer
- **Süre**: 8-10 hafta (tam zamanlı)

---

## 🎯 Önerilen Çalışma Planı

### Hafta 1-2: Backend Entegrasyonu (Kritik)
1. Notification Service entegrasyonu
2. Dashboard Service RPC düzeltmeleri
3. Report Service placeholder'ları tamamlama
4. Error handling iyileştirmeleri

### Hafta 3-4: Test Altyapısı
1. Vitest kurulumu
2. Service testleri
3. Component testleri
4. Integration testleri

### Hafta 5-6: Eksik Özellikler (Başlangıç)
1. Dashboard widget UI
2. Rapor placeholder'ları (UI)
3. Gelişmiş filtreleme

### Hafta 7-8: Devam
1. Bulk operations
2. Excel/PDF export iyileştirmeleri
3. Mobil optimizasyonlar

---

## 📝 Notlar

- ✅ = Tamamlandı
- [ ] = Yapılacak
- ⚠️ = Kısmen tamamlandı / İyileştirme gerekli

**Son Güncelleme**: 2024

