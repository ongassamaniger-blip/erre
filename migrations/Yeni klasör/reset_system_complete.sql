-- =============================================================================
-- KOMPLE SİSTEM SIFIRLAMA SCRIPTI
-- Tüm kullanıcıları ve verileri siler, tablo yapılarını korur
-- =============================================================================
-- DİKKAT: Bu script TÜM VERİLERİ ve KULLANICILARI siler! Geri alınamaz!
-- =============================================================================

-- İlk önce foreign key kontrolünü geçici olarak devre dışı bırak
SET session_replication_role = 'replica';

-- =============================================================================
-- 1. MODÜL VERİLERİNİ TEMİZLE
-- =============================================================================

-- Bildirimler
TRUNCATE TABLE public.notifications CASCADE;

-- Onay sistemi
TRUNCATE TABLE public.approval_steps CASCADE;
TRUNCATE TABLE public.approval_requests CASCADE;

-- Proje verileri
TRUNCATE TABLE public.project_documents CASCADE;
TRUNCATE TABLE public.project_activities CASCADE;
TRUNCATE TABLE public.project_transactions CASCADE;
TRUNCATE TABLE public.project_tasks CASCADE;
TRUNCATE TABLE public.project_milestones CASCADE;
TRUNCATE TABLE public.project_team_members CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.project_categories CASCADE;
TRUNCATE TABLE public.project_types CASCADE;
TRUNCATE TABLE public.tasks CASCADE;
TRUNCATE TABLE public.milestones CASCADE;

-- Kurban verileri
TRUNCATE TABLE public.distribution_records CASCADE;
TRUNCATE TABLE public.qurban_donations CASCADE;
TRUNCATE TABLE public.qurban_schedules CASCADE;
TRUNCATE TABLE public.qurban_campaigns CASCADE;

-- Finans verileri
TRUNCATE TABLE public.budget_transfers CASCADE;
TRUNCATE TABLE public.budgets CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.chart_of_accounts CASCADE;

-- Tedarikçi/Müşteriler
TRUNCATE TABLE public.vendors_customers CASCADE;

-- İK verileri
TRUNCATE TABLE public.payroll_records CASCADE;
TRUNCATE TABLE public.payrolls CASCADE;
TRUNCATE TABLE public.leave_requests CASCADE;
TRUNCATE TABLE public.attendance_records CASCADE;
TRUNCATE TABLE public.attendance CASCADE;
TRUNCATE TABLE public.employees CASCADE;
TRUNCATE TABLE public.job_titles CASCADE;
TRUNCATE TABLE public.departments CASCADE;

-- Takvim
TRUNCATE TABLE public.calendar_events CASCADE;

-- Activity logs
TRUNCATE TABLE public.activity_logs CASCADE;

-- Settings (isteğe bağlı - sistem ayarlarını korumak için yorum satırı yapabilirsiniz)
TRUNCATE TABLE public.settings CASCADE;

-- =============================================================================
-- 2. TESİS VE KULLANICI İLİŞKİLERİNİ TEMİZLE
-- =============================================================================

TRUNCATE TABLE public.facility_users CASCADE;
TRUNCATE TABLE public.facilities CASCADE;

-- =============================================================================
-- 3. PROFİLLERİ TEMİZLE
-- =============================================================================

TRUNCATE TABLE public.profiles CASCADE;

-- =============================================================================
-- 4. AUTH KULLANICILARINI SİL (Supabase Authentication)
-- =============================================================================

DELETE FROM auth.users;

-- Foreign key kontrolünü tekrar aç
SET session_replication_role = 'origin';

-- =============================================================================
-- TAMAMLANDI
-- =============================================================================

SELECT '✅ TÜM VERİLER VE KULLANICILAR BAŞARIYLA SİLİNDİ!' as durum;
SELECT '📋 Tablo yapıları korundu, sistem sıfırlandı.' as bilgi;
SELECT '🔑 Şimdi yeni kullanıcı kaydı yapabilirsiniz.' as sonraki_adim;
