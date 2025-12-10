-- =============================================================================
-- SUPABASE SIFIRLAMA SCRIPTI (Final Versiyon)
-- Tüm verileri ve kullanıcıları siler, mekanizmaları korur
-- =============================================================================
-- ✅ Trigger'lar korunur
-- ✅ Fonksiyonlar korunur
-- ✅ RLS politikaları korunur
-- ✅ İndeksler korunur
-- ✅ Tablo yapıları korunur
-- =============================================================================

-- 1. AUTH ŞEMASINDAKİ TÜM VERİLERİ TEMİZLE
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.saml_relay_states;
DELETE FROM auth.sso_domains;
DELETE FROM auth.sso_providers;
DELETE FROM auth.flow_state;
DELETE FROM auth.one_time_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- 2. FOREIGN KEY KONTROLÜNÜ GEÇİCİ DEVRE DIŞI BIRAK
SET session_replication_role = 'replica';

-- 3. TÜM PUBLIC TABLO VERİLERİNİ TEMİZLE

-- Bildirimler ve Sistem
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.approval_steps CASCADE;
TRUNCATE TABLE public.approval_requests CASCADE;
TRUNCATE TABLE public.activity_logs CASCADE;

-- Proje Verileri
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

-- Kurban Verileri
TRUNCATE TABLE public.distribution_records CASCADE;
TRUNCATE TABLE public.qurban_donations CASCADE;
TRUNCATE TABLE public.qurban_schedules CASCADE;
TRUNCATE TABLE public.qurban_campaigns CASCADE;

-- Finans Verileri
TRUNCATE TABLE public.budget_transfers CASCADE;
TRUNCATE TABLE public.budgets CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.chart_of_accounts CASCADE;
TRUNCATE TABLE public.vendors_customers CASCADE;

-- İK Verileri
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

-- Ayarlar
TRUNCATE TABLE public.settings CASCADE;

-- Kullanıcı İlişkileri
TRUNCATE TABLE public.facility_users CASCADE;
TRUNCATE TABLE public.facilities CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 4. FOREIGN KEY KONTROLÜNÜ GERİ AÇ
SET session_replication_role = 'origin';

-- =============================================================================
SELECT '✅ SIFIRLAMA TAMAMLANDI!' as durum;
SELECT '📋 Tablo yapıları, trigger''lar ve RLS politikaları korundu.' as bilgi;
SELECT '🔑 Şimdi yeni kullanıcı kaydı yapabilirsiniz.' as sonraki_adim;
