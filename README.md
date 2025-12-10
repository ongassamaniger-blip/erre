# Global Kurumsal Yönetim Sistemi

Modern ve kapsamlı bir çoklu tesis yönetim sistemi. React, TypeScript, ve shadcn/ui ile geliştirilmiştir.

# Global Kurumsal Yönetim Sistemi

Modern ve kapsamlı bir çoklu tesis yönetim sistemi. React, TypeScript, ve shadcn/ui ile geliştirilmiştir.

## 🚀 Özellikler

### ✅ Tamamlanan - Plan 1-5

#### **Kimlik Doğrulama ve Tesis Yönetimi**
- Mock kullanıcı doğrulama sistemi
- Çoklu tesis yönetimi ve tesis seçim ekranı
- Kullanıcı rol ve yetki yapısı

#### **Dashboard**
- 4 KPI kartı (Gelir, Gider, Onaylar, Çalışan Sayısı)
- Aylık gelir/gider trend grafiği
- Kategori bazlı gider dağılımı (pasta grafiği)
- Son işlemler ve yaklaşan ödemeler tabloları
- **YENİ**: Dashboard özelleştirme (widget ekleme/çıkarma, düzenleme)

#### **Finans Modülü**
- **İşlemler**: Gelir ve gider işlemleri yönetimi
- **Bütçeler**: Bütçe planlama ve takip
- **Raporlar**: Finansal raporlama ve analiz
- **Hesap Planı**: Muhasebe hesap yönetimi
- **Tedarikçiler & Müşteriler**: İlişki yönetimi

#### **İnsan Kaynakları Modülü**
- **Çalışanlar**: Personel kayıt ve profil yönetimi
- **İzin Talepleri**: İzin onay süreci
- **Devamsızlık**: Devam takibi
- **Bordro**: Maaş ve ödemeler
- **Departmanlar**: Organizasyon yapısı

#### **Proje Yönetimi Modülü**
- Proje listeleme ve detay sayfaları
- Görev yönetimi (Board görünümü)
- Ekip üyeleri ve roller
- Proje bütçesi ve harcama takibi
- Milestone ve döküman yönetimi
- Aktivite timeline

#### **Kurban Modülü**
- Kampanya yönetimi
- Bağış kayıtları ve takibi
- Kesim programlama
- Dağıtım yönetimi

#### **Raporlama & Analytics** ⭐ YENİ
- **Rapor Merkezi**:
  - Gelir-Gider Raporu (tam uygulanmış)
  - Nakit Akış Raporu (placeholder)
  - Bütçe Gerçekleşme Raporu (placeholder)
  - Kategori Bazlı Analiz (placeholder)
  - Tedarikçi Analizi (placeholder)
  - Proje Finansal Raporu (placeholder)
- **Rapor Parametreleri**:
  - Tarih aralığı seçimi
  - Hızlı seçenekler (Bu ay, Geçen ay, Bu yıl, Geçen yıl)
  - Karşılaştırma dönemi
  - Filtreler (Kategori, Departman, Proje, Tedarikçi)
  - Gruplandırma (Gün/Hafta/Ay/Yıl)
  - Görselleştirme (Tablo/Grafik/İkisi)
- **Gelir-Gider Raporu Özellikleri**:
  - KPI kartları (Toplam Gelir, Toplam Gider, Net)
  - Trend değişimleri
  - İnteraktif bar grafik
  - Detaylı kategori tablosu
  - Alt kategori drill-down
  - Önceki dönem karşılaştırma
- **Zamanlanmış Raporlar**:
  - Otomatik rapor oluşturma
  - E-posta gönderimi (mock)
  - Sıklık ayarları (Günlük/Haftalık/Aylık)
  - Format seçimi (PDF/Excel)
  - Alıcı listesi yönetimi

#### **Onay Merkezi** ⭐ YENİ
- **Onay Talepleri**:
  - Finans, HR, Proje, Kurban modüllerinden onaylar
  - Öncelik seviyeleri (Düşük, Orta, Yüksek, Acil)
  - Durum göstergeleri (Beklemede, Onaylandı, Reddedildi)
  - SLA ve deadline takibi
- **Toplu İşlemler**:
  - Çoklu onaylama
  - Çoklu reddetme
  - Yorumlama sistemi
