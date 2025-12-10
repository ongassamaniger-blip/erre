-- =============================================================================
-- ADIM 6: PROJECT_TRANSACTIONS, PROJECT_DOCUMENTS, PROJECTS
-- =============================================================================

-- PROJECT_TRANSACTIONS tablosu
DROP POLICY IF EXISTS "Facility users can view project transactions" ON public.project_transactions;
DROP POLICY IF EXISTS "Facility users can insert project transactions" ON public.project_transactions;
DROP POLICY IF EXISTS "Facility users can update project transactions" ON public.project_transactions;
DROP POLICY IF EXISTS "Facility users can delete project transactions" ON public.project_transactions;

CREATE POLICY "project_transactions_select_auth" ON public.project_transactions 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "project_transactions_insert_auth" ON public.project_transactions 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "project_transactions_update_auth" ON public.project_transactions 
  FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "project_transactions_delete_auth" ON public.project_transactions 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- PROJECT_DOCUMENTS tablosu
DROP POLICY IF EXISTS "Users can upload documents to projects" ON public.project_documents;
DROP POLICY IF EXISTS "Users can delete their own documents or project managers" ON public.project_documents;

CREATE POLICY "project_documents_select_all" ON public.project_documents 
  FOR SELECT USING (true);

CREATE POLICY "project_documents_insert_auth" ON public.project_documents 
  FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');

CREATE POLICY "project_documents_delete_auth" ON public.project_documents 
  FOR DELETE USING ((select auth.role()) = 'authenticated');

-- PROJECTS tablosu - çoklu politikaları temizle
DROP POLICY IF EXISTS "Users can view own facility projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;

CREATE POLICY "projects_select_auth" ON public.projects 
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- =============================================================================
SELECT 'Adım 6 tamamlandı: project_transactions, project_documents, projects düzeltildi' as status;
