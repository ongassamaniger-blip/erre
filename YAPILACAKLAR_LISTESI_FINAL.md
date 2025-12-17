# 📋 YAPILACAKLAR LİSTESİ - Final Kontrol

**Tarih**: 2024  
**Durum**: Migration'lar ve Entegrasyonlar Bekliyor ⚠️

---

## 🚨 ÖNCELİKLİ - MUTLAKA YAPILMALI

### 1. 📊 SUPABASE MIGRATION'LARI (5 Dosya)

#### ✅ Migration Dosyaları Hazır:
- `migrations/add_notification_columns.sql` - Notification tablosu iyileştirmeleri
- `migrations/fix_dashboard_summary_rpc.sql` - Dashboard RPC fonksiyonu düzeltmeleri
- `migrations/add_search_indexes.sql` - Arama index'leri
- `migrations/add_performance_indexes.sql` - Performance index'leri
- `migrations/add_employee_columns.sql` - Employee tablosu iyileştirmeleri

#### 🔧 Nasıl Uygulanır:
1. **Supabase Dashboard'a git**
2. **SQL Editor** bölümüne git
3. **Her migration dosyasını sırayla çalıştır:**
   ```sql
   -- 1. Notification columns
   -- migrations/add_notification_columns.sql içeriğini yapıştır ve çalıştır
   
   -- 2. Dashboard RPC
   -- migrations/fix_dashboard_summary_rpc.sql içeriğini yapıştır ve çalıştır
   
   -- 3. Search indexes
   -- migrations/add_search_indexes.sql içeriğini yapıştır ve çalıştır
   
   -- 4. Performance indexes
   -- migrations/add_performance_indexes.sql içeriğini yapıştır ve çalıştır
   
   -- 5. Employee columns
   -- migrations/add_employee_columns.sql içeriğini yapıştır ve çalıştır
   ```

#### ⚠️ Dikkat:
- Migration'ları sırayla çalıştırın
- Her migration'dan sonra kontrol edin
- Hata alırsanız, hata mesajını not edin

---

### 2. 🔧 EDGE FUNCTION DEPLOY (Kullanıcı Oluşturma)

#### ✅ Edge Function Hazır:
- `supabase/functions/create-user/index.ts` - Kullanıcı oluşturma fonksiyonu

#### 🔧 Nasıl Deploy Edilir:

**Yöntem 1: Supabase Dashboard (Önerilen)**
1. **Supabase Dashboard'a git**
2. **Edge Functions** bölümüne git
3. **Create Function** tıkla
4. **Function name**: `create-user`
5. **Code**: `supabase/functions/create-user/index.ts` dosyasındaki kodu yapıştır
6. **Deploy** et

**Yöntem 2: Supabase CLI (Gelişmiş)**
```bash
# Supabase CLI kurulumu (eğer yoksa)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy create-user
```

#### ⚠️ Dikkat:
- Edge Function için `SUPABASE_SERVICE_ROLE_KEY` otomatik olarak sağlanır
- Function deploy edildikten sonra test edin

---

## ✅ TAMAMLANAN ÖZELLİKLER (Test Edilmeli)

### 1. Backend Entegrasyonları ✅
- ✅ Notification Service - Supabase entegrasyonu
- ✅ Dashboard Service - RPC düzeltmeleri
- ✅ Global Search Service - Supabase entegrasyonu
- ✅ Report Service - Placeholder raporları
- ✅ Error Handler - Merkezi hata yönetimi
- ✅ Realtime Subscriptions - Notifications
- ✅ Loading States - Skeleton loaders
- ✅ Performance Optimizasyonları - Query optimization

### 2. Kullanıcı Yönetimi ✅
- ✅ Kullanıcı listesi, arama, filtreleme
- ✅ Yeni kullanıcı oluşturma (Edge Function gerekli)
- ✅ Kullanıcı düzenleme
- ✅ Kullanıcı silme/deaktif etme
- ✅ Facility yetkilendirme
- ✅ Şifre yönetimi
- ✅ Super Admin + Genel Merkez yetkilendirmesi

---

## 🧪 TEST EDİLMESİ GEREKENLER

### 1. Migration Sonrası Testler

#### Notification Service:
- [ ] Bildirim oluşturma
- [ ] Bildirim okundu işaretleme
- [ ] Tüm bildirimleri okundu işaretleme
- [ ] Bildirim silme
- [ ] Realtime subscription (yeni bildirim geldiğinde toast gösterimi)

#### Dashboard Service:
- [ ] Dashboard özeti yükleme
- [ ] Trend hesaplamaları (incomeChange, expenseChange, vb.)
- [ ] Monthly trend grafiği
- [ ] Pending transactions
- [ ] Category expenses/incomes

#### Global Search:
- [ ] Arama yapma (tüm modüller)
- [ ] Facility bazlı filtreleme
- [ ] Sonuç gruplandırma
- [ ] Arama performansı