- **Filtreler**:
  - Modül bazlı
  - Durum bazlı
  - Öncelik bazlı
  - Tarih aralığı
- **İstatistikler**:
  - Bekleyen onaylar
  - Onaylanan/Reddedilen sayıları
  - Acil onaylar

#### **Bildirimler** ⭐ YENİ
- Header'da bildirim paneli
- Bildirim tipleri:
  - Onay bekleyen
  - Onaylandı/Reddedildi
  - Hatırlatmalar
  - Deadline uyarıları
  - Yorumlar ve mention'lar
  - Sistem bildirimleri
- Okundu/okunmadı durumu
- "Tümünü okundu işaretle" özelliği

#### **Ayarlar Modülü** ⭐ YENİ
- **Genel Ayarlar**:
  - Tesis bilgileri
  - İletişim bilgileri
  - Adres yönetimi
  - Zaman dilimi
  - Mali yıl başlangıcı
- **Para Birimi Ayarları**:
  - Ana para birimi seçimi
  - İkincil para birimleri
  - Döviz kuru kaynağı (TCMB, ExchangeRate-API, Manuel)
  - Otomatik güncelleme sıklığı
  - Manuel kur güncelleme
- **Bölgesel Ayarlar**:
  - Dil seçimi
  - Tarih formatı
  - Saat formatı (12/24)
  - Sayı formatı (binlik/ondalık ayracı)
- **Modül Yönetimi**:
  - Modül aktif/pasif durumu
  - Modül yapılandırma
- **Form Yönetimi** 🆕:
  - Form şablonları listesi ve düzenleme
  - Çoklu dil desteği (TR/EN/FR/AR)
  - Alan görünürlük ve zorunluluk ayarları
  - Alan sıralaması (drag-to-reorder)
  - Rol bazlı alan kısıtlamaları
  - Dinamik form render altyapısı
  - 5 hazır form şablonu:
    * Finans İşlemi (Gelir/Gider)
    * Yeni Proje
    * Kurban Bağışı
    * Yeni Çalışan
    * İzin Talebi
- **Kullanıcı Yönetimi**:
  - Kullanıcı listesi
  - Yeni kullanıcı ekleme
  - Rol atama
  - Tesis yetkisi verme
  - Durum yönetimi (Aktif/Pasif/Askıda)
- **Rol ve İzin Yönetimi**:
  - Rol tanımlama
  - İzin matrisi
  - Modül bazlı yetkilendirme
  - Aksiyonlar (View, Create, Edit, Delete, Approve)
- **Workflow Builder**:
  - Onay akışı kuralları
  - Koşullu yönlendirme
  - Tutar bazlı onay hiyerarşisi
  - Rol bazlı atama

#### **Navigasyon ve UI**
- Daraltılabilir sidebar
- Breadcrumb navigasyon
- Tesis seçici dropdown
- Kullanıcı menüsü
- Responsive tasarım (Mobil, Tablet, Desktop)

## 🛠️ Teknoloji Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: React Router v7
- **State Management**: Zustand (persist middleware ile)
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **Icons**: Phosphor Icons
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Forms**: React Hook Form + Zod

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.

## 🔑 Test Kullanıcıları

### Yönetici (Çoklu Tesis Erişimi)
- **E-posta**: `admin@example.com`
- **Şifre**: `123456`
- **Tesisler**: NIM01, IST01, ANK01
- **Rol**: Super Admin

### Müdür (Tek Tesis Erişimi)
- **E-posta**: `manager@example.com`
- **Şifre**: `123456`
- **Tesis**: IST01
- **Rol**: Manager

## 📂 Proje Yapısı

