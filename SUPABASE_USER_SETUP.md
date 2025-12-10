# Test Kullanıcıları Oluşturma

Supabase Dashboard'da aşağıdaki kullanıcıları oluşturun:

## Adım 1: Supabase Dashboard'a Git
1. https://app.supabase.com açın
2. Projenizi seçin
3. Sol menüden **Authentication** > **Users**'a tıklayın

## Adım 2: Kullanıcıları Ekle

### Kullanıcı 1: Super Admin
- **Add User** butonuna tıklayın
- **Email**: `admin@example.com`
- **Password**: `123456`
- **Auto Confirm User**: ✅ İşaretle (önemli!)
- **Create User** tıklayın

### Kullanıcı 2: Manager
- **Add User** butonuna tıklayın
- **Email**: `manager@example.com`
- **Password**: `123456`
- **Auto Confirm User**: ✅ İşaretle
- **Create User** tıklayın

### Kullanıcı 3: Headquarters
- **Add User** butonuna tıklayın
- **Email**: `headquarters@example.com`
- **Password**: `123456`
- **Auto Confirm User**: ✅ İşaretle
- **Create User** tıklayın

## Adım 3: Profilleri Oluştur

Her kullanıcı için aşağıdaki SQL'i çalıştırmanız gerekiyor (SQL Editor'da):

```sql
-- Admin kullanıcısının ID'sini alın (Users sayfasından kopyalayın)
-- veya aşağıdaki sorguyla bulun:
SELECT id, email FROM auth.users;

-- Profilleri oluştur (USER_ID'leri yukarıdaki sorgudan alın)
INSERT INTO profiles (id, email, name, role)
VALUES 
  ('ADMIN_USER_ID', 'admin@example.com', 'Ahmet Yılmaz', 'Super Admin'),
  ('MANAGER_USER_ID', 'manager@example.com', 'Ayşe Demir', 'Manager'),
  ('HQ_USER_ID', 'headquarters@example.com', 'Genel Merkez Yöneticisi', 'Super Admin');

-- Facility access (USER_ID ve FACILITY_ID'leri değiştirin)
-- Önce facility ID'lerini bulun:
SELECT id, code, name FROM facilities;

-- Ardından kullanıcılara erişim verin:
INSERT INTO facility_users (user_id, facility_id)
VALUES
  -- Admin: Tüm tesislere erişim
  ('ADMIN_USER_ID', 'GM01_FACILITY_ID'),
  ('ADMIN_USER_ID', 'NIM01_FACILITY_ID'),
  ('ADMIN_USER_ID', 'IST01_FACILITY_ID'),
  ('ADMIN_USER_ID', 'ANK01_FACILITY_ID'),
  -- Manager: Sadece İstanbul
  ('MANAGER_USER_ID', 'IST01_FACILITY_ID'),
  -- HQ: Sadece Genel Merkez
  ('HQ_USER_ID', 'GM01_FACILITY_ID');
```

## Alternatif: Otomatik Script

Daha kolay olması için SQL Editor'da şunu çalıştırabilirsiniz:

```sql
-- Kullanıcı ID'lerini al
DO $$
DECLARE
  admin_id UUID;
  manager_id UUID;
  hq_id UUID;
  gm_facility UUID;
  ist_facility UUID;
  nim_facility UUID;
  ank_facility UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com';
  SELECT id INTO manager_id FROM auth.users WHERE email = 'manager@example.com';
  SELECT id INTO hq_id FROM auth.users WHERE email = 'headquarters@example.com';
  
  -- Get facility IDs
  SELECT id INTO gm_facility FROM facilities WHERE code = 'GM01';
  SELECT id INTO ist_facility FROM facilities WHERE code = 'IST01';
  SELECT id INTO nim_facility FROM facilities WHERE code = 'NIM01';
  SELECT id INTO ank_facility FROM facilities WHERE code = 'ANK01';
  
  -- Create profiles
  INSERT INTO profiles (id, email, name, role) VALUES
    (admin_id, 'admin@example.com', 'Ahmet Yılmaz', 'Super Admin'),
    (manager_id, 'manager@example.com', 'Ayşe Demir', 'Manager'),
    (hq_id, 'headquarters@example.com', 'Genel Merkez Yöneticisi', 'Super Admin')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create facility access
  INSERT INTO facility_users (user_id, facility_id) VALUES
    (admin_id, gm_facility),
    (admin_id, ist_facility),
    (admin_id, nim_facility),
    (admin_id, ank_facility),
    (manager_id, ist_facility),
    (hq_id, gm_facility)
  ON CONFLICT (user_id, facility_id) DO NOTHING;
END $$;
```

## Doğrulama

Kullanıcılar oluşturulduktan sonra, şunu kontrol edin:

```sql
-- Tüm kullanıcıları ve profillerini gör
SELECT 
  u.email,
  p.name,
  p.role,
  array_agg(f.code) as facilities
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN facility_users fu ON fu.user_id = u.id
LEFT JOIN facilities f ON f.id = fu.facility_id
GROUP BY u.email, p.name, p.role;
```

Beklenen çıktı:
```
admin@example.com | Ahmet Yılmaz | Super Admin | {GM01,NIM01,IST01,ANK01}
manager@example.com | Ayşe Demir | Manager | {IST01}
headquarters@example.com | Genel Merkez Yöneticisi | Super Admin | {GM01}
```

Kullanıcılar hazır olduğunda bana haber verin, uygulamayı test edelim! 🚀