#### Performance:
- [ ] Query performansı (SELECT * yerine spesifik kolonlar)
- [ ] Index kullanımı
- [ ] Cache stratejisi
- [ ] getAll fonksiyonları limit kontrolü

### 2. Kullanıcı Yönetimi Testleri

#### Edge Function Deploy Sonrası:
- [ ] Yeni kullanıcı oluşturma
- [ ] Kullanıcı düzenleme
- [ ] Kullanıcı silme/deaktif etme
- [ ] Facility erişimi verme/çıkarma
- [ ] Şifre sıfırlama
- [ ] Permission kontrolü (sadece Super Admin + Genel Merkez)

---

## 📝 EKSİK/KONTROL EDİLMESİ GEREKENLER

### 1. Database Kontrolleri

#### RPC Fonksiyonları:
- [ ] `get_dashboard_summary` RPC fonksiyonu var mı?
- [ ] RPC fonksiyonu doğru çalışıyor mu?
- [ ] Return type'lar doğru mu?

#### Tablolar:
- [ ] `notifications` tablosunda `priority` ve `metadata` kolonları var mı?
- [ ] `text_search_vectors` kolonları eklenmiş mi?
- [ ] Index'ler oluşturulmuş mu?
- [ ] Performance index'leri çalışıyor mu?

#### Realtime:
- [ ] Realtime subscription'lar aktif mi?
- [ ] `notifications` tablosu için Realtime enabled mi?

### 2. Environment Variables

#### Supabase:
- [ ] `VITE_SUPABASE_URL` doğru mu?
- [ ] `VITE_SUPABASE_ANON_KEY` doğru mu?
- [ ] Edge Function için `SUPABASE_SERVICE_ROLE_KEY` var mı?

### 3. Security & Permissions

#### RLS (Row Level Security):
- [ ] RLS politikaları doğru mu?
- [ ] Kullanıcılar sadece kendi facility'lerine erişebiliyor mu?
- [ ] Super Admin tüm verilere erişebiliyor mu?

---

## 🚀 DEPLOYMENT ADIMLARI

### 1. Migration'ları Uygula
```sql
-- Supabase SQL Editor'da sırayla çalıştır:
1. add_notification_columns.sql
2. fix_dashboard_summary_rpc.sql
3. add_search_indexes.sql
4. add_performance_indexes.sql
5. add_employee_columns.sql
```

### 2. Edge Function Deploy Et
- Supabase Dashboard → Edge Functions → Create Function
- Function name: `create-user`
- Code: `supabase/functions/create-user/index.ts`

### 3. Test Et
- Tüm özellikleri test et
- Hata loglarını kontrol et
- Performance'ı kontrol et

### 4. Production'a Al
- Migration'ları production'da çalıştır
- Edge Function'ı production'da deploy et
- Final test yap

---

## 📊 ÖNCELİK SIRASI

### 🔴 YÜKSEK ÖNCELİK (Hemen Yapılmalı)
1. ✅ Migration'ları uygula (5 dosya)
2. ✅ Edge Function deploy et
3. ✅ Temel testler yap

### 🟡 ORTA ÖNCELİK (Bu Hafta)
1. ✅ Tüm özellikleri test et
2. ✅ Performance kontrolü yap
3. ✅ Security kontrolü yap

### 🟢 DÜŞÜK ÖNCELİK (Gelecek)
1. ✅ Production deployment
2. ✅ Monitoring kurulumu
3. ✅ Backup stratejisi

---

## 📋 KONTROL LİSTESİ

### Migration'lar
- [ ] `add_notification_columns.sql` uygulandı
- [ ] `fix_dashboard_summary_rpc.sql` uygulandı
- [ ] `add_search_indexes.sql` uygulandı
- [ ] `add_performance_indexes.sql` uygulandı
- [ ] `add_employee_columns.sql` uygulandı

### Edge Functions
- [ ] `create-user` function deploy edildi
- [ ] Function test edildi

### Testler
- [ ] Notification Service test edildi
- [ ] Dashboard Service test edildi
- [ ] Global Search test edildi
- [ ] Kullanıcı Yönetimi test edildi
- [ ] Performance test edildi

### Security
- [ ] RLS politikaları kontrol edildi
- [ ] Permission kontrolü çalışıyor
- [ ] Super Admin yetkilendirmesi çalışıyor

---

## 🎯 SONUÇ

**Yapılması Gerekenler:**
1. ✅ **5 Migration dosyasını Supabase'de çalıştır**
2. ✅ **Edge Function'ı deploy et**
3. ✅ **Tüm özellikleri test et**

**Süre Tahmini:**
- Migration'lar: ~30 dakika
- Edge Function: ~15 dakika
- Test: ~1-2 saat

**Toplam:** ~2-3 saat

---

**Son Güncelleme**: 2024  
**Durum**: ⚠️ Migration'lar ve Entegrasyonlar Bekliyor