```
src/
├── components/
│   ├── common/          # Ortak bileşenler (Breadcrumb, vb.)
│   ├── forms/           # 🆕 Form bileşenleri (DynamicForm)
│   ├── guards/          # Route guard'ları (Auth, Facility)
│   ├── layout/          # Layout bileşenleri (Sidebar, Header, MainLayout)
│   └── ui/              # shadcn UI bileşenleri (40+ hazır bileşen)
├── data/                # Mock veri dosyaları
│   ├── mockDashboard.ts
│   ├── mockFacilities.ts
│   ├── mockFinanceData.ts
│   └── mockHRData.ts
├── features/            # Özellik bazlı modüller
│   ├── auth/           # Giriş sayfası
│   ├── tenant/         # Tesis seçim sayfası
│   ├── dashboard/      # Ana dashboard
│   ├── finance/        # Finans modülü sayfaları
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── reports/
│   │   ├── chart-of-accounts/
│   │   └── vendors-customers/
│   ├── hr/             # İnsan Kaynakları sayfaları
│   │   ├── employees/
│   │   ├── leaves/
│   │   ├── attendance/
│   │   ├── payroll/
│   │   └── departments/
│   ├── projects/       # Proje yönetimi sayfaları
│   ├── qurban/         # Kurban modülü sayfaları
│   ├── reports/        # ⭐ Raporlama sayfaları
│   │   ├── ReportCenterPage.tsx
│   │   ├── ReportGeneratePage.tsx
│   │   └── ScheduledReportsPage.tsx
│   ├── approvals/      # ⭐ Onay merkezi
│   └── settings/       # ⭐ Ayarlar
│       └── forms/      # 🆕 Form yönetimi
│           ├── FormsPage.tsx
│           └── FormEditPage.tsx
├── hooks/               # 🆕 Custom React hooks
│   ├── use-mobile.ts
│   ├── use-approval-notifications.ts
│   └── use-form-template.ts
├── lib/                 # 🆕 Utility functions
│   ├── utils.ts
│   └── permissions.ts
├── services/           # ⭐ Mock API servisleri
│   ├── reportService.ts
│   ├── approvalService.ts
│   ├── notificationService.ts
│   ├── settingsService.ts
│   ├── formsService.ts          # 🆕 Form şablonları servisi
│   ├── dashboardService.ts
│   ├── finance/
│   ├── projects/
│   ├── qurban/
│   ├── employeeService.ts
│   └── leaveService.ts
├── store/              # Zustand store'ları
│   └── authStore.ts
├── types/              # ⭐ TypeScript tip tanımları
│   ├── index.ts
│   ├── forms.ts                  # 🆕 Form tipleri
│   ├── reports.ts
│   ├── approvals.ts
│   ├── notifications.ts
│   ├── settings.ts
│   ├── dashboard.ts
│   ├── finance.ts
│   └── hr.ts
├── App.tsx             # Ana uygulama ve routing
└── main.tsx             # Giriş noktası
```

## 🎨 Tasarım Sistemi

### Renk Paleti

- **Primary (Mavi)**: Güven ve profesyonellik için ana marka rengi
- **Secondary (Gri)**: Destekleyici ve nötr elementler
- **Accent (Turuncu)**: Dikkat çekici aksiyonlar ve önemli metrikler
- **Success (Yeşil)**: Olumlu durumlar ve gelir göstergeleri
- **Destructive (Kırmızı)**: Uyarılar ve gider göstergeleri

### Tipografi

- **Font Family**: Inter (300-700 ağırlıkları)
- **H1**: 32px, SemiBold, -0.02em letter spacing
- **H2**: 24px, SemiBold, -0.01em letter spacing
- **H3**: 18px, Medium
- **Body**: 14px, Regular, 1.6 line height
- **Small**: 12px, Regular, 1.5 line height

### Animasyonlar

- Sidebar açılma/kapanma: 300ms spring animasyon
- Kart hover efektleri: scale(1.02) + shadow
- Sayfa geçişleri: fade + slide up
- Loading durumları: skeleton komponetleri

## 🔐 Kimlik Doğrulama Akışı

1. Kullanıcı `/login` sayfasına yönlendirilir
2. Geçerli credentials ile giriş yapılır
3. Kullanıcının tesis erişim sayısı kontrol edilir:
   - **Tek tesis**: Direkt dashboard'a yönlendirilir
   - **Çoklu tesis**: Tesis seçim sayfasına yönlendirilir
4. Tesis seçildikten sonra dashboard açılır
5. Session bilgisi localStorage'da saklanır (Zustand persist)

## 🛣️ Route Yapısı

### Public Routes
- `/login` - Giriş sayfası

### Protected Routes (AuthGuard)
- `/tenant-select` - Tesis seçim sayfası

