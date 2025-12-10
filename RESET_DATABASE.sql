-- ============================================
-- NGO Management System - DATABASE RESET SCRIPT
-- ============================================
-- Bu script tüm tablolardaki verileri siler ama tablo yapısını korur
-- DİKKAT: Bu işlem geri alınamaz! Tüm veriler silinecek!
-- ============================================

-- Önce foreign key kısıtlamalarını devre dışı bırak
SET session_replication_role = 'replica';

-- ============================================
-- TÜM VERİLERİ SİL (Sıra önemli - bağımlılıklar)
-- ============================================

-- System Tables
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.approval_steps CASCADE;
TRUNCATE TABLE public.approval_requests CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.settings CASCADE;

-- Qurban Module
TRUNCATE TABLE public.distribution_records CASCADE;
TRUNCATE TABLE public.qurban_schedules CASCADE;
TRUNCATE TABLE public.qurban_donations CASCADE;
TRUNCATE TABLE public.qurban_campaigns CASCADE;

-- Projects Module
TRUNCATE TABLE public.project_activities CASCADE;
TRUNCATE TABLE public.project_documents CASCADE;
TRUNCATE TABLE public.project_team_members CASCADE;
TRUNCATE TABLE public.project_milestones CASCADE;
TRUNCATE TABLE public.project_tasks CASCADE;
TRUNCATE TABLE public.projects CASCADE;

-- Finance Module
TRUNCATE TABLE public.budget_transfers CASCADE;
TRUNCATE TABLE public.budgets CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.chart_of_accounts CASCADE;
TRUNCATE TABLE public.vendors_customers CASCADE;
TRUNCATE TABLE public.categories CASCADE;

-- HR Module
TRUNCATE TABLE public.payrolls CASCADE;
TRUNCATE TABLE public.attendance_records CASCADE;
TRUNCATE TABLE public.leave_requests CASCADE;
TRUNCATE TABLE public.employees CASCADE;
TRUNCATE TABLE public.departments CASCADE;

-- Core Tables (Dikkat: Kullanıcıları da siler!)
TRUNCATE TABLE public.facility_users CASCADE;
TRUNCATE TABLE public.facilities CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Foreign key kısıtlamalarını tekrar etkinleştir
SET session_replication_role = 'origin';

-- ============================================
-- VARSAYILAN TESİSİ YENİDEN OLUŞTUR
-- ============================================
INSERT INTO public.facilities (name, code, type, location, enabled_modules)
VALUES ('Genel Merkez', 'GM01', 'headquarters', 'İstanbul, Türkiye', ARRAY['finance', 'hr', 'projects', 'qurban']);

-- ============================================
-- VARSAYILAN KATEGORİLERİ OLUŞTUR
-- ============================================
INSERT INTO public.categories (name, type, facility_id) VALUES
  ('Bağışlar', 'income', NULL),
  ('Kurban Bağışları', 'income', NULL),
  ('Genel Merkez Bütçe Aktarımı', 'income', NULL),
  ('Personel Giderleri', 'expense', NULL),
  ('Kira', 'expense', NULL),
  ('Faturalar', 'expense', NULL),
  ('Proje Giderleri', 'expense', NULL),
  ('Diğer Gelirler', 'income', NULL),
  ('Diğer Giderler', 'expense', NULL);

-- ============================================
-- BİTTİ
-- ============================================
-- NOT: Bu script çalıştırıldıktan sonra:
-- 1. Auth kullanıcıları Supabase Authentication'dan manuel silinmeli
-- 2. Yeni kullanıcı kaydı yapıldığında otomatik olarak Super Admin olacak
-- ============================================

SELECT 'Veritabanı başarıyla sıfırlandı! Tüm veriler silindi.' as status;
