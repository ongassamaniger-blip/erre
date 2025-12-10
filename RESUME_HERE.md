# 🎯 3 Saat Sonra Devam Edilecek Yer

## 📍 Mevcut Durum

✅ **Şube yapısı tamamlandı!**
- Tüm servislerde facilityId filtreleme aktif
- Tüm sayfalarda selectedFacility.id kullanılıyor
- Mock datalar şube bazında dağıtıldı
- Her şube kendi verilerini görüyor

## 🚀 Sonraki Adım: Genel Merkez Özellikleri

### 1. İlk Yapılacak: Budget Transfer Service
**Dosya:** `src/services/finance/budgetTransferService.ts` (YENİ DOSYA OLUŞTUR)

**Başlangıç Kodu:**
```typescript
import type { BudgetTransfer, BudgetTransferRequest } from '@/types/finance'

// Mock data
let mockBudgetTransfers: BudgetTransfer[] = []

export const budgetTransferService = {
  async createBudgetTransfer(request: BudgetTransferRequest): Promise<BudgetTransfer> {
    // Genel Merkez'den şubeye bütçe aktarımı oluştur
  },
  
  async getBudgetTransfers(filters?: {
    fromFacilityId?: string
    toFacilityId?: string
    status?: string
  }): Promise<BudgetTransfer[]> {
    // Aktarım listesini getir
  },
  
  async approveBudgetTransfer(id: string): Promise<BudgetTransfer> {
    // Aktarımı onayla
  },
  
  async completeBudgetTransfer(id: string): Promise<BudgetTransfer> {
    // Aktarımı tamamla ve şubeye gelir olarak kaydet
    // 1. Transaction oluştur (income, "Genel Merkez Bütçe Aktarımı" kategorisi)
    // 2. Şube bütçesine ekle
  }
}
```

### 2. Type Tanımlamaları
**Dosya:** `src/types/finance.ts` (EKLE)

```typescript
export interface BudgetTransfer {
  id: string
  fromFacilityId: string
  toFacilityId: string
  amount: number
  currency: Currency
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetTransferRequest {
  toFacilityId: string
  amount: number
  currency: string
  description?: string
}
```

### 3. Özel Kategori Ekle
**Dosya:** `src/data/mockFinanceData.ts` (EKLE)

```typescript
// mockCategories array'ine ekle
{
  id: 'cat-budget-transfer',
  name: 'Genel Merkez Bütçe Aktarımı',
  type: 'income',
  color: '#10B981',
}
```

## 📋 Yapılacaklar Sırası

1. ✅ Budget Transfer Service oluştur
2. ✅ Type tanımlamaları ekle
3. ✅ Özel kategori ekle
4. ✅ Otomatik gelir kaydı mekanizması
5. ✅ Headquarters Dashboard sayfası
6. ✅ Budget Transfer UI sayfası
7. ✅ Sidebar güncellemeleri

## 🔍 Kontrol Listesi

Devam etmeden önce kontrol et:
- [ ] `NEXT_STEPS.md` dosyasını oku
- [ ] `CURRENT_STATUS.md` dosyasını oku
- [ ] Mevcut kod yapısını anla
- [ ] Budget Transfer Service'i oluştur
- [ ] Test et

## 💡 Önemli Notlar

1. **Genel Merkez Kullanıcısı:**
   - `authStore.ts` içinde `facilityAccess: ['GM01']` olmalı
   - Genel Merkez seçildiğinde `type: 'headquarters'` olmalı

2. **Şube Kullanıcısı:**
   - Şube seçildiğinde sadece kendi verilerini görür
   - Bütçe aktarımı gelir olarak otomatik kaydedilir

3. **Bütçe Aktarım Akışı:**
   ```
   Genel Merkez → Bütçe Aktarım Talebi Oluştur
   → Onayla
   → Tamamla
   → Şube'ye Gelir Olarak Kaydet
   → Şube Bütçesine Ekle
   ```

## 🎨 UI/UX Hatırlatmaları

- Genel Merkez dashboard'da şube kartları grid layout
- Her şube için özet metrikler göster
- Bütçe aktarım sayfasında tablo + filtreleme
- Onay/Red butonları action column'da

---

**Son Güncelleme:** Şube yapısı tamamlandı, Genel Merkez özelliklerine geçilecek.

**Başlangıç Noktası:** `src/services/finance/budgetTransferService.ts` dosyasını oluştur.