### Facility Protected Routes (AuthGuard + FacilityGuard)
- `/` - Dashboard
- `/finance/*` - Finans Modülü Sayfaları
  - `/finance/transactions` - İşlemler
  - `/finance/transactions/:id` - İşlem Detayı
  - `/finance/budgets` - Bütçeler
  - `/finance/reports` - Finansal Raporlar
  - `/finance/chart-of-accounts` - Hesap Planı
  - `/finance/vendors-customers` - Tedarikçiler & Müşteriler
- `/hr/*` - İnsan Kaynakları Sayfaları
  - `/hr/employees` - Çalışanlar
  - `/hr/employees/:id` - Çalışan Detayı
  - `/hr/leaves` - İzin Talepleri
  - `/hr/attendance` - Devamsızlık
  - `/hr/payroll` - Bordro
  - `/hr/departments` - Departmanlar
- `/projects` - Projeler Listesi
- `/projects/:id` - Proje Detayı
- `/qurban` - Kurban Modülü
- `/reports/center` - ⭐ Rapor Merkezi
- `/reports/generate/:reportId` - ⭐ Rapor Oluşturma
- `/reports/scheduled` - ⭐ Zamanlanmış Raporlar
- `/approvals` - ⭐ Onay Merkezi
- `/settings` - ⭐ Ayarlar
- `/settings/forms` - 🆕 Form Yönetimi
- `/settings/forms/:code` - 🆕 Form Düzenleme

## 📊 Mock Veri ve Servisler

Tüm veriler mock olarak sağlanmaktadır:

### Veri Kaynakları
- **Kullanıcılar**: `src/store/authStore.ts`
- **Tesisler**: `src/data/mockFacilities.ts`
- **Dashboard Metrikleri**: `src/data/mockDashboard.ts`
- **Finans Verileri**: `src/data/mockFinanceData.ts`
- **İK Verileri**: `src/data/mockHRData.ts`

### Mock Servisler
Tüm servisler `/src/services/` klasöründe bulunmaktadır ve gerçek API'lara kolayca geçiş için hazırlanmıştır:

