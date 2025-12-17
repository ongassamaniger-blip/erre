# 🔧 Edge Function Debug Rehberi

## Sorun: Kullanıcı Oluşturma Çalışmıyor

### 1. Edge Function Deploy Kontrolü

**Supabase Dashboard'da kontrol edin:**
1. **Edge Functions** bölümüne gidin
2. `create-user` fonksiyonunun listede olduğunu kontrol edin
3. **Logs** sekmesine gidin ve hataları kontrol edin

### 2. Environment Variables Kontrolü

Edge Function'ın çalışması için şu environment variable'lar gerekli:
- `SUPABASE_URL` - Otomatik olarak sağlanır
- `SUPABASE_SERVICE_ROLE_KEY` - Otomatik olarak sağlanır

**Kontrol:**
- Supabase Dashboard → Edge Functions → `create-user` → Settings
- Environment variables'ların otomatik olarak set edildiğini kontrol edin

### 3. Test Etme

**Supabase Dashboard'dan test:**
1. Edge Functions → `create-user` → Test
2. Request body:
```json
{
  "email": "test@example.com",
  "password": "test123456",
  "name": "Test User",
  "role": "User",
  "facilityIds": []
}
```

### 4. Frontend'den Test

**Browser Console'da kontrol edin:**
- F12 → Console
- Kullanıcı oluşturmayı deneyin
- Hata mesajlarını kontrol edin

### 5. Yaygın Hatalar ve Çözümleri

#### Hata: "Edge Function not found"
**Çözüm:** Edge Function'ı deploy edin

#### Hata: "Missing Supabase environment variables"
**Çözüm:** Supabase Dashboard'da environment variables'ları kontrol edin

#### Hata: "User creation failed"
**Çözüm:** 
- Email formatını kontrol edin
- Şifre uzunluğunu kontrol edin (min 8 karakter)
- Email'in zaten kullanılıp kullanılmadığını kontrol edin

#### Hata: "Profile update error"
**Çözüm:**
- `handle_new_user` trigger'ının çalıştığını kontrol edin
- Profiles tablosunun doğru yapılandırıldığını kontrol edin

### 6. Log Kontrolü

**Edge Function Logs:**
1. Supabase Dashboard → Edge Functions → `create-user` → Logs
2. Son çalıştırmaları kontrol edin
3. Error mesajlarını okuyun

**Frontend Console:**
- Browser Console'da error mesajlarını kontrol edin
- Network tab'ında Edge Function çağrısını kontrol edin

### 7. Manuel Test (Alternatif)

Eğer Edge Function çalışmıyorsa, Supabase Dashboard'dan manuel kullanıcı oluşturabilirsiniz:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. **Add User** → **Create new user**
3. Email ve password girin
4. User oluşturulduktan sonra, `profiles` tablosunda rolü güncelleyin
5. `facility_users` tablosuna facility erişimi ekleyin

---

## Güncellenen Kod

### Edge Function İyileştirmeleri:
- ✅ Environment variable kontrolü eklendi
- ✅ Input validation eklendi
- ✅ Daha detaylı error mesajları
- ✅ Console logging eklendi

### Frontend İyileştirmeleri:
- ✅ Daha iyi error handling
- ✅ Console logging eklendi
- ✅ Error mesajları iyileştirildi

---

## Sonraki Adımlar

1. Edge Function'ı yeniden deploy edin
2. Browser Console'da test edin
3. Edge Function logs'larını kontrol edin
4. Hata alırsanız, error mesajını paylaşın

