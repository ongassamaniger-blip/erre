-- Function to update project task statistics
CREATE OR REPLACE FUNCTION update_project_task_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_project_id UUID;
    total_tasks INTEGER;
    completed INTEGER;
    overdue INTEGER;
    new_progress INTEGER;
BEGIN
    -- Determine project_id based on operation
    IF (TG_OP = 'DELETE') THEN
        target_project_id := OLD.project_id;
    ELSE
        target_project_id := NEW.project_id;
    END IF;

    -- Calculate stats
    SELECT count(*),
           count(*) FILTER (WHERE status = 'completed'),
           count(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'completed')
    INTO total_tasks, completed, overdue
    FROM project_tasks
    WHERE project_id = target_project_id;

    -- Calculate progress
    IF total_tasks > 0 THEN
        new_progress := (completed::FLOAT / total_tasks::FLOAT * 100)::INTEGER;
    ELSE
        new_progress := 0;
    END IF;

    -- Update project
    UPDATE projects
    SET task_count = total_tasks,
        completed_tasks = completed,
        overdue_tasks = overdue,
        progress = new_progress,
        updated_at = NOW()
    WHERE id = target_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for project_tasks
DROP TRIGGER IF EXISTS trg_update_project_task_stats ON project_tasks;
CREATE TRIGGER trg_update_project_task_stats
AFTER INSERT OR UPDATE OR DELETE ON project_tasks
FOR EACH ROW EXECUTE FUNCTION update_project_task_stats();


-- Function to update project finance statistics
CREATE OR REPLACE FUNCTION update_project_finance_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_project_id UUID;
    total_spent DECIMAL(15,2);
BEGIN
    -- Determine project_id based on operation
    IF (TG_OP = 'DELETE') THEN
        target_project_id := OLD.project_id;
    ELSE
        target_project_id := NEW.project_id;
    END IF;

    -- Calculate total spent (approved expenses)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_spent
    FROM project_transactions
    WHERE project_id = target_project_id
    AND type = 'expense'
    AND status = 'approved';

    -- Update project
    UPDATE projects
    SET spent = total_spent,
        updated_at = NOW()
    WHERE id = target_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for project_transactions
DROP TRIGGER IF EXISTS trg_update_project_finance_stats ON project_transactions;
CREATE TRIGGER trg_update_project_finance_stats
AFTER INSERT OR UPDATE OR DELETE ON project_transactions
FOR EACH ROW EXECUTE FUNCTION update_project_finance_stats();


-- Function to update project team statistics
CREATE OR REPLACE FUNCTION update_project_team_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_project_id UUID;
    member_count INTEGER;
BEGIN
    -- Determine project_id based on operation
    IF (TG_OP = 'DELETE') THEN
        target_project_id := OLD.project_id;
    ELSE
        target_project_id := NEW.project_id;
    END IF;

    -- Calculate team size
    SELECT count(*)
    INTO member_count
    FROM project_team_members
    WHERE project_id = target_project_id;

    -- Update project
    UPDATE projects
    SET team_size = member_count,
        updated_at = NOW()
    WHERE id = target_project_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for project_team_members
DROP TRIGGER IF EXISTS trg_update_project_team_stats ON project_team_members;
CREATE TRIGGER trg_update_project_team_stats
AFTER INSERT OR DELETE ON project_team_members
FOR EACH ROW EXECUTE FUNCTION update_project_team_stats();

-- ==========================================
-- BACKFILL EXISTING DATA
-- ==========================================

-- Backfill task stats
UPDATE projects p
SET
    task_count = (SELECT count(*) FROM project_tasks WHERE project_id = p.id),
    completed_tasks = (SELECT count(*) FROM project_tasks WHERE project_id = p.id AND status = 'completed'),
    overdue_tasks = (SELECT count(*) FROM project_tasks WHERE project_id = p.id AND due_date < CURRENT_DATE AND status != 'completed'),
    progress = CASE
        WHEN (SELECT count(*) FROM project_tasks WHERE project_id = p.id) > 0 THEN
            ((SELECT count(*) FROM project_tasks WHERE project_id = p.id AND status = 'completed')::FLOAT / (SELECT count(*) FROM project_tasks WHERE project_id = p.id)::FLOAT * 100)::INTEGER
        ELSE 0
    END;

-- Backfill finance stats
UPDATE projects p
SET spent = COALESCE((
    SELECT SUM(amount)
    FROM project_transactions
    WHERE project_id = p.id
    AND type = 'expense'
    AND status = 'approved'
), 0);

-- Backfill team stats
UPDATE projects p
SET team_size = (SELECT count(*) FROM project_team_members WHERE project_id = p.id);