- **reportService.ts**: Rapor tipler, oluşturma, zamanlanmış raporlar
- **approvalService.ts**: Onay talepleri, toplu işlemler, istatistikler
- **notificationService.ts**: Bildirimler, okundu işaretleme
- **settingsService.ts**: Genel, para birimi, bölgesel ayarlar, modüller, kullanıcılar, roller, workflow
- **formsService.ts** 🆕: Form şablonları, alan yönetimi, çoklu dil desteği
- **dashboardService.ts**: Widget yönetimi, layout kaydetme
- **finance/**: Finans modülü servisleri
- **projects/**: Proje yönetimi servisleri
- **qurban/**: Kurban modülü servisleri
- **employeeService.ts**: Çalışan yönetimi
- **leaveService.ts**: İzin yönetimi

### Gerçek API'ye Geçiş

Tüm servisler async/await pattern kullanır ve mock delay eklenmiştir. Gerçek API'ye geçiş için:

1. Servis dosyalarındaki `setTimeout` çağrılarını kaldırın
2. Mock veri yerine `fetch` veya `axios` ile API çağrısı yapın
3. Tip tanımlarını koruyun (TypeScript interfaces)
4. Hata yönetimi ekleyin

Örnek:
```typescript
// Mock Versiyon
async getApprovals(): Promise<ApprovalRequest[]> {
  await new Promise(resolve => setTimeout(resolve, 800))
  return mockData
}

// Gerçek API Versiyonu
async getApprovals(): Promise<ApprovalRequest[]> {
  const response = await fetch('/api/approvals')
  if (!response.ok) throw new Error('Failed to fetch approvals')
  return response.json()
}
```

## 🎯 Sonraki Adımlar

### Yakın Gelecek
1. **Dashboard Widget Sistemi**: Sürükle-bırak ile widget yönetimi
2. **Gelişmiş Filtreleme**: Tüm listelerde güçlü filtreleme
3. **Bulk İşlemler**: Toplu düzenleme ve silme özellikleri
4. **Excel Export**: Tabloları Excel'e aktarma
5. **PDF Raporlar**: Otomatik PDF oluşturma

### Orta Vadeli
1. **Backend Entegrasyonu**: Mock servisleri gerçek API'larla değiştir
2. **Dosya Yükleme**: Belge ve fatura yükleme sistemi
3. **Gerçek Zamanlı Bildirimler**: WebSocket entegrasyonu
4. **E-posta Servisi**: Otomatik e-posta gönderimi
5. **Döviz Kuru API**: Gerçek döviz kuru entegrasyonu

### Uzun Vadeli
1. **Çok Dilli Destek**: i18n implementasyonu
2. **Mobil Uygulama**: React Native ile mobil destek
3. **Gelişmiş Analytics**: AI destekli öngörü ve öneriler
4. **Entegrasyonlar**: Muhasebe yazılımları, bankalar
5. **API Gateway**: Mikro servis mimarisi

## 🔍 Özellik Detayları

### Rapor Oluşturma
1. Rapor tipini seçin (Gelir-Gider, Nakit Akış, vb.)
2. Parametreleri ayarlayın (Tarih, filtreler, gruplandırma)
3. "Raporu Oluştur" butonuna tıklayın
4. Sonuçları inceleyin (KPI, grafik, tablo)
5. İstenirse PDF veya Excel olarak indirin

### Onay Verme
1. Onay Merkezi'ne gidin
2. Filtreleri kullanarak ilgili onayları bulun
3. Tek tek veya toplu onaylama/reddetme
4. Yorum ekleyin (reddetmede zorunlu)
5. Onay geçmişini görüntüleyin

### Zamanlanmış Raporlar
1. "Yeni Zamanlanmış Rapor" butonuna tıklayın
2. Rapor tipini ve parametrelerini seçin
3. Sıklık ve zamanı ayarlayın
4. Alıcı e-posta adreslerini girin
5. Formatı seçin (PDF/Excel)
6. Oluştur ve otomatik gönderim başlar

### Workflow Oluşturma
1. Ayarlar > Workflow sekmesine gidin
2. "Yeni Workflow" butonuna tıklayın
3. Modül seçin (Finans, HR, vb.)
4. Koşulları tanımlayın (tutar aralığı, gün sayısı)
5. Her koşul için onaylayıcı rol belirleyin
6. Kaydedin ve aktif edin

### Form Yönetimi 🆕
1. Ayarlar > Formlar sekmesine gidin (veya `/settings/forms`)
2. Düzenlemek istediğiniz formu seçin
3. **Sol Panel**: Alanları görüntüle, sırala, görünürlüğü ayarla
4. **Sağ Panel**: Seçili alanın detaylarını düzenle
   - Görünürlük ve zorunluluk toggle'ları
   - Çoklu dil etiketleri (TR/EN/FR/AR)
   - Rol bazlı kısıtlamalar
5. Değişiklikleri kaydedin

## 📝 Notlar

- **Plan 1-5 Tamamlandı**: Frontend iskeleti, tüm ana modüller, raporlama, onaylar, ayarlar
- **Form Yönetimi Sistemi Eklendi** 🆕: Dinamik form yapısı, çoklu dil, rol bazlı erişim
- Tüm kimlik doğrulama ve veri işlemleri mock'tur
- Backend servisleri henüz geliştirilmemiştir
- Mock servisler gerçek API entegrasyonuna hazırdır
- Tüm sayfalar responsive ve production-ready
- TypeScript tip güvenliği sağlanmıştır
- Hata yönetimi ve toast bildirimleri eklenmiştir

## 📚 Ek Dokümantasyon

- **Form Yönetimi Sistemi**: Detaylı bilgi için `FORMS_IMPLEMENTATION.md` dosyasına bakın
- **Form Yönetimi Özet**: Hızlı başlangıç için `FORMS_SUMMARY.md` dosyasına bakın

## 🤝 Katkıda Bulunma

Bu projeye katkıda bulunmak için:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**Geliştirici Notu**: Bu sistem kurumsal ihtiyaçları karşılamak üzere tasarlanmış, ölçeklenebilir ve genişletilebilir bir iskelet sunar. Her modül bağımsız olarak geliştirilebilir ve entegre edilebilir. Plan 5 ile raporlama, onay merkezi, bildirimler, ve kapsamlı ayarlar sistemi eklenmiştir. Sistem artık "kurumsal ürün" seviyesine yakındır.
