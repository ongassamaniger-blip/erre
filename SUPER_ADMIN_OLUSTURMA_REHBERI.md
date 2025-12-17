# 👤 Super Admin Kullanıcısı Oluşturma Rehberi

## Kullanıcı Bilgileri
- **Email**: erpsistemim@outlook.com
- **Şifre**: deneme123.
- **Rol**: Super Admin
- **Tesis**: Genel Merkez (GM01)

---

## 🚀 Yöntem 1: Supabase Dashboard (ÖNERİLEN)

### Adım 1: Kullanıcı Oluştur
1. **Supabase Dashboard**'a gidin
2. **Authentication** → **Users** sekmesine gidin
3. **Add User** butonuna tıklayın
4. Formu doldurun:
   - **Email**: `erpsistemim@outlook.com`
   - **Password**: `deneme123.`
   - **Auto Confirm User**: ✅ (işaretleyin)
   - **User Metadata**: 
     ```json
     {
       "name": "ERP Sistemim",
       "role": "Super Admin"
     }
     ```
5. **Create User** butonuna tıklayın

### Adım 2: Profile'ı Güncelle
Supabase SQL Editor'da çalıştırın:
```sql
-- migrations/create_super_admin_user.sql dosyasındaki YÖNTEM 2'yi çalıştırın
```

---

## 🔧 Yöntem 2: Edge Function ile Oluşturma

Eğer Edge Function deploy edilmişse, frontend'den oluşturabilirsiniz:

1. Super Admin olarak giriş yapın
2. **Ayarlar** → **Kullanıcı Yönetimi** sayfasına gidin
3. **Yeni Kullanıcı** butonuna tıklayın
4. Formu doldurun:
   - **İsim**: ERP Sistemim
   - **E-posta**: erpsistemim@outlook.com
   - **Şifre**: deneme123.
   - **Rol**: Super Admin
   - **Tesisler**: Genel Merkez'i seçin
5. **Kullanıcı Oluştur** butonuna tıklayın

---

## ✅ Kontrol

Kullanıcının doğru oluşturulduğunu kontrol edin:

```sql
SELECT 
  p.email,
  p.name,
  p.role,
  p.status,
  f.code as facility_code,
  f.name as facility_name
FROM public.profiles p
LEFT JOIN public.facility_users fu ON fu.user_id = p.id
LEFT JOIN public.facilities f ON f.id = fu.facility_id
WHERE p.email = 'erpsistemim@outlook.com';
```

**Beklenen Sonuç:**
- Email: erpsistemim@outlook.com
- Name: ERP Sistemim
- Role: Super Admin
- Status: active
- Facility: GM01 (Genel Merkez)

---

## 🔐 Giriş Testi

1. Çıkış yapın
2. `erpsistemim@outlook.com` / `deneme123.` ile giriş yapın
3. Genel Merkez tesisini seçin
4. Super Admin yetkilerine sahip olduğunuzu kontrol edin:
   - ✅ Kullanıcı Yönetimi sayfasına erişebilmelisiniz
   - ✅ Tüm tesisleri görebilmelisiniz
   - ✅ Tüm modüllere erişebilmelisiniz

---

## ⚠️ Sorun Giderme

### Kullanıcı oluşturulamıyor
- Supabase Dashboard'da kullanıcı oluşturmayı deneyin
- Email formatını kontrol edin
- Şifre uzunluğunu kontrol edin (min 8 karakter)

### Profile bulunamıyor
- Trigger'ın çalıştığını kontrol edin
- Manuel olarak profile oluşturun (YÖNTEM 2 SQL script'i)

### Rol Super Admin değil
- Profile'ı güncelleyin:
```sql
UPDATE public.profiles
SET role = 'Super Admin'
WHERE email = 'erpsistemim@outlook.com';
```

### Genel Merkez erişimi yok
- Facility erişimini ekleyin:
```sql
INSERT INTO public.facility_users (user_id, facility_id)
SELECT 
  (SELECT id FROM profiles WHERE email = 'erpsistemim@outlook.com'),
  (SELECT id FROM facilities WHERE code = 'GM01')
ON CONFLICT DO NOTHING;
```

---

**Son Güncelleme**: 2024

