# Genel Merkez + Şubeler Yapısı - Devam Planı

## ✅ Tamamlanan İşler (Şube Yapısı)

### 1. Facility Tipi Güncellemesi
- ✅ `Facility` interface'ine `type: 'headquarters' | 'branch'` eklendi
- ✅ `parentFacilityId` eklendi (şubeler için genel merkez referansı)
- ✅ Mock facilities güncellendi (Genel Merkez + 5 Şube)

### 2. Servislerde FacilityId Filtreleme
- ✅ `transactionService` - facilityId filtreleme eklendi
- ✅ `budgetService` - facilityId filtreleme eklendi
- ✅ `employeeService` - facilityId filtreleme eklendi
- ✅ `payrollService` - facilityId filtreleme eklendi
- ✅ `attendanceService` - facilityId filtreleme eklendi
- ✅ `leaveService` - facilityId filtreleme eklendi

### 3. Sayfalarda FacilityId Kullanımı
- ✅ `TransactionsPage` - selectedFacility.id kullanılıyor
- ✅ `BudgetsPage` - selectedFacility.id kullanılıyor
- ✅ `EmployeesPage` - selectedFacility.id kullanılıyor
- ✅ `PayrollPage` - selectedFacility.id kullanılıyor
- ✅ `AttendancePage` - selectedFacility.id kullanılıyor
- ✅ `LeavesPage` - selectedFacility.id kullanılıyor

### 4. Mock Data Güncellemeleri
- ✅ Tüm mock datalara facilityId eklendi
- ✅ Generate fonksiyonları facilityId kullanıyor
- ✅ Create/Update işlemlerinde facilityId eklendi

### 5. Type Güncellemeleri
- ✅ `Transaction` interface'ine facilityId eklendi
- ✅ `Budget` interface'ine facilityId eklendi
- ✅ `Employee` interface'ine facilityId eklendi
- ✅ `LeaveRequest` interface'ine facilityId eklendi
- ✅ `Department` interface'ine facilityId eklendi
- ✅ `PayrollRecord` interface'ine facilityId eklendi
- ✅ `AttendanceRecord` interface'ine facilityId eklendi
- ✅ `CreateTransactionDTO` interface'ine facilityId eklendi

## 🎯 Yapılacak İşler (Genel Merkez Özellikleri)

### 1. Genel Merkez'den Şubelere Bütçe Aktarımı Servisi
**Dosya:** `src/services/finance/budgetTransferService.ts` (YENİ)

**Özellikler:**
- Genel Merkez'den şubelere bütçe aktarımı
- Aktarım kayıtları (transfer history)
- Şube bütçe durumu takibi
- Aktarım onay mekanizması

**Interface'ler:**
```typescript
interface BudgetTransfer {
  id: string
  fromFacilityId: string // Genel Merkez
  toFacilityId: string // Şube
  amount: number
  currency: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  approvedBy?: string
  approvedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface BudgetTransferRequest {
  toFacilityId: string
  amount: number
  currency: string
  description?: string
}
```

**Fonksiyonlar:**
- `createBudgetTransfer(request: BudgetTransferRequest): Promise<BudgetTransfer>`
- `getBudgetTransfers(filters?: { fromFacilityId?, toFacilityId?, status? }): Promise<BudgetTransfer[]>`
- `approveBudgetTransfer(id: string): Promise<BudgetTransfer>`
- `rejectBudgetTransfer(id: string, reason?: string): Promise<BudgetTransfer>`
- `completeBudgetTransfer(id: string): Promise<BudgetTransfer>`

### 2. Şubelerin Bütçe Aktarımını Gelir Olarak Kaydetmesi
**Dosya:** `src/services/finance/budgetTransferService.ts` (güncelleme)

**Mantık:**
- Genel Merkez'den şubeye bütçe aktarımı yapıldığında
- Şube otomatik olarak bu aktarımı **gelir** olarak kaydeder
- Transaction oluşturulur:
  - Type: `income`
  - Category: "Genel Merkez Bütçe Aktarımı" (özel kategori)
  - Amount: Aktarılan tutar
  - Description: "Genel Merkez'den bütçe aktarımı - [Transfer ID]"

**Gerekli:**
- Özel kategori oluştur: "Genel Merkez Bütçe Aktarımı" (income category)
- `completeBudgetTransfer` fonksiyonunda transaction oluştur
- Şube bütçesine otomatik ekleme

### 3. Genel Merkez Dashboard'u
**Dosya:** `src/features/dashboard/HeadquartersDashboardPage.tsx` (YENİ)

**Özellikler:**
- Tüm şubelerin özet bilgileri
- Şube bazlı finansal durum
- Şube bazlı personel sayıları
- Şube bazlı proje durumları
- Bütçe aktarım talepleri
- Şube performans karşılaştırması

**Bileşenler:**
- `BranchSummaryCard` - Şube özet kartı
- `BranchFinancialChart` - Şube finansal grafik
- `BudgetTransferRequests` - Bütçe aktarım talepleri listesi
- `BranchComparisonTable` - Şube karşılaştırma tablosu

