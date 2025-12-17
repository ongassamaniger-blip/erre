# 🔧 Rol ve Tesis Erişimi Düzeltmesi

## Sorunlar

### 1. ❌ Her Kullanıcı Super Admin Olarak Görünüyordu
**Neden**: `authStore.ts`'de hardcoded `role: 'Super Admin'` vardı.

### 2. ❌ Her Kullanıcı Genel Merkez'e Erişebiliyordu
**Neden**: 
- `authStore.ts`'de hardcoded `facilityAccess: ['GM01']` vardı
- Trigger her kullanıcıya otomatik GM01 ekliyordu

---

## Yapılan Düzeltmeler

### 1. ✅ authStore.ts Düzeltildi

**Önceki Kod:**
```typescript
const user: User = {
  role: 'Super Admin',  // ❌ Hardcoded
  facilityAccess: ['GM01']  // ❌ Hardcoded
}
```

**Yeni Kod:**
```typescript
// Profile'dan rolü çek
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single()

// Facility'leri çek
const { data: facilityUsers } = await supabase
  .from('facility_users')
  .select('facility_id, facilities(code)')
  .eq('user_id', session.user.id)

const facilityAccess = (facilityUsers || [])
  .map((fu: any) => fu.facilities?.code)
  .filter(Boolean) as string[]

const user: User = {
  role: (profile.role as any) || 'User',  // ✅ Database'den
  facilityAccess: facilityAccess  // ✅ Database'den
}
```

### 2. ✅ Trigger Düzeltildi

**Önceki Kod:**
```sql
SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO v_is_first_user;
```

**Yeni Kod:**
```sql
SELECT COUNT(*) = 0 INTO v_is_first_user FROM public.profiles;
```

### 3. ✅ initializeAuth ve login Fonksiyonları Güncellendi

Her iki fonksiyon da artık:
- Profile'dan rolü çekiyor
- Facility'leri database'den çekiyor
- Hardcoded değerler kullanmıyor

---

## Yapılacaklar

### 1. Migration'ı Çalıştırın
```sql
-- Supabase SQL Editor'da:
-- migrations/fix_user_role_trigger.sql
```

### 2. Mevcut Kullanıcıları Kontrol Edin

Eğer mevcut kullanıcılar yanlış rol/facility'ye sahipse:

```sql
-- Kullanıcının rolünü kontrol et
SELECT id, email, name, role FROM profiles WHERE email = 'mehmet@example.com';

-- Kullanıcının facility erişimlerini kontrol et
SELECT fu.user_id, fu.facility_id, f.code, f.name 
FROM facility_users fu
JOIN facilities f ON f.id = fu.facility_id
WHERE fu.user_id = (SELECT id FROM profiles WHERE email = 'mehmet@example.com');

-- Yanlış erişimleri sil
DELETE FROM facility_users 
WHERE user_id = 'USER_ID' 
AND facility_id = (SELECT id FROM facilities WHERE code = 'GM01');
```

### 3. Test Edin

1. Çıkış yapın
2. Mehmet olarak giriş yapın
3. Sadece Yetimhane tesisinin göründüğünü kontrol edin
4. Genel Merkez'in görünmediğini kontrol edin
5. Admin rolüyle sınırlı yetkilere sahip olduğunu kontrol edin

---

## Beklenen Sonuç

### Mehmet (Admin, Yetimhane):
- ✅ Sadece Yetimhane tesisini görebilir
- ✅ Genel Merkez'i göremez
- ✅ Admin yetkilerine sahiptir (Super Admin değil)
- ✅ Kullanıcı Yönetimi sayfasına erişemez

### Super Admin (Genel Merkez):
- ✅ Tüm tesisleri görebilir
- ✅ Super Admin yetkilerine sahiptir
- ✅ Kullanıcı Yönetimi sayfasına erişebilir

---

**Son Güncelleme**: 2024

