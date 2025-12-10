-- =============================================================================
-- ADIM 8: KALAN ÇOKLU POLİTİKALARI TEMİZLE
-- =============================================================================

-- PROJECT_DOCUMENTS - fazla SELECT politikasını sil
DROP POLICY IF EXISTS "Users can view documents of projects they have access to" ON public.project_documents;

-- PROJECT_MILESTONES - _select_auth'u sil (_all_auth yeterli)
DROP POLICY IF EXISTS "project_milestones_select_auth" ON public.project_milestones;

-- PROJECT_TASKS - _select_auth'u sil (_all_auth yeterli)
DROP POLICY IF EXISTS "project_tasks_select_auth" ON public.project_tasks;

-- PROJECT_TEAM_MEMBERS - _select_auth'u sil (_all_auth yeterli)
DROP POLICY IF EXISTS "project_team_members_select_auth" ON public.project_team_members;

-- =============================================================================
SELECT 'Adım 8 tamamlandı: Kalan çoklu politikalar temizlendi' as status;
