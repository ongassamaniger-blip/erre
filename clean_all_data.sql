-- =============================================================================
-- VERİ TEMİZLEME SCRIPTI
-- Tüm kullanıcı verilerini siler, tablo yapılarını korur
-- =============================================================================
-- DİKKAT: Bu script TÜM VERİLERİ siler! Geri alınamaz!
-- =============================================================================

-- İlk önce foreign key kontrolünü geçici olarak devre dışı bırak
SET session_replication_role = 'replica';

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

-- Tesis ve kullanıcı ilişkileri
TRUNCATE TABLE public.facility_users CASCADE;
TRUNCATE TABLE public.facilities CASCADE;

-- Profiller (auth.users'a bağlı)
TRUNCATE TABLE public.profiles CASCADE;

-- Foreign key kontrolünü tekrar aç
SET session_replication_role = 'origin';

-- =============================================================================
-- OPSİYONEL: Auth kullanıcılarını da silmek için aşağıdaki satırı açın
-- DİKKAT: Bu, Supabase Authentication'dan tüm kullanıcıları siler!
-- =============================================================================
-- DELETE FROM auth.users;

-- =============================================================================
SELECT 'Tüm veriler başarıyla temizlendi! Sistem sıfırlandı.' as status;
SELECT 'Şimdi yeni kullanıcı kaydı yapabilirsiniz.' as bilgi;
