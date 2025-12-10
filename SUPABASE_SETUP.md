# Supabase Setup Guide

## Step 1: Create Database Schema

1. **Supabase Dashboard'a git**: https://app.supabase.com
2. **SQL Editor'ı aç** (sol menüden "SQL Editor")
3. **"New query" butonuna tıkla**
4. **supabase-schema.sql dosyasının içeriğini kopyala yapıştır**
5. **"Run" butonuna tıkla** (veya Ctrl+Enter)
6. İşlem başarılı olursa "Success. No rows returned" mesajı göreceksiniz

## Step 2: Create Storage Buckets

1. **Storage** sayfasına git (sol menüden)
2. **"Create a new bucket" butonuna tıkla**
3. Aşağıdaki bucket'ları oluştur:

   **Bucket 1: documents**
   - Name: `documents`
   - Public bucket: ❌ HAYIR
   - File size limit: 50MB
   - Allowed MIME types: Boş bırak (tüm dosya tipleri)

   **Bucket 2: receipts**
   - Name: `receipts`
   - Public bucket: ❌ HAYIR
   - File size limit: 10MB
   - Allowed MIME types: image/*, application/pdf

   **Bucket 3: avatars**
   - Name: `avatars`
   - Public bucket: ✅ EVET (Public)
   - File size limit: 2MB
   - Allowed MIME types: image/*

   **Bucket 4: project-files**
   - Name: `project-files`
   - Public bucket: ❌ HAYIR
   - File size limit: 100MB
   - Allowed MIME types: Boş bırak

## Step 3: Configure Storage Policies

Her bucket için (avatars hariç) aşağıdaki policies eklenecek:

```sql
-- Documents bucket policies
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Receipts bucket policies
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Avatars bucket policies (public read, authenticated write)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Project files bucket policies
CREATE POLICY "Users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view project files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');
```

## Step 4: Verify Schema Creation

1. **Table Editor'a git** (sol menüden)
2. Şu tabloların oluşturulduğunu kontrol et:
   - ✅ profiles
   - ✅ facilities
   - ✅ facility_users
   - ✅ categories
   - ✅ transactions
   - ✅ budgets
   - ✅ employees
   - ✅ departments
   - ✅ leave_requests
   - ✅ projects
   - ✅ ve diğerleri (30+ tablo)

## Step 5: Run Data Migration

Tüm yukarıdaki adımlar tamamlandıktan sonra, terminal'de şu komutu çalıştır:

```bash
npx tsx scripts/migrate-data.ts
```

Bu komut:
- ✅ 6 facility (1 headquarters + 5 branches) oluşturur
- ✅ 3 kullanıcı oluşturur (admin, manager, headquarters)
- ✅ Kategorileri migrate eder
- ✅ Vendors/Customers'ı migrate eder
- ✅ Departmanları migrate eder
- ✅ Çalışanları migrate eder
- ✅ İzin taleplerini migrate eder

## Troubleshooting

### "Missing Supabase environment variables" hatası
- `.env` dosyasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerini kontrol et
- Supabase Dashboard → Settings → API'den doğru değerleri kopyala

### "Failed to connect to Supabase" hatası
- İnternet bağlantını kontrol et
- Supabase URL'in doğru olduğundan emin ol
- Anon key'in doğru olduğundan emin ol

### Schema creation errors
- SQL Editor'da error mesajını oku
- UUID extension yüklü olmalı (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
- auth.users tablosu otomatik olarak Supabase tarafından oluşturulur

## Next Steps

Migration başarılı olduktan sonra:
1. Supabase Dashboard → Table Editor'da verileri kontrol et
2. Authentication → Users'da 3 kullanıcının oluşturulduğunu gör
3. Uygulamayı başlat: `npm run dev`
4. admin@example.com / 123456 ile giriş yap
