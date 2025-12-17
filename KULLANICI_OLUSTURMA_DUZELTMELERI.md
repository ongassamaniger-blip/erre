# 🔧 Kullanıcı Oluşturma Düzeltmeleri

## Sorunlar ve Çözümler

### 1. ✅ Rol Sorunu - ÇÖZÜLDÜ
**Sorun**: Tüm kullanıcılar Super Admin olarak oluşturuluyordu.

**Çözüm**:
- Trigger güncellendi: `user_metadata`'dan rolü okuyor
- Edge Function güncellendi: `user_metadata`'ya rolü ekliyor
- Profile güncellemesi korundu (çift kontrol)

**Migration**: `migrations/fix_user_role_trigger.sql`

### 2. ✅ Tesis Erişimi Sorunu - ÇÖZÜLDÜ
**Sorun**: Kullanıcı sadece bir tesis seçse bile, trigger otomatik olarak GM01 (Genel Merkez) ekliyordu.

**Çözüm**:
- Trigger güncellendi: Sadece **ilk kullanıcı** için otomatik GM01 ekleniyor
- Diğer kullanıcılar için: Edge Function'dan gelen `facilityIds` kullanılıyor
- Edge Function güncellendi: Mevcut erişimleri kontrol edip sadece yeni olanları ekliyor

**Migration**: `migrations/fix_user_role_trigger.sql` (güncellendi)

---

## Yapılacaklar

### 1. Migration'ı Çalıştırın
```sql
-- Supabase SQL Editor'da çalıştırın:
-- migrations/fix_user_role_trigger.sql
```

### 2. Edge Function'ı Yeniden Deploy Edin
- Supabase Dashboard → Edge Functions → `create-user`
- Güncellenmiş kodu yapıştırın
- Deploy edin

### 3. Test Edin
- Yeni kullanıcı oluşturun
- Rolün doğru atandığını kontrol edin
- Sadece seçilen tesislere erişim verildiğini kontrol edin

---

## Nasıl Çalışıyor

### Rol Atama:
1. Form'da rol seçilir
2. Edge Function `user_metadata`'ya rolü ekler
3. Trigger çalışır ve `user_metadata`'dan rolü okur
4. Edge Function profile'ı günceller (çift kontrol)
5. Rol doğru şekilde atanır ✅

### Tesis Erişimi:
1. Form'da tesisler seçilir
2. Edge Function `facilityIds` alır
3. Trigger sadece ilk kullanıcı için GM01 ekler
4. Edge Function mevcut erişimleri kontrol eder
5. Sadece seçilen tesislere erişim verilir ✅

---

## Önemli Notlar

- **İlk kullanıcı**: Otomatik olarak Super Admin rolü ve GM01 erişimi alır
- **Diğer kullanıcılar**: Seçilen rol ve tesislere göre oluşturulur
- **Tesis seçimi**: En az 1 tesis seçilmelidir (form validation)
- **Rol seçimi**: Super Admin, Admin, Manager, User seçenekleri mevcut

---

**Son Güncelleme**: 2024