**Route:**
- `/headquarters/dashboard` - Genel Merkez dashboard'u
- Sadece `type: 'headquarters'` olan facility'ler erişebilir

### 4. Bütçe Aktarım UI
**Dosya:** `src/features/finance/budget-transfers/BudgetTransferPage.tsx` (YENİ)

**Özellikler:**
- Bütçe aktarım talebi oluşturma
- Aktarım taleplerini görüntüleme
- Aktarım onay/red işlemleri
- Aktarım geçmişi

**Bileşenler:**
- `BudgetTransferDialog` - Yeni aktarım talebi
- `BudgetTransferTable` - Aktarım listesi
- `BudgetTransferDetailModal` - Aktarım detayı

### 5. Genel Merkez Menü Öğeleri
**Dosya:** `src/components/layout/Sidebar.tsx` (güncelleme)

**Yeni Menü Öğeleri:**
- Genel Merkez Dashboard (sadece headquarters için)
- Bütçe Aktarımları (sadece headquarters için)
- Şube Yönetimi (sadece headquarters için)

**Koşullu Görünürlük:**
```typescript
const isHeadquarters = selectedFacility?.type === 'headquarters'
```

## 📋 Detaylı Yapılacaklar Listesi

### Adım 1: Budget Transfer Service
1. `src/services/finance/budgetTransferService.ts` oluştur
2. Mock data ve servis fonksiyonları
3. Transfer history tracking
4. Approval workflow

### Adım 2: Otomatik Gelir Kaydı
1. Özel kategori oluştur: "Genel Merkez Bütçe Aktarımı"
2. `completeBudgetTransfer` içinde transaction oluştur
3. Şube bütçesine ekleme
4. Test et

### Adım 3: Headquarters Dashboard
1. `HeadquartersDashboardPage.tsx` oluştur
2. Branch summary cards
3. Financial charts
4. Budget transfer requests widget
5. Branch comparison table

### Adım 4: Budget Transfer UI
1. `BudgetTransferPage.tsx` oluştur
2. `BudgetTransferDialog` component
3. `BudgetTransferTable` component
4. Approval/rejection actions

### Adım 5: Sidebar Güncellemesi
1. Headquarters menü öğeleri ekle
2. Koşullu görünürlük
3. Route'ları ekle

### Adım 6: Route Güncellemeleri
1. `src/App.tsx` içine headquarters route'ları ekle
2. Guard'ları güncelle (sadece headquarters erişebilir)

## 🔧 Teknik Detaylar

### Mock Data Yapısı
```typescript
// Mock budget transfers
const mockBudgetTransfers: BudgetTransfer[] = [
  {
    id: 'bt-001',
    fromFacilityId: 'facility-000', // Genel Merkez
    toFacilityId: 'facility-001', // Niamey Şubesi
    amount: 500000,
    currency: 'TRY',
    description: '2025 Q1 Bütçe Aktarımı',
    status: 'completed',
    approvedBy: 'user-001',
    approvedAt: '2025-01-01T10:00:00Z',
    completedAt: '2025-01-01T10:05:00Z',
    createdAt: '2025-01-01T09:00:00Z',
    updatedAt: '2025-01-01T10:05:00Z',
  },
  // ...
]
```

### Özel Kategori
```typescript
// src/data/mockFinanceData.ts içine ekle
{
  id: 'cat-budget-transfer',
  name: 'Genel Merkez Bütçe Aktarımı',
  type: 'income',
  color: '#10B981',
  parentId: undefined,
}
```

### Route Yapısı
```typescript
// src/App.tsx
<Route path="/headquarters" element={<HeadquartersGuard />}>
  <Route path="dashboard" element={<HeadquartersDashboardPage />} />
  <Route path="budget-transfers" element={<BudgetTransferPage />} />
  <Route path="branches" element={<BranchesPage />} />
</Route>
```

## 🎨 UI/UX Notları

1. **Genel Merkez Dashboard:**
   - Şube kartları grid layout
   - Her şube için özet metrikler
   - Tıklanınca şube detayına git

2. **Bütçe Aktarım Sayfası:**
   - Tablo görünümü
   - Filtreleme (şube, durum, tarih)
   - Yeni aktarım butonu (sağ üst)
   - Onay/Red butonları (action column)

3. **Bütçe Aktarım Dialog:**
   - Şube seçimi (dropdown)
   - Tutar girişi
   - Açıklama (opsiyonel)
   - Onay butonu

## ✅ Test Senaryoları

1. Genel Merkez kullanıcısı şubeye bütçe aktarımı yapar
2. Şube otomatik olarak gelir olarak kaydeder
3. Şube bütçesi güncellenir
4. Genel Merkez dashboard'da tüm şubeler görünür
5. Şube kullanıcısı sadece kendi verilerini görür

## 📝 Notlar

- Şu anki sistem tamamen şube bazlı çalışıyor ✅
- Her şube kendi verilerini görüyor ✅
- Genel Merkez özellikleri eklenecek
- Bütçe aktarımı onay mekanizması olacak
- Şubeler otomatik gelir kaydı yapacak

---

**Son Güncelleme:** Şube yapısı tamamlandı, Genel Merkez özelliklerine geçilecek.

